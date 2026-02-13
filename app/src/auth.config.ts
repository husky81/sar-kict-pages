import type { NextAuthConfig } from "next-auth";
import type { UserRole, UserStatus } from "@prisma/client";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

// Edge-safe config (no prisma, no bcryptjs)
// Full Credentials authorize logic is in auth.ts
// JWT/session callbacks must mirror auth.ts so middleware can read custom fields
export default {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
    }),
  ],
  callbacks: {
    jwt({ token }) {
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.status = token.status as UserStatus;
      return session;
    },
  },
} satisfies NextAuthConfig;
