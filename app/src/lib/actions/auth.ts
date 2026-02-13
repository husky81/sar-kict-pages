"use server";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";

const signupSchema = z.object({
  name: z.string().min(2, "이름은 2자 이상 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상 입력해주세요")
    .regex(/[A-Za-z]/, "영문자를 포함해주세요")
    .regex(/[0-9]/, "숫자를 포함해주세요"),
});

export type AuthState = {
  error?: string;
  success?: boolean;
};

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "이미 가입된 이메일입니다" };
  }

  const hashedPassword = await hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      status: "PENDING",
      role: "MEMBER",
    },
  });

  return { success: true };
}

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "이메일 또는 비밀번호가 올바르지 않습니다" };
      }
      if (error.type === "CallbackRouteError") {
        return { error: "승인 대기 중이거나 접근이 거부되었습니다" };
      }
      return { error: "로그인 중 오류가 발생했습니다" };
    }
    throw error; // NEXT_REDIRECT 등 비-AuthError는 re-throw
  }
}

export async function googleSignIn() {
  await signIn("google", { redirectTo: "/dashboard" });
}
