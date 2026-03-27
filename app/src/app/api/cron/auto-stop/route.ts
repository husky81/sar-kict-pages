import { prisma } from "@/lib/prisma";
import { ec2 } from "@/lib/aws";
import { StopInstancesCommand } from "@aws-sdk/client-ec2";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // isActive=true이고 주말 또는 야간 종료가 켜진 정책 조회
    const policies = await prisma.autoStopPolicy.findMany({
      where: {
        isActive: true,
        OR: [{ stopOnWeekends: true }, { stopAtNight: true }],
      },
      include: {
        user: {
          include: {
            instances: true,
          },
        },
      },
    });

    // 현재 KST 시간
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstDay = kst.getUTCDay(); // 0=일, 6=토
    const kstHour = kst.getUTCHours();

    const isWeekend = kstDay === 0 || kstDay === 6;

    let checked = 0;
    let stopped = 0;
    const details: { userId: string; reason: string; instanceId: string }[] = [];

    for (const policy of policies) {
      checked++;

      const runningInstances = policy.user.instances.filter(
        (inst) => inst.status === "RUNNING" && inst.instanceId
      );

      if (runningInstances.length === 0) continue;

      let shouldStop = false;
      let reason = "";

      // 주말 체크
      if (policy.stopOnWeekends && isWeekend) {
        shouldStop = true;
        reason = `주말 자동 종료 (KST ${kstDay === 0 ? "일" : "토"}요일)`;
      }

      // 야간 체크
      if (
        policy.stopAtNight &&
        policy.nightStartHour !== null &&
        policy.nightEndHour !== null
      ) {
        const start = policy.nightStartHour;
        const end = policy.nightEndHour;
        let isNight = false;

        if (start > end) {
          // 자정 넘김 (예: 22시~6시)
          isNight = kstHour >= start || kstHour < end;
        } else {
          isNight = kstHour >= start && kstHour < end;
        }

        if (isNight) {
          shouldStop = true;
          reason = reason
            ? `${reason} + 야간 (${start}시~${end}시)`
            : `야간 자동 종료 (${start}시~${end}시, 현재 KST ${kstHour}시)`;
        }
      }

      if (!shouldStop) continue;

      for (const instance of runningInstances) {
        try {
          await ec2.send(
            new StopInstancesCommand({
              InstanceIds: [instance.instanceId!],
            })
          );

          await prisma.instance.update({
            where: { id: instance.id },
            data: { status: "STOPPING" },
          });

          // RunningLog 닫기
          const openLog = await prisma.runningLog.findFirst({
            where: { instanceId: instance.id, stoppedAt: null },
            orderBy: { startedAt: "desc" },
          });
          if (openLog) {
            await prisma.runningLog.update({
              where: { id: openLog.id },
              data: { stoppedAt: new Date() },
            });
          }

          stopped++;
          details.push({
            userId: policy.userId,
            reason,
            instanceId: instance.instanceId!,
          });

          console.log(
            `[auto-stop] Stopped ${instance.instanceId} for user ${policy.userId}: ${reason}`
          );
        } catch (err) {
          console.error(
            `[auto-stop] Failed to stop ${instance.instanceId}:`,
            err
          );
        }
      }
    }

    return NextResponse.json({ checked, stopped, details });
  } catch (error) {
    console.error("[auto-stop] Cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
