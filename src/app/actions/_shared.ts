import { auth } from "@/auth";
import { ensureSeedData } from "@/lib/seed";
import type { Role, AutonomyLevel } from "@/lib/constants";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  workspaceId: string;
  autonomyLevel: AutonomyLevel;
}

export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await ensureSeedData(session.user.id, session.user.workspaceId);
  const user = session.user;
  return {
    id: user.id,
    name: user.name ?? "User",
    email: user.email ?? "",
    role: user.role,
    workspaceId: user.workspaceId,
    autonomyLevel: user.autonomyLevel,
  };
}
