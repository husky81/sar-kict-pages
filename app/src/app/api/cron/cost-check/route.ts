import { prisma } from "@/lib/prisma";
import { ec2 } from "@/lib/aws";
import { StopInstancesCommand } from "@aws-sdk/client-ec2";
import { getPreset } from "@/lib/instance-types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // isActive=true인 비용 한도 조회
    const costLimits = await prisma.costLimit.findMany({
      where: { isActive: true },
      include: {
        user: {
          include: {
            instances: true,
          },
        },
      },
    });

    // KST 기준 오늘 시작/이번 달 시작
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstYear = kst.getUTCFullYear();
    const kstMonth = kst.getUTCMonth();
    const kstDate = kst.getUTCDate();

    // KST 오늘 0시를 UTC로 변환
    const todayStartKST = new Date(
      Date.UTC(kstYear, kstMonth, kstDate) - 9 * 60 * 60 * 1000
    );
    // KST 이번 달 1일 0시를 UTC로 변환
    const monthStartKST = new Date(
      Date.UTC(kstYear, kstMonth, 1) - 9 * 60 * 60 * 1000
    );

    let checked = 0;
    let stopped = 0;
    let warned = 0;
    const details: {
      userId: string;
      limitType: string;
      cost: number;
      limit: number;
      action: string;
    }[] = [];

    // 사용자별로 그룹화
    const userLimits = new Map<string, typeof costLimits>();
    for (const limit of costLimits) {
      const existing = userLimits.get(limit.userId) ?? [];
      existing.push(limit);
      userLimits.set(limit.userId, existing);
    }

    for (const [userId, limits] of userLimits) {
      checked++;

      for (const limit of limits) {
        const since =
          limit.limitType === "DAILY" ? todayStartKST : monthStartKST;

        // RunningLog 기반 비용 계산
        const cost = await calculateUserCost(userId, since);

        // 한도 초과 → 인스턴스 중지
        if (cost >= limit.limitAmount) {
          const runningInstances = limit.user.instances.filter(
            (inst) => inst.status === "RUNNING" && inst.instanceId
          );

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
              console.log(
                `[cost-check] Stopped ${instance.instanceId} for user ${userId}: cost $${cost.toFixed(2)} >= limit $${limit.limitAmount} (${limit.limitType})`
              );
            } catch (err) {
              console.error(
                `[cost-check] Failed to stop instance for user ${userId}:`,
                err
              );
            }
          }

          details.push({
            userId,
            limitType: limit.limitType,
            cost: Math.round(cost * 100) / 100,
            limit: limit.limitAmount,
            action: "stopped",
          });

          await prisma.costLimit.update({
            where: { id: limit.id },
            data: { lastNotifiedAt: now },
          });
        }
        // 알림 기준 초과 → 경고만 (lastNotifiedAt 업데이트)
        else if (limit.notifyAt && cost >= limit.notifyAt) {
          await prisma.costLimit.update({
            where: { id: limit.id },
            data: { lastNotifiedAt: now },
          });

          warned++;
          details.push({
            userId,
            limitType: limit.limitType,
            cost: Math.round(cost * 100) / 100,
            limit: limit.limitAmount,
            action: "warned",
          });
        }
      }
    }

    return NextResponse.json({ checked, stopped, warned, details });
  } catch (error) {
    console.error("[cost-check] Cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** RunningLog 기반으로 사용자의 비용을 계산합니다 (USD) */
async function calculateUserCost(
  userId: string,
  since: Date
): Promise<number> {
  const logs = await prisma.runningLog.findMany({
    where: {
      userId,
      startedAt: { lte: new Date() },
      OR: [{ stoppedAt: null }, { stoppedAt: { gte: since } }],
    },
    include: { instance: { select: { instanceType: true, status: true } } },
  });

  let totalCost = 0;
  const now = new Date();

  for (const log of logs) {
    const start = log.startedAt < since ? since : log.startedAt;
    let end: Date;
    if (log.stoppedAt) {
      end = log.stoppedAt;
    } else if (log.instance.status === "RUNNING") {
      end = now;
    } else {
      continue;
    }
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const preset = getPreset(log.instance.instanceType);
    totalCost += hours * preset.hourlyPrice;
  }

  return totalCost;
}
