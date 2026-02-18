"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { UserStatus, InstanceStatus } from "@prisma/client";
import { INSTANCE_PRESETS } from "@/lib/instance-types";
import { ec2 } from "@/lib/aws";
import { DescribeInstancesCommand } from "@aws-sdk/client-ec2";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다");
  }
  return session;
}

export async function updateUserStatus(userId: string, status: UserStatus) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { status },
  });

  revalidatePath("/admin/users");
}

export async function getUsers() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      role: true,
      createdAt: true,
      image: true,
      instance: {
        select: {
          instanceId: true,
          status: true,
        },
      },
    },
  });

  // 과도기 상태(PENDING, STARTING, STOPPING)인 인스턴스의 실제 EC2 상태 동기화
  const transitionalInstances = users.filter(
    (u) =>
      u.instance &&
      ["PENDING", "STARTING", "STOPPING"].includes(u.instance.status)
  );

  if (transitionalInstances.length > 0) {
    const instanceIds = transitionalInstances
      .map((u) => u.instance!.instanceId)
      .filter(Boolean) as string[];

    if (instanceIds.length > 0) {
      try {
        const result = await ec2.send(
          new DescribeInstancesCommand({ InstanceIds: instanceIds })
        );

        const statusMap: Record<string, InstanceStatus> = {
          pending: "PENDING",
          running: "RUNNING",
          stopping: "STOPPING",
          stopped: "STOPPED",
          "shutting-down": "STOPPING",
          terminated: "TERMINATED",
        };

        const awsStatusMap = new Map<string, { status: InstanceStatus; publicIp: string | null }>();
        for (const reservation of result.Reservations || []) {
          for (const inst of reservation.Instances || []) {
            if (inst.InstanceId && inst.State?.Name) {
              awsStatusMap.set(inst.InstanceId, {
                status: statusMap[inst.State.Name] || "PENDING",
                publicIp: inst.PublicIpAddress || null,
              });
            }
          }
        }

        // DB 업데이트 및 로컬 상태 반영
        for (const u of transitionalInstances) {
          const awsData = awsStatusMap.get(u.instance!.instanceId!);
          if (awsData && awsData.status !== u.instance!.status) {
            await prisma.instance.updateMany({
              where: { instanceId: u.instance!.instanceId! },
              data: {
                status: awsData.status,
                publicIp: awsData.publicIp,
                ...(awsData.status === "STOPPED" ? { stoppedAt: new Date() } : {}),
              },
            });
            // 로컬 객체도 업데이트
            u.instance!.status = awsData.status;
          }
        }
      } catch (e) {
        console.warn("Admin EC2 status sync failed:", e);
      }
    }
  }

  const quotaRows = await prisma.$queryRawUnsafe<
    { userId: string; instanceQuota: number; instanceType: string }[]
  >(
    `SELECT "userId",
            "instanceQuota",
            "instanceType"
     FROM "UserInstanceConfig"`
  ).catch(() => [] as { userId: string; instanceQuota: number; instanceType: string }[]);

  const quotaMap = new Map(quotaRows.map((r) => [r.userId, r]));

  return users.map((u) => ({
    ...u,
    instanceQuota: Number(quotaMap.get(u.id)?.instanceQuota ?? 0),
    instanceType: quotaMap.get(u.id)?.instanceType ?? "t3.small",
  }));
}

export async function updateUserInstanceConfig(
  userId: string,
  quota: number,
  instanceType: string
) {
  await requireAdmin();

  if (quota !== 0 && quota !== 1) {
    throw new Error("쿼터는 0 또는 1만 허용됩니다");
  }

  if (!INSTANCE_PRESETS[instanceType]) {
    throw new Error("허용되지 않은 인스턴스 타입입니다");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      instance: { select: { status: true } },
    },
  });

  if (!user) {
    throw new Error("사용자를 찾을 수 없습니다");
  }

  const currentRows = await prisma.$queryRawUnsafe<{ instanceType: string }[]>(
    `SELECT "instanceType" FROM "UserInstanceConfig" WHERE "userId" = $1`,
    userId
  ).catch(() => [{ instanceType: "t3.small" }]);
  const currentType = currentRows[0]?.instanceType ?? "t3.small";

  if (
    user.instance &&
    user.instance.status !== "TERMINATED" &&
    currentType !== instanceType
  ) {
    throw new Error("활성 인스턴스가 있으면 타입을 변경할 수 없습니다");
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO "UserInstanceConfig" ("userId", "instanceQuota", "instanceType", "updatedAt")
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT ("userId") DO UPDATE SET "instanceQuota" = $2, "instanceType" = $3, "updatedAt" = NOW()`,
    userId,
    quota,
    instanceType
  );

  revalidatePath("/admin/users");
}
