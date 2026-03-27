"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireApprovedUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "APPROVED") {
    throw new Error("승인된 사용자만 이용할 수 있습니다");
  }
  return session;
}

export async function getMyCostLimits() {
  const session = await requireApprovedUser();

  const limits = await prisma.costLimit.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return limits.map((l) => ({
    id: l.id,
    limitType: l.limitType,
    limitAmount: l.limitAmount,
    notifyAt: l.notifyAt,
    lastNotifiedAt: l.lastNotifiedAt?.toISOString() || null,
    createdAt: l.createdAt.toISOString(),
  }));
}

export async function setCostLimit(data: {
  limitType: "DAILY" | "MONTHLY";
  limitAmount: number;
  notifyAt?: number;
}) {
  const session = await requireApprovedUser();

  if (data.limitAmount <= 0) {
    throw new Error("비용 한도는 0보다 커야 합니다.");
  }

  // 같은 타입의 기존 활성 한도 비활성화
  await prisma.costLimit.updateMany({
    where: {
      userId: session.user.id,
      limitType: data.limitType,
      isActive: true,
    },
    data: { isActive: false },
  });

  const limit = await prisma.costLimit.create({
    data: {
      userId: session.user.id,
      limitType: data.limitType,
      limitAmount: data.limitAmount,
      notifyAt: data.notifyAt,
    },
  });

  revalidatePath("/settings");
  return limit;
}

export async function deactivateCostLimit(id: string) {
  const session = await requireApprovedUser();

  await prisma.costLimit.updateMany({
    where: { id, userId: session.user.id },
    data: { isActive: false },
  });

  revalidatePath("/settings");
}

export async function deleteCostLimit(id: string) {
  const session = await requireApprovedUser();

  await prisma.costLimit.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/settings");
}
