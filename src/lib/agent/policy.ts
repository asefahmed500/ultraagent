import { connectDB } from "@/lib/mongodb";
import Policy from "@/models/Policy";
import type { AutonomyLevel, RiskClass } from "@/lib/constants";
import type { PlanTemplateStep } from "@/lib/agent/registry";

export interface PolicyDecision {
  requiresApproval: boolean;
  blocked: boolean;
  reason: string;
  effect: "allow" | "deny" | "require_approval" | "default";
  matchedPolicy?: string;
}

const LEVEL_RANK: Record<AutonomyLevel, number> = { L0: 0, L1: 1, L2: 2, L3: 3 };

const INJECTION_PATTERNS = [
  "ignore previous instructions",
  "ignore all previous",
  "disregard policy",
  "reveal system prompt",
  "bypass approval",
  "disable safety",
  "you are now",
];

/** Detect prompt injection in untrusted instruction text. */
export function detectInjection(text: string): boolean {
  const lower = text.toLowerCase();
  return INJECTION_PATTERNS.some((pattern) => lower.includes(pattern));
}

function defaultDecision(
  risk: RiskClass,
  autonomy: AutonomyLevel,
  isScheduled: boolean
): PolicyDecision {
  const rank = LEVEL_RANK[autonomy];
  if (risk === "read") {
    return {
      requiresApproval: false,
      blocked: false,
      reason: "Read-only step — safe to run at any autonomy level.",
      effect: "default",
    };
  }
  if (risk === "reversible_write") {
    if (rank === 0) {
      return {
        requiresApproval: true,
        blocked: false,
        reason: "L0 Suggest: drafts only, you execute every write.",
        effect: "default",
      };
    }
    return {
      requiresApproval: false,
      blocked: false,
      reason: `Reversible write allowed at ${autonomy}; an inverse is stored.`,
      effect: "default",
    };
  }
  if (risk === "external_communication") {
    if (rank >= 3 && isScheduled) {
      return {
        requiresApproval: false,
        blocked: false,
        reason: "L3 Autopilot on a scheduled run with digest and undo.",
        effect: "default",
      };
    }
    if (rank >= 2) {
      return {
        requiresApproval: false,
        blocked: false,
        reason: "L2 Act within policy — external step allowed by default ceiling.",
        effect: "default",
      };
    }
    return {
      requiresApproval: true,
      blocked: false,
      reason: `${autonomy} requires approval before external communication.`,
      effect: "default",
    };
  }
  // irreversible_financial
  if (rank >= 3 && isScheduled) {
    return {
      requiresApproval: false,
      blocked: false,
      reason: "L3 Autopilot scheduled run — financial step within policy.",
      effect: "default",
    };
  }
  return {
    requiresApproval: true,
    blocked: false,
    reason: "Irreversible or financial steps always need a human decision.",
    effect: "default",
  };
}

/**
 * Evaluate a step against declarative workspace policies plus the default
 * risk/autonomy matrix. The agent never has broader access than the user.
 */
export async function evaluatePolicy(params: {
  workspaceId: string;
  step: PlanTemplateStep;
  autonomy: AutonomyLevel;
  instruction: string;
  isScheduled?: boolean;
  autonomyCeiling?: AutonomyLevel;
}): Promise<PolicyDecision> {
  await connectDB();
  const ceiling = params.autonomyCeiling ?? "L3";
  const effectiveAutonomy =
    LEVEL_RANK[params.autonomy] > LEVEL_RANK[ceiling] ? ceiling : params.autonomy;

  const policies = await Policy.find({
    workspaceId: params.workspaceId,
    enabled: true,
  })
    .sort({ version: -1 })
    .lean();

  const injection = detectInjection(params.instruction);

  for (const policy of policies) {
    const riskMatches =
      policy.risk === "all" || policy.risk === params.step.risk;
    const condition = String(policy.condition ?? "").toLowerCase();
    const conditionMatches =
      !condition ||
      condition === "always" ||
      params.step.tool.includes(condition) ||
      params.step.app.toLowerCase().includes(condition) ||
      params.instruction.toLowerCase().includes(condition) ||
      (condition === "external" && params.step.risk === "external_communication") ||
      (condition === "financial" && params.step.risk === "irreversible_financial");

    if (!riskMatches || !conditionMatches) continue;

    const name = String(policy.name);
    if (policy.effect === "deny") {
      return {
        requiresApproval: false,
        blocked: true,
        reason: `Blocked by policy “${name}”: ${policy.rule}`,
        effect: "deny",
        matchedPolicy: name,
      };
    }
    if (policy.effect === "require_approval") {
      return {
        requiresApproval: true,
        blocked: false,
        reason: `Policy “${name}” requires approval: ${policy.rule}`,
        effect: "require_approval",
        matchedPolicy: name,
      };
    }
    if (policy.effect === "allow") {
      const threshold = policy.threshold;
      if (
        threshold === undefined ||
        threshold === null ||
        threshold <= 0 ||
        params.step.risk !== "irreversible_financial"
      ) {
        return {
          requiresApproval: false,
          blocked: false,
          reason: `Allowed by policy “${name}”: ${policy.rule}`,
          effect: "allow",
          matchedPolicy: name,
        };
      }
    }
  }

  const decision = defaultDecision(
    params.step.risk,
    effectiveAutonomy,
    params.isScheduled ?? false
  );

  if (injection && !decision.blocked) {
    return {
      requiresApproval: true,
      blocked: false,
      reason:
        "Instruction from untrusted content attempted to change the plan — approval required before this step runs.",
      effect: "require_approval",
      matchedPolicy: "Prompt-injection defence",
    };
  }

  return decision;
}
