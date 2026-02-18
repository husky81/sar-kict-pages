"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcryptjs";

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const session = await auth();
  if (!session?.user || session.user.status !== "APPROVED") {
    throw new Error("로그인이 필요합니다.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, password: true },
  });

  if (!user || !user.password) {
    throw new Error("비밀번호 변경이 불가능한 계정입니다. (OAuth 계정)");
  }

  const isValid = await compare(currentPassword, user.password);
  if (!isValid) {
    throw new Error("현재 비밀번호가 올바르지 않습니다.");
  }

  if (newPassword.length < 8) {
    throw new Error("비밀번호는 8자 이상이어야 합니다.");
  }

  const hashed = await hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  return { success: true };
}

export async function hasPassword() {
  const session = await auth();
  if (!session?.user || session.user.status !== "APPROVED") {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  return !!user?.password;
}
