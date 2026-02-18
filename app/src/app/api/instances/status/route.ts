import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ec2 } from "@/lib/aws";
import { DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { NextResponse } from "next/server";
import type { InstanceStatus } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.status !== "APPROVED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const instance = await prisma.instance.findUnique({
    where: { userId: session.user.id },
  });

  if (!instance?.instanceId) {
    return NextResponse.json({ instance: null });
  }

  try {
    const result = await ec2.send(
      new DescribeInstancesCommand({
        InstanceIds: [instance.instanceId],
      })
    );

    const awsInstance = result.Reservations?.[0]?.Instances?.[0];
    if (!awsInstance) {
      return NextResponse.json({ instance: null });
    }

    const awsState = awsInstance.State?.Name;
    const publicIp = awsInstance.PublicIpAddress || null;

    const statusMap: Record<string, InstanceStatus> = {
      pending: "PENDING",
      running: "RUNNING",
      stopping: "STOPPING",
      stopped: "STOPPED",
      "shutting-down": "STOPPING",
      terminated: "TERMINATED",
    };

    const mappedStatus = statusMap[awsState || ""] || instance.status;

    if (mappedStatus !== instance.status || publicIp !== instance.publicIp) {
      const now = new Date();

      // RunningLog: RUNNING 전환 시 열린 로그가 없으면 새로 생성
      if (mappedStatus === "RUNNING" && instance.status !== "RUNNING") {
        const openLog = await prisma.runningLog.findFirst({
          where: { instanceId: instance.id, stoppedAt: null },
        });
        if (!openLog) {
          await prisma.runningLog.create({
            data: { instanceId: instance.id, startedAt: now },
          });
        }
      }

      // RunningLog: STOPPED/TERMINATED 전환 시 열린 로그 닫기
      if (
        (mappedStatus === "STOPPED" || mappedStatus === "TERMINATED") &&
        instance.status === "RUNNING"
      ) {
        const openLog = await prisma.runningLog.findFirst({
          where: { instanceId: instance.id, stoppedAt: null },
          orderBy: { startedAt: "desc" },
        });
        if (openLog) {
          const durationMin = Math.round(
            (now.getTime() - openLog.startedAt.getTime()) / 60000
          );
          await prisma.runningLog.update({
            where: { id: openLog.id },
            data: { stoppedAt: now, durationMin },
          });
        }
      }

      await prisma.instance.update({
        where: { id: instance.id },
        data: {
          status: mappedStatus,
          publicIp,
          ...(mappedStatus === "RUNNING" && !instance.launchedAt
            ? { launchedAt: now }
            : {}),
          ...(mappedStatus === "STOPPED"
            ? { stoppedAt: now }
            : {}),
        },
      });
    }

    return NextResponse.json({
      instance: {
        id: instance.id,
        instanceId: instance.instanceId,
        status: mappedStatus,
        publicIp,
        privateIp: instance.privateIp,
        instanceType: instance.instanceType,
        keyPairName: instance.keyPairName,
        launchedAt: instance.launchedAt,
        stoppedAt: instance.stoppedAt,
      },
    });
  } catch {
    return NextResponse.json({
      instance: {
        id: instance.id,
        instanceId: instance.instanceId,
        status: instance.status,
        publicIp: instance.publicIp,
        privateIp: instance.privateIp,
        instanceType: instance.instanceType,
        keyPairName: instance.keyPairName,
        launchedAt: instance.launchedAt,
        stoppedAt: instance.stoppedAt,
      },
    });
  }
}
