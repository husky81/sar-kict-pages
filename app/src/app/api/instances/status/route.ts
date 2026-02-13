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
      await prisma.instance.update({
        where: { id: instance.id },
        data: {
          status: mappedStatus,
          publicIp,
          ...(mappedStatus === "RUNNING" && !instance.launchedAt
            ? { launchedAt: new Date() }
            : {}),
          ...(mappedStatus === "STOPPED"
            ? { stoppedAt: new Date() }
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
