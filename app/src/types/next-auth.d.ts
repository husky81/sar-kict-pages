import type { UserRole, UserStatus } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    status?: UserStatus;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: UserStatus;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: UserStatus;
  }
}
