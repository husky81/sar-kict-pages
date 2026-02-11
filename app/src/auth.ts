import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";
import type { UserRole, UserStatus } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  ...authConfig,
  callbacks: {
    async signIn({ user, account }) {
      // OAuth 신규 가입 시에는 항상 허용 (PrismaAdapter가 PENDING으로 생성)
      if (account?.provider !== "credentials") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        // 기존 사용자인데 REJECTED인 경우 차단
        if (existingUser?.status === "REJECTED") {
          return false;
        }
        return true;
      }

      // Credentials: APPROVED 상태만 로그인 허용
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });
      if (!dbUser) return false;
      if (dbUser.status === "PENDING") {
        return "/pending";
      }
      if (dbUser.status === "REJECTED") {
        return false;
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.status = dbUser.status;
        }
      }

      // 세션 업데이트 시 DB에서 최신 상태 조회
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.status = dbUser.status;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.status = token.status as UserStatus;
      return session;
    },

    async redirect({ url, baseUrl }) {
      // 상대경로 처리
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // 같은 도메인이면 허용
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
});
