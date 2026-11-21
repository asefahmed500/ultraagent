import type { AutonomyLevel, Role } from "@/lib/constants";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role?: Role;
    workspaceId?: string;
    autonomyLevel?: AutonomyLevel;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      workspaceId: string;
      autonomyLevel: AutonomyLevel;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    workspaceId?: string;
    autonomyLevel?: AutonomyLevel;
  }
}
