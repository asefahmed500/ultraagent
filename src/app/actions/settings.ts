"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/_shared";
import { connectDB } from "@/lib/mongodb";
import { recordAudit } from "@/lib/audit";
import { settingsSchema, workspaceSchema } from "@/lib/validations";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import { canManageWorkspace } from "@/lib/rbac";

export async function updateSettingsAction(input: {
  name: string;
  tone: string;
  timezone: string;
  workStart: string;
  workEnd: string;
  autonomyLevel: "L0" | "L1" | "L2" | "L3";
  locale: string;
}) {
  const user = await requireUser();
  const data = settingsSchema.parse(input);
  await connectDB();
  const workspace = await Workspace.findById(user.workspaceId).lean();
  const ceiling = (workspace?.autonomyCeiling as string) ?? "L3";
  const rank = ["L0", "L1", "L2", "L3"];
  if (rank.indexOf(data.autonomyLevel) > rank.indexOf(ceiling)) {
    return {
      error: `Your workspace ceiling is ${ceiling}. Choose ${ceiling} or lower.`,
    };
  }
  await User.updateOne(
    { _id: user.id },
    {
      $set: {
        name: data.name,
        tone: data.tone,
        timezone: data.timezone,
        workingHours: { start: data.workStart, end: data.workEnd },
        autonomyLevel: data.autonomyLevel,
        locale: data.locale,
      },
    }
  );
  await recordAudit({
    workspaceId: user.workspaceId,
    actor: user.name,
    actorId: user.id,
    action: "settings.updated",
    target: "User",
    targetId: user.id,
    result: "updated",
    detail: `Autonomy ${data.autonomyLevel}; timezone ${data.timezone}.`,
  });
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateWorkspaceAction(input: {
  name: string;
  plan: "Starter" | "Team" | "Enterprise";
  region: string;
  dataRetentionDays: number;
  monthlyActionLimit: number;
  autonomyCeiling: "L0" | "L1" | "L2" | "L3";
}) {
  const user = await requireUser();
  if (!canManageWorkspace(user.role)) return { error: "Admins only." };
  const data = workspaceSchema.parse(input);
  await connectDB();
  await Workspace.updateOne(
    { _id: user.workspaceId },
    {
      $set: {
        name: data.name,
        plan: data.plan,
        region: data.region,
        dataRetentionDays: data.dataRetentionDays,
        monthlyActionLimit: data.monthlyActionLimit,
        autonomyCeiling: data.autonomyCeiling,
      },
    }
  );
  await recordAudit({
    workspaceId: user.workspaceId,
    actor: user.name,
    actorId: user.id,
    action: "workspace.updated",
    target: "Workspace",
    targetId: user.workspaceId,
    result: "updated",
    detail: `Plan ${data.plan}; ceiling ${data.autonomyCeiling}.`,
  });
  revalidatePath("/dashboard/admin");
  return { error: null };
}

export async function updateMemberRoleAction(input: {
  userId: string;
  role: "owner" | "admin" | "manager" | "member" | "viewer";
  autonomyLevel: "L0" | "L1" | "L2" | "L3";
}) {
  const user = await requireUser();
  if (!canManageWorkspace(user.role)) return { error: "Admins only." };
  if (input.role === "owner") return { error: "Cannot assign a second owner." };
  await connectDB();
  await User.updateOne(
    { _id: input.userId, workspaceId: user.workspaceId },
    { $set: { role: input.role, autonomyLevel: input.autonomyLevel } }
  );
  await recordAudit({
    workspaceId: user.workspaceId,
    actor: user.name,
    actorId: user.id,
    action: "role.updated",
    target: "User",
    targetId: input.userId,
    result: input.role,
  });
  revalidatePath("/dashboard/admin");
  return { error: null };
}
