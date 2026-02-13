"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { UserStatus } from "@prisma/client";

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

  return prisma.user.findMany({
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
}
