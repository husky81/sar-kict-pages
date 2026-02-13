import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

// Edge-safe config (no prisma, no bcryptjs)
// Full Credentials authorize logic is in auth.ts
export default {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
    }),
  ],
} satisfies NextAuthConfig;
