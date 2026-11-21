/** Shared vocabulary from the UltraAgent PRD. */

export const ROLES = ["owner", "admin", "manager", "member", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const AUTONOMY_LEVELS = ["L0", "L1", "L2", "L3"] as const;
export type AutonomyLevel = (typeof AUTONOMY_LEVELS)[number];

export const AUTONOMY_DETAILS: Record<
  AutonomyLevel,
  { name: string; description: string; defaultFor: string }
> = {
  L0: {
    name: "Suggest",
    description: "Plans and drafts only. You execute every action yourself.",
    defaultFor: "New workspaces, regulated teams",
  },
  L1: {
    name: "Ask",
    description:
      "Acts on reads and safe writes; asks before external or irreversible actions.",
    defaultFor: "Default for all workspaces",
  },
  L2: {
    name: "Act within policy",
    description: "Executes anything allowed by policy; asks only on exceptions.",
    defaultFor: "Trusted skills and users",
  },
  L3: {
    name: "Autopilot",
    description:
      "Runs scheduled and triggered work without prompts, with digest and undo.",
    defaultFor: "Admin-enabled skills only",
  },
};

export const RISK_CLASSES = [
  "read",
  "reversible_write",
  "external_communication",
  "irreversible_financial",
] as const;
export type RiskClass = (typeof RISK_CLASSES)[number];

export const RISK_LABELS: Record<RiskClass, string> = {
  read: "Read",
  reversible_write: "Reversible write",
  external_communication: "External communication",
  irreversible_financial: "Irreversible / financial",
};

export const STEP_STATUSES = [
  "pending",
  "running",
  "awaiting_approval",
  "completed",
  "rejected",
  "failed",
  "undone",
] as const;
export type StepStatus = (typeof STEP_STATUSES)[number];

export const RUN_STATES = [
  "queued",
  "planning",
  "executing",
  "awaiting_approval",
  "needs_input",
  "verifying",
  "completed",
  "failed",
  "retrying",
  "rejected",
  "undone",
  "escalated",
] as const;
export type RunState = (typeof RUN_STATES)[number];

export const APPROVAL_DECISIONS = [
  "pending",
  "approved",
  "rejected",
  "edited",
  "expired",
] as const;
export type ApprovalDecision = (typeof APPROVAL_DECISIONS)[number];

export const SKILL_IDS = [
  "inbox-triage",
  "calendar-scheduling",
  "document-summary",
  "weekly-report",
  "meeting-notes",
  "approvals",
  "general",
] as const;
export type SkillId = (typeof SKILL_IDS)[number];

export const CONNECTOR_PROVIDERS = [
  "google-workspace",
  "microsoft-365",
  "slack",
  "teams",
  "salesforce",
  "jira",
  "stripe",
] as const;
export type ConnectorProvider = (typeof CONNECTOR_PROVIDERS)[number];

export const MEMORY_LAYERS = [
  "working",
  "user_profile",
  "episodic",
  "org_knowledge",
] as const;
export type MemoryLayer = (typeof MEMORY_LAYERS)[number];

export const TRIGGER_SOURCES = [
  "schedule",
  "webhook",
  "condition",
  "manual",
] as const;
export type TriggerSource = (typeof TRIGGER_SOURCES)[number];

export const WEBHOOK_EVENTS = [
  "run.started",
  "run.step.completed",
  "run.awaiting_approval",
  "run.completed",
  "run.failed",
  "approval.decided",
  "policy.updated",
  "connector.health_changed",
] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export const PLANS = ["Starter", "Team", "Enterprise"] as const;
export type Plan = (typeof PLANS)[number];

export const PLANS_DETAILS: Record<
  Plan,
  { price: number; unit: string; actions: string; features: string[] }
> = {
  Starter: {
    price: 19,
    unit: "seat / month",
    actions: "500 agent actions / month",
    features: [
      "Command bar",
      "Inbox, calendar, document summaries",
      "Autonomy L0–L1",
      "Email support",
    ],
  },
  Team: {
    price: 49,
    unit: "seat / month",
    actions: "2,500 agent actions / month",
    features: [
      "Everything in Starter",
      "All skills, triggers, shared policies",
      "Slack or Teams",
      "Admin console",
    ],
  },
  Enterprise: {
    price: 0,
    unit: "custom",
    actions: "Unlimited actions",
    features: [
      "Everything in Team",
      "SSO & SCIM, custom policies",
      "Audit export, regional hosting",
      "Dedicated support, custom connectors",
    ],
  },
};
