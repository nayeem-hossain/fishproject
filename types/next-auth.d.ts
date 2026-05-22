import type { Role } from "@/lib/rbac";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
      projectId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
    role: Role;
    projectId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    username?: string;
    role?: Role;
    projectId?: string | null;
  }
}