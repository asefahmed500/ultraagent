"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/_shared";
import {
  advanceRun,
  answerClarification,
  createRunFromInstruction,
  decideApproval,
  retryStep,
  undoRun,
} from "@/lib/agent/engine";
import { commandSchema, approvalDecisionSchema } from "@/lib/validations";
import type { AutonomyLevel } from "@/lib/constants";

function revalidateRun(runId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard/activity");
  revalidatePath("/dashboard/inbox");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/meetings");
  if (runId) revalidatePath(`/dashboard/runs/${runId}`);
}

export async function createRunAction(input: {
  instruction: string;
  dryRun?: boolean;
  autonomyOverride?: AutonomyLevel;
}) {
  const user = await requireUser();
  const parsed = commandSchema.parse(input);
  const result = await createRunFromInstruction({
    workspaceId: user.workspaceId,
    ownerId: user.id,
    instruction: parsed.instruction,
    dryRun: parsed.dryRun,
    autonomyOverride: parsed.autonomyOverride,
    actorName: user.name,
  });
  revalidateRun(result.run.id);
  return result;
}

export async function advanceRunAction(runId: string) {
  const user = await requireUser();
  const run = await advanceRun(runId, {
    actorId: user.id,
    actorName: user.name,
  });
  revalidateRun(runId);
  return run;
}

export async function decideApprovalAction(input: {
  approvalId: string;
  decision: "approved" | "rejected" | "edited";
  note?: string;
  editedInstruction?: string;
}) {
  const user = await requireUser();
  const parsed = approvalDecisionSchema.parse(input);
  const result = await decideApproval({
    ...parsed,
    approvalId: input.approvalId,
    actorId: user.id,
    actorName: user.name,
  });
  revalidateRun(result.runId);
  return result;
}

export async function undoRunAction(runId: string) {
  const user = await requireUser();
  const run = await undoRun(runId, { actorId: user.id, actorName: user.name });
  revalidateRun(runId);
  return run;
}

export async function retryStepAction(runId: string, stepId: string) {
  const user = await requireUser();
  const run = await retryStep(runId, stepId, {
    actorId: user.id,
    actorName: user.name,
  });
  revalidateRun(runId);
  return run;
}

export async function answerClarificationAction(runId: string, choice: string) {
  const user = await requireUser();
  const run = await answerClarification(runId, choice, {
    actorId: user.id,
    actorName: user.name,
  });
  revalidateRun(runId);
  return run;
}
