"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/_shared";
import { connectDB } from "@/lib/mongodb";
import { recordAudit } from "@/lib/audit";
import { canManagePolicies } from "@/lib/rbac";
import { createRunFromInstruction } from "@/lib/agent/engine";
import {
  policySchema,
  triggerSchema,
  memorySchema,
  approvalRequestSchema,
  skillSchema,
} from "@/lib/validations";
import Policy from "@/models/Policy";
import Trigger from "@/models/Trigger";
import Connector from "@/models/Connector";
import MemoryItem from "@/models/MemoryItem";
import SavedCommand from "@/models/SavedCommand";
import CustomSkill from "@/models/CustomSkill";
import ApprovalRequest from "@/models/ApprovalRequest";
import Notification from "@/models/Notification";
import EmailMessage from "@/models/EmailMessage";
import WebhookEvent from "@/models/WebhookEvent";

function refresh(section: string) {
  revalidatePath(`/dashboard/${section}`);
  revalidatePath("/dashboard");
}

export async function createPolicyAction(input: {
  name: string;
  scope: string;
  rule: string;
  effect: "allow" | "deny" | "require_approval";
  risk: string;
  condition: string;
  threshold?: number;
  enabled: boolean;
}) {
  const user = await requireUser();
  if (!canManagePolicies(user.role)) return { error: "Admins only." };
  const data = policySchema.parse(input);
  await connectDB();
  await Policy.create({
    ...data,
    workspaceId: user.workspaceId,
    createdBy: user.id,
    version: 1,
    effectiveAt: new Date(),
  });
  await recordAudit({
    workspaceId: user.workspaceId,
    actor: user.name,
    actorId: user.id,
    action: "policy.updated",
    target: "Policy",
    targetId: data.name,
    result: "created",
    detail: `${data.effect} / ${data.risk}`,
  });
  await WebhookEvent.create({
    workspaceId: user.workspaceId,
    event: "policy.updated",
    payload: { name: data.name, effect: data.effect },
  });
  refresh("admin");
  return { error: null };
}

export async function setPolicyEnabledAction(id: string, enabled: boolean) {
  const user = await requireUser();
  if (!canManagePolicies(user.role)) return { error: "Admins only." };
  await connectDB();
  await Policy.updateOne(
    { _id: id, workspaceId: user.workspaceId },
    { $set: { enabled, $inc: { version: 1 } } }
  );
  refresh("admin");
  return { error: null };
}

export async function deletePolicyAction(id: string) {
  const user = await requireUser();
  if (!canManagePolicies(user.role)) return { error: "Admins only." };
  await connectDB();
  await Policy.deleteOne({ _id: id, workspaceId: user.workspaceId });
  refresh("admin");
  return { error: null };
}

export async function createTriggerAction(input: {
  name: string;
  source: string;
  condition: string;
  schedule?: string;
  skill: string;
  instruction: string;
  enabled: boolean;
  dryRun: boolean;
}) {
  const user = await requireUser();
  const data = triggerSchema.parse(input);
  await connectDB();
  await Trigger.create({
    ...data,
    workspaceId: user.workspaceId,
    ownerId: user.id,
    params: {},
  });
  refresh("triggers");
  return { error: null };
}

export async function setTriggerEnabledAction(id: string, enabled: boolean) {
  const user = await requireUser();
  await connectDB();
  await Trigger.updateOne(
    { _id: id, workspaceId: user.workspaceId },
    { $set: { enabled } }
  );
  refresh("triggers");
  return { error: null };
}

export async function deleteTriggerAction(id: string) {
  const user = await requireUser();
  await connectDB();
  await Trigger.deleteOne({ _id: id, workspaceId: user.workspaceId });
  refresh("triggers");
  return { error: null };
}

export async function runTriggerNowAction(id: string) {
  const user = await requireUser();
  await connectDB();
  const trigger = await Trigger.findById(id);
  if (!trigger || String(trigger.workspaceId) !== user.workspaceId) {
    throw new Error("Trigger not found");
  }
  trigger.lastRunAt = new Date();
  trigger.runCount = (trigger.runCount ?? 0) + 1;
  await trigger.save();
  const result = await createRunFromInstruction({
    workspaceId: user.workspaceId,
    ownerId: user.id,
    instruction: trigger.instruction,
    source: "trigger",
    dryRun: trigger.dryRun,
    actorName: user.name,
  });
  refresh("triggers");
  return result.run.id;
}

export async function setConnectorAction(provider: string, connected: boolean) {
  const user = await requireUser();
  if (!canManagePolicies(user.role)) return { error: "Admins only." };
  await connectDB();
  await Connector.updateOne(
    { workspaceId: user.workspaceId, provider },
    {
      $set: {
        status: connected ? "connected" : "disconnected",
        lastSync: new Date(),
        account: connected ? user.email : undefined,
      },
    }
  );
  const connector = await Connector.findOne({ workspaceId: user.workspaceId, provider }).lean();
  await recordAudit({
    workspaceId: user.workspaceId,
    actor: user.name,
    actorId: user.id,
    action: connected ? "connector.connected" : "connector.disconnected",
    target: "Connector",
    targetId: provider,
    result: connected ? "connected" : "disconnected",
    detail: `Scopes: ${(connector?.requestedScopes as string[] | undefined)?.join(", ") ?? ""}`,
  });
  await WebhookEvent.create({
    workspaceId: user.workspaceId,
    event: "connector.health_changed",
    payload: { provider, status: connected ? "connected" : "disconnected" },
  });
  refresh("integrations");
  return { error: null };
}

export async function createMemoryAction(input: {
  layer: string;
  subject: string;
  content: string;
  pinned: boolean;
}) {
  const user = await requireUser();
  const data = memorySchema.parse(input);
  await connectDB();
  await MemoryItem.create({
    ...data,
    workspaceId: user.workspaceId,
    userId: user.id,
  });
  refresh("settings");
  return { error: null };
}

export async function updateMemoryAction(
  id: string,
  input: { subject: string; content: string; pinned: boolean }
) {
  const user = await requireUser();
  await connectDB();
  await MemoryItem.updateOne(
    { _id: id, workspaceId: user.workspaceId, userId: user.id },
    { $set: input }
  );
  refresh("settings");
  return { error: null };
}

export async function deleteMemoryAction(id: string) {
  const user = await requireUser();
  await connectDB();
  await MemoryItem.deleteOne({
    _id: id,
    workspaceId: user.workspaceId,
    userId: user.id,
  });
  refresh("settings");
  return { error: null };
}

export async function createSavedCommandAction(input: {
  label: string;
  instruction: string;
  shortcut: string;
}) {
  const user = await requireUser();
  await connectDB();
  await SavedCommand.create({
    ...input,
    workspaceId: user.workspaceId,
    ownerId: user.id,
  });
  refresh("tasks");
  return { error: null };
}

export async function deleteSavedCommandAction(id: string) {
  const user = await requireUser();
  await connectDB();
  await SavedCommand.deleteOne({ _id: id, workspaceId: user.workspaceId });
  refresh("tasks");
  return { error: null };
}

export async function runSavedCommandAction(id: string) {
  const user = await requireUser();
  await connectDB();
  const command = await SavedCommand.findById(id);
  if (!command) throw new Error("Saved command not found");
  command.useCount = (command.useCount ?? 0) + 1;
  await command.save();
  const result = await createRunFromInstruction({
    workspaceId: user.workspaceId,
    ownerId: user.id,
    instruction: command.instruction,
    actorName: user.name,
  });
  refresh("tasks");
  return result.run.id;
}

export async function createCustomSkillAction(input: {
  id: string;
  name: string;
  description: string;
  instruction: string;
  risk: string;
  tools: string[];
}) {
  const user = await requireUser();
  const data = skillSchema.parse(input);
  await connectDB();
  await CustomSkill.create({
    ...data,
    workspaceId: user.workspaceId,
    ownerId: user.id,
    tests: [
      {
        name: "Happy path",
        instruction: data.instruction,
        expected: "Completed with visible steps",
        passed: true,
      },
    ],
  });
  await recordAudit({
    workspaceId: user.workspaceId,
    actor: user.name,
    actorId: user.id,
    action: "skill.created",
    target: "Skill",
    targetId: data.id,
    result: "created",
  });
  refresh("skills");
  return { error: null };
}

export async function runSkillTestAction(id: string, instruction: string) {
  const user = await requireUser();
  const result = await createRunFromInstruction({
    workspaceId: user.workspaceId,
    ownerId: user.id,
    instruction,
    actorName: user.name,
  });
  await connectDB();
  await CustomSkill.updateOne(
    { workspaceId: user.workspaceId, id },
    { $set: { "tests.$[].passed": true } }
  );
  refresh("skills");
  return result.run.id;
}

export async function createApprovalRequestAction(input: {
  title: string;
  type: string;
  amount: number;
  category: string;
  approver: string;
  justification: string;
}) {
  const user = await requireUser();
  const data = approvalRequestSchema.parse(input);
  await connectDB();
  const autoApprove = data.type !== "expense" || data.amount <= 2000;
  await ApprovalRequest.create({
    ...data,
    workspaceId: user.workspaceId,
    ownerId: user.id,
    requester: user.email,
    status: autoApprove ? "auto_approved" : "pending",
    policyCheck: autoApprove
      ? "Within policy limits — auto-approved."
      : "Above $2,000 — named approver required.",
    separationOfDuties: data.approver !== user.email,
    decidedAt: autoApprove ? new Date() : undefined,
  });
  refresh("approvals");
  return { error: null };
}

export async function decideApprovalRequestAction(id: string, status: "approved" | "rejected") {
  const user = await requireUser();
  await connectDB();
  await ApprovalRequest.updateOne(
    { _id: id, workspaceId: user.workspaceId },
    { $set: { status, decidedAt: new Date() } }
  );
  await recordAudit({
    workspaceId: user.workspaceId,
    actor: user.name,
    actorId: user.id,
    action: "approval.request.decided",
    target: "ApprovalRequest",
    targetId: id,
    result: status,
  });
  refresh("approvals");
  return { error: null };
}

export async function markNotificationReadAction(id: string) {
  const user = await requireUser();
  await connectDB();
  await Notification.updateOne(
    { _id: id, userId: user.id },
    { $set: { read: true } }
  );
  refresh("settings");
  return { error: null };
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await connectDB();
  await Notification.updateMany({ userId: user.id }, { $set: { read: true } });
  refresh("settings");
  return { error: null };
}

export async function updateEmailAction(
  id: string,
  patch: { read?: boolean; archived?: boolean; starred?: boolean; draftStatus?: string }
) {
  const user = await requireUser();
  await connectDB();
  await EmailMessage.updateOne(
    { _id: id, workspaceId: user.workspaceId, ownerId: user.id },
    { $set: patch }
  );
  refresh("inbox");
  return { error: null };
}
