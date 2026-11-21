import { createHash } from "crypto";
import { connectDB } from "@/lib/mongodb";
import { toRun } from "@/lib/serialize";
import { recordAudit } from "@/lib/audit";
import Run from "@/models/Run";
import Step from "@/models/Step";
import Task from "@/models/Task";
import Approval from "@/models/Approval";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import Notification from "@/models/Notification";
import {
  detectSkill,
  isAmbiguous,
  planFor,
  SKILL_MAP,
  SKILLS,
  type PlanTemplateStep,
} from "@/lib/agent/registry";
import { evaluatePolicy } from "@/lib/agent/policy";
import { applyStepEffect, applyInverseEffect } from "@/lib/agent/domain-effects";
import type { AutonomyLevel, RunState } from "@/lib/constants";
import type { RunDTO } from "@/lib/types";

interface ActorContext {
  actorId: string;
  actorName: string;
}

function idempotencyKey(
  userId: string,
  tool: string,
  order: number,
  instruction: string
): string {
  return createHash("sha256")
    .update(`${userId}|${tool}|${order}|${instruction}`)
    .digest("hex")
    .slice(0, 16);
}

function todayISO() {
  return new Date().toISOString();
}

function chooseModelRoute(skillId: string): string {
  return SKILL_MAP.get(skillId as never)?.modelRoute ?? "strong-planner";
}

/** Create a Task + Run with a full plan, policy decisions and audit trail. */
export async function createRunFromInstruction(params: {
  workspaceId: string;
  ownerId: string;
  instruction: string;
  source?: "command" | "trigger" | "api" | "webhook";
  dryRun?: boolean;
  autonomyOverride?: AutonomyLevel;
  actorName: string;
}): Promise<{ run: RunDTO; created: boolean }> {
  await connectDB();
  const instruction = params.instruction.trim();
  const skillId = detectSkill(instruction);
  const ambiguous = isAmbiguous(instruction, skillId);

  const task = await Task.create({
    ownerId: params.ownerId,
    workspaceId: params.workspaceId,
    instruction,
    source: params.source ?? "command",
    status: ambiguous ? "needs_input" : "planning",
    skill: skillId,
  });

  const user = await User.findById(params.ownerId).lean();
  const workspace = await Workspace.findById(params.workspaceId).lean();
  const autonomy: AutonomyLevel =
    params.autonomyOverride ??
    ((user?.autonomyLevel as AutonomyLevel) || "L1");
  const ceiling = (workspace?.autonomyCeiling as AutonomyLevel) ?? "L3";

  const run = await Run.create({
    taskId: String(task._id),
    ownerId: params.ownerId,
    workspaceId: params.workspaceId,
    skill: skillId,
    instruction,
    state: ambiguous ? "needs_input" : "planning",
    plan: [],
    steps: [],
    startedAt: new Date(),
    modelRoute: chooseModelRoute(skillId),
    dryRun: params.dryRun ?? false,
    cost: 0,
    tokens: 0,
  });

  task.runId = String(run._id);
  await task.save();

  await recordAudit({
    workspaceId: params.workspaceId,
    actor: params.actorName,
    actorId: params.ownerId,
    action: "run.started",
    target: "Task",
    targetId: String(task._id),
    result: "queued",
    detail: instruction.slice(0, 200),
    runId: String(run._id),
  });

  if (ambiguous) {
    run.clarification =
      "I can help with several things. Which would you like me to do?";
    run.clarificationChoices = SKILLS.filter((s) => s.id !== "general").map(
      (s) => s.name
    );
    await run.save();
    return { run: toRun(run), created: true };
  }

  const template: PlanTemplateStep[] = planFor(skillId, instruction);
  const plannedSteps = [];
  for (let order = 0; order < template.length; order++) {
    const step = template[order];
    const decision = await evaluatePolicy({
      workspaceId: params.workspaceId,
      step,
      autonomy,
      instruction,
      isScheduled: params.source === "trigger",
      autonomyCeiling: ceiling,
    });
    plannedSteps.push({
      order,
      title: step.title,
      detail: step.detail,
      skill: skillId,
      tool: step.tool,
      app: step.app,
      risk: step.risk,
      scopes: step.scopes,
      idempotencyKey: idempotencyKey(
        params.ownerId,
        step.tool,
        order,
        instruction
      ),
      inverse: step.inverse,
      requiresApproval: decision.requiresApproval,
      policyReason: decision.reason,
      status: decision.blocked ? "rejected" : "pending",
      output: decision.blocked ? decision.reason : undefined,
      error: decision.blocked ? "Blocked by policy" : undefined,
      attempts: 0,
      changes: [],
    });
  }

  run.plan = plannedSteps as never;
  run.steps = plannedSteps as never;
  run.state = "executing";
  await run.save();

  await Step.insertMany(
    plannedSteps.map((step) => ({
      runId: String(run._id),
      workspaceId: params.workspaceId,
      ...step,
    }))
  );

  await recordAudit({
    workspaceId: params.workspaceId,
    actor: params.actorName,
    actorId: params.ownerId,
    action: "plan.created",
    target: "Run",
    targetId: String(run._id),
    result: `${plannedSteps.length} steps`,
    detail: `Skill: ${skillId}. Route: ${run.modelRoute}.`,
    runId: String(run._id),
  });

  return { run: toRun(run), created: true };
}

function terminal(state: RunState): boolean {
  return [
    "completed",
    "failed",
    "rejected",
    "undone",
    "escalated",
    "needs_input",
  ].includes(state);
}

/** Advance the run by one step phase. Called repeatedly by the run player. */
export async function advanceRun(
  runId: string,
  actor: ActorContext
): Promise<RunDTO> {
  await connectDB();
  const run = await Run.findById(runId);
  if (!run) throw new Error("Run not found");
  if (terminal(run.state as RunState)) return toRun(run);

  const steps = run.steps as unknown as Array<Record<string, unknown> & {
    status: string;
    order: number;
  }>;
  // Finish a step that is already running before starting a new one.
  const next =
    steps.find((s) => s.status === "running") ??
    steps.find((s) => s.status === "pending");
  const blocked = steps.some((s) => s.status === "rejected");

  if (!next) {
    if (blocked) {
      run.state = "escalated";
      run.error = "A step was blocked by policy. Escalated for human handoff.";
      run.endedAt = new Date();
    } else if (steps.every((s) => s.status === "completed")) {
      run.state = "completed";
      run.outcome = run.plan.length
        ? `${steps.length} steps completed successfully.`
        : "Completed.";
      run.summary = buildSummary(steps);
      run.undoAvailable =
        !run.dryRun &&
        steps.some((s) => s.status === "completed" && Boolean(s.inverse));
      run.endedAt = new Date();
      run.latencyMs = run.startedAt
        ? Date.now() - new Date(run.startedAt as Date).getTime()
        : 0;
      await Task.updateOne(
        { _id: run.taskId },
        { $set: { status: "completed" } }
      );
    } else {
      run.state = "awaiting_approval";
    }
    await recordAudit({
      workspaceId: String(run.workspaceId),
      actor: actor.actorName,
      actorId: actor.actorId,
      action: run.state === "completed" ? "run.completed" : "run.escalated",
      target: "Run",
      targetId: String(run._id),
      result: run.state,
      detail: run.summary ?? run.error ?? "",
      runId: String(run._id),
    });
    await run.save();
    return toRun(run);
  }

  // Approval gate
  if (next.requiresApproval) {
    let approval = await Approval.findOne({
      runId: String(run._id),
      stepId: String(next._id),
    });
    if (!approval) {
      approval = await Approval.create({
        runId: String(run._id),
        stepId: String(next._id),
        ownerId: run.ownerId,
        workspaceId: run.workspaceId,
        requestedFrom: actor.actorName,
        title: String(next.title),
        summary: `${String(next.detail)} ${String(next.policyReason)}`,
        risk: String(next.risk),
        action: String(next.app),
        tool: String(next.tool),
        decision: "pending",
        channel: "app",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      next.status = "awaiting_approval";
      run.state = "awaiting_approval";
      run.approvalId = String(approval._id);
      await Notification.create({
        workspaceId: run.workspaceId,
        userId: run.ownerId,
        title: "Approval required",
        body: String(next.title),
        kind: "approval",
        href: "/dashboard/approvals",
      });
      await recordAudit({
        workspaceId: String(run.workspaceId),
        actor: "UltraAgent",
        actorId: actor.actorId,
        action: "run.awaiting_approval",
        target: "Approval",
        targetId: String(approval._id),
        result: "pending",
        detail: String(next.title),
        runId: String(run._id),
      });
      await run.save();
      return toRun(run);
    }
    if (approval.decision === "pending") return toRun(run);
    if (approval.decision !== "approved") {
      next.status = "rejected";
      next.output = `Rejected: ${approval.note ?? "user decision"}`;
      run.state = "rejected";
      run.endedAt = new Date();
      await recordAudit({
        workspaceId: String(run.workspaceId),
        actor: actor.actorName,
        actorId: actor.actorId,
        action: "approval.decided",
        target: "Approval",
        targetId: String(approval._id),
        result: String(approval.decision),
        detail: String(approval.note ?? ""),
        runId: String(run._id),
      });
      await run.save();
      return toRun(run);
    }
  }

  // Start phase
  if (next.status !== "running") {
    next.status = "running";
    next.startedAt = new Date();
    next.attempts = Number(next.attempts ?? 0) + 1;
    run.state = "executing";
    await run.save();
    return toRun(run);
  }

  // Simulated transient failure + retry (PRD F11)
  const wantsFailure = /fail|retry|escalat/i.test(String(run.instruction));
  const wantsEscalation = /escalat/i.test(String(run.instruction));
  if (
    wantsFailure &&
    Number(next.attempts) === 1 &&
    String(next.risk) === "external_communication"
  ) {
    next.status = "failed";
    next.error = "Transient connector timeout — retrying with backoff.";
    run.state = "retrying";
    run.retries = (run.retries ?? 0) + 1;
    await recordAudit({
      workspaceId: String(run.workspaceId),
      actor: "UltraAgent",
      actorId: actor.actorId,
      action: "run.step.failed",
      target: "Step",
      targetId: String(next._id),
      result: "transient",
      detail: String(next.error),
      runId: String(run._id),
    });
    await run.save();
    return toRun(run);
  }
  if (wantsEscalation && String(next.status) === "failed") {
    run.state = "escalated";
    run.error = "Retries exhausted. Hand off to a human.";
    run.endedAt = new Date();
    await run.save();
    return toRun(run);
  }

  // Complete phase
  try {
    const effect = run.dryRun
      ? {
          output: `Dry run — would execute ${String(next.tool)}. No changes were made.`,
          changes: ["Dry run only"],
        }
      : await applyStepEffect(String(next.tool), {
          workspaceId: String(run.workspaceId),
          ownerId: String(run.ownerId),
          runId: String(run._id),
          instruction: String(run.instruction),
          skill: run.skill as never,
          order: Number(next.order),
        });
    next.status = "completed";
    next.output = effect.output;
    next.changes = effect.changes;
    next.completedAt = new Date();
    next.error = undefined;
    run.cost = Number(run.cost ?? 0) + 0.02;
    run.tokens = Number(run.tokens ?? 0) + 320;
    run.state = "verifying";
    await Step.updateOne(
      { _id: next._id },
      {
        $set: {
          status: "completed",
          output: effect.output,
          changes: effect.changes,
          completedAt: new Date(),
        },
      }
    );
    await recordAudit({
      workspaceId: String(run.workspaceId),
      actor: "UltraAgent",
      actorId: actor.actorId,
      action: "run.step.completed",
      target: "Step",
      targetId: String(next._id),
      result: "completed",
      detail: `${String(next.tool)} — ${effect.output}`.slice(0, 300),
      runId: String(run._id),
    });
  } catch (error) {
    next.status = "failed";
    next.error = error instanceof Error ? error.message : "Step failed";
    run.state = "failed";
    run.error = String(next.error);
    run.endedAt = new Date();
    await recordAudit({
      workspaceId: String(run.workspaceId),
      actor: "UltraAgent",
      actorId: actor.actorId,
      action: "run.step.failed",
      target: "Step",
      targetId: String(next._id),
      result: "failed",
      detail: String(next.error),
      runId: String(run._id),
    });
  }

  await run.save();
  return toRun(run);
}

function buildSummary(steps: Array<Record<string, unknown>>): string {
  const changes = steps.flatMap((step) =>
    Array.isArray(step.changes) ? (step.changes as string[]) : []
  );
  return changes.slice(0, 6).join(" · ") || "All steps completed.";
}

/** Approve, reject or edit a pending approval. Approving resumes its run. */
export async function decideApproval(params: {
  approvalId: string;
  decision: "approved" | "rejected" | "edited";
  note?: string;
  editedInstruction?: string;
  actorId: string;
  actorName: string;
}): Promise<{ approvalId: string; runId: string }> {
  await connectDB();
  const approval = await Approval.findById(params.approvalId);
  if (!approval) throw new Error("Approval not found");
  approval.decision = params.decision;
  approval.decidedAt = new Date();
  approval.decidedBy = params.actorName;
  approval.note = params.note ?? "";
  if (params.editedInstruction) {
    approval.editedInstruction = params.editedInstruction;
  }
  await approval.save();

  const run = await Run.findById(approval.runId);
  if (run) {
    const steps = run.steps as unknown as Array<Record<string, unknown>>;
    const step = steps.find((s) => String(s._id) === String(approval.stepId));
    if (step) {
      if (params.decision === "rejected") {
        step.status = "rejected";
        step.output = `Rejected: ${params.note ?? "user decision"}`;
        run.state = "rejected";
        run.endedAt = new Date();
      } else {
        step.status = "pending";
        run.state = "executing";
        if (params.editedInstruction) {
          run.instruction = params.editedInstruction;
        }
      }
    }
    await run.save();
  }

  await recordAudit({
    workspaceId: String(approval.workspaceId),
    actor: params.actorName,
    actorId: params.actorId,
    action: "approval.decided",
    target: "Approval",
    targetId: String(approval._id),
    result: params.decision,
    detail: params.note ?? "",
    runId: String(approval.runId),
  });

  return {
    approvalId: String(approval._id),
    runId: String(approval.runId),
  };
}

/** Compensate reversible writes and mark the run undone. */
export async function undoRun(
  runId: string,
  actor: ActorContext
): Promise<RunDTO> {
  await connectDB();
  const run = await Run.findById(runId);
  if (!run) throw new Error("Run not found");
  if (!run.undoAvailable) throw new Error("This run has nothing reversible to undo");

  const steps = run.steps as unknown as Array<
    Record<string, unknown> & { status: string }
  >;
  const reversible = steps
    .filter((step) => step.status === "completed" && Boolean(step.inverse))
    .reverse();

  const reversed: string[] = [];
  for (const step of reversible) {
    reversed.push(
      await applyInverseEffect(String(step.tool), {
        workspaceId: String(run.workspaceId),
        ownerId: String(run.ownerId),
        runId: String(run._id),
        instruction: String(run.instruction),
        skill: run.skill as never,
        order: Number(step.order),
      })
    );
    step.status = "undone";
    await Step.updateOne({ _id: step._id }, { $set: { status: "undone" } });
  }

  run.state = "undone";
  run.undoAvailable = false;
  run.outcome = `Undone ${reversible.length} reversible actions.`;
  run.endedAt = new Date();
  await run.save();
  await Task.updateOne({ _id: run.taskId }, { $set: { status: "undone" } });

  await recordAudit({
    workspaceId: String(run.workspaceId),
    actor: actor.actorName,
    actorId: actor.actorId,
    action: "run.undone",
    target: "Run",
    targetId: String(run._id),
    result: "undone",
    detail: reversed.join(" · "),
    runId: String(run._id),
  });

  return toRun(run);
}

/** Manually retry a failed step. */
export async function retryStep(
  runId: string,
  stepId: string,
  actor: ActorContext
): Promise<RunDTO> {
  await connectDB();
  const run = await Run.findById(runId);
  if (!run) throw new Error("Run not found");
  const steps = run.steps as unknown as Array<
    Record<string, unknown> & { status: string }
  >;
  const step = steps.find((s) => String(s._id) === stepId);
  if (!step) throw new Error("Step not found");
  step.status = "pending";
  step.error = undefined;
  run.state = "executing";
  run.endedAt = undefined;
  await run.save();
  await recordAudit({
    workspaceId: String(run.workspaceId),
    actor: actor.actorName,
    actorId: actor.actorId,
    action: "run.step.retried",
    target: "Step",
    targetId: stepId,
    result: "retrying",
    runId: String(run._id),
  });
  return toRun(run);
}

/** Answer the single allowed clarifying question and re-plan. */
export async function answerClarification(
  runId: string,
  choice: string,
  actor: ActorContext
): Promise<RunDTO> {
  await connectDB();
  const run = await Run.findById(runId);
  if (!run) throw new Error("Run not found");
  if (run.state !== "needs_input") return toRun(run);

  const skill = SKILLS.find((s) => s.name === choice);
  const skillId = skill?.id ?? "general";
  const instruction = `${choice} — ${run.instruction}`;
  run.instruction = instruction;
  run.skill = skillId;
  run.clarification = undefined;
  run.clarificationChoices = [];
  run.modelRoute = chooseModelRoute(skillId);

  const template = planFor(skillId, instruction);
  const user = await User.findById(run.ownerId).lean();
  const plannedSteps = [];
  for (let order = 0; order < template.length; order++) {
    const step = template[order];
    const decision = await evaluatePolicy({
      workspaceId: String(run.workspaceId),
      step,
      autonomy: (user?.autonomyLevel as AutonomyLevel) ?? "L1",
      instruction,
    });
    plannedSteps.push({
      order,
      title: step.title,
      detail: step.detail,
      skill: skillId,
      tool: step.tool,
      app: step.app,
      risk: step.risk,
      scopes: step.scopes,
      idempotencyKey: idempotencyKey(String(run.ownerId), step.tool, order, instruction),
      inverse: step.inverse,
      requiresApproval: decision.requiresApproval,
      policyReason: decision.reason,
      status: "pending",
      attempts: 0,
      changes: [],
    });
  }
  run.plan = plannedSteps as never;
  run.steps = plannedSteps as never;
  run.state = "executing";
  run.startedAt = new Date();
  await run.save();

  await recordAudit({
    workspaceId: String(run.workspaceId),
    actor: actor.actorName,
    actorId: actor.actorId,
    action: "run.needs_input.answered",
    target: "Run",
    targetId: String(run._id),
    result: choice,
    runId: String(run._id),
  });

  return toRun(run);
}

export { todayISO };
