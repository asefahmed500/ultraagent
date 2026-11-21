import type {
  ApprovalDecision,
  AutonomyLevel,
  MemoryLayer,
  RiskClass,
  Role,
  RunState,
  SkillId,
  StepStatus,
  TriggerSource,
  WebhookEvent,
} from "@/lib/constants";

export interface SerializedDoc {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDTO extends SerializedDoc {
  name: string;
  email: string;
  role: Role;
  workspaceId: string;
  autonomyLevel: AutonomyLevel;
  autonomyCeiling: AutonomyLevel;
  onboardingComplete: boolean;
  firstGoal: string;
  image?: string;
  locale: string;
  timezone: string;
  workingHours: { start: string; end: string };
  tone: string;
}

export interface WorkspaceDTO extends SerializedDoc {
  name: string;
  slug: string;
  plan: string;
  region: string;
  ownerId: string;
  autonomyCeiling: AutonomyLevel;
  dataRetentionDays: number;
  monthlyActionLimit: number;
  actionsUsedThisMonth: number;
  policySetId: string;
}

export interface ToolDefinition {
  name: string;
  version: string;
  risk: RiskClass;
  scopes: string[];
  inputs: string[];
  outputs: string[];
  inverse: string;
  limit: string;
  description: string;
}

export interface PlanStepDTO {
  id?: string;
  order: number;
  title: string;
  detail: string;
  skill: SkillId;
  tool: string;
  app: string;
  risk: RiskClass;
  scopes: string[];
  idempotencyKey: string;
  inverse: string;
  requiresApproval: boolean;
  policyReason: string;
  status: StepStatus;
  output?: string;
  changes?: string[];
  startedAt?: string;
  completedAt?: string;
  error?: string;
  attempts: number;
}

export interface TaskDTO extends SerializedDoc {
  ownerId: string;
  workspaceId: string;
  instruction: string;
  source: "command" | "trigger" | "api" | "webhook";
  status: string;
  skill: SkillId;
  runId?: string;
}

export interface RunDTO extends SerializedDoc {
  taskId: string;
  ownerId: string;
  workspaceId: string;
  skill: SkillId;
  instruction: string;
  state: RunState;
  plan: PlanStepDTO[];
  steps: PlanStepDTO[];
  outcome?: string;
  summary?: string;
  cost: number;
  tokens: number;
  model: string;
  startedAt?: string;
  endedAt?: string;
  approvalId?: string;
  undoAvailable: boolean;
  clarification?: string;
  clarificationChoices?: string[];
  error?: string;
  modelRoute?: string;
  dryRun?: boolean;
}

export interface ApprovalDTO extends SerializedDoc {
  runId: string;
  stepId: string;
  ownerId: string;
  workspaceId: string;
  requestedFrom: string;
  title: string;
  summary: string;
  risk: RiskClass;
  action: string;
  tool: string;
  decision: ApprovalDecision;
  channel: "app" | "email" | "slack" | "teams";
  decidedAt?: string;
  decidedBy?: string;
  note?: string;
  editedInstruction?: string;
  expiresAt: string;
}

export interface AuditEventDTO extends SerializedDoc {
  workspaceId: string;
  actor: string;
  actorId: string;
  action: string;
  target: string;
  targetId: string;
  result: string;
  detail: string;
  hash: string;
  previousHash: string;
  runId?: string;
  timestamp: string;
}

export interface ConnectorDTO extends SerializedDoc {
  workspaceId: string;
  provider: string;
  name: string;
  description: string;
  scopes: string[];
  requestedScopes: string[];
  status: "connected" | "disconnected" | "error" | "consent_required";
  health: "healthy" | "degraded" | "down";
  category: string;
  icon: string;
  lastSync?: string;
  tokenRef: string;
  account?: string;
}

export interface PolicyDTO extends SerializedDoc {
  workspaceId: string;
  scope: string;
  name: string;
  rule: string;
  effect: "allow" | "deny" | "require_approval";
  risk: RiskClass | "all";
  condition: string;
  threshold?: number;
  enabled: boolean;
  version: number;
  effectiveAt: string;
  createdBy: string;
}

export interface TriggerDTO extends SerializedDoc {
  workspaceId: string;
  ownerId: string;
  name: string;
  source: TriggerSource;
  condition: string;
  schedule?: string;
  skill: SkillId;
  instruction: string;
  params: Record<string, string>;
  enabled: boolean;
  dryRun: boolean;
  lastRunAt?: string;
  runCount: number;
}

export interface MemoryItemDTO extends SerializedDoc {
  workspaceId: string;
  userId: string;
  layer: MemoryLayer;
  subject: string;
  content: string;
  sourceRun?: string;
  expiresAt?: string;
  pinned: boolean;
}

export interface SkillDTO {
  id: SkillId;
  name: string;
  description: string;
  category: string;
  tools: ToolDefinition[];
  risk: RiskClass;
  icon: string;
  example: string;
  version: string;
  installed: boolean;
  autonomyFloor: AutonomyLevel;
}

export interface EmailMessageDTO extends SerializedDoc {
  workspaceId: string;
  ownerId: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  category: string;
  labels: string[];
  read: boolean;
  archived: boolean;
  starred: boolean;
  draft?: string;
  draftStatus?: "none" | "ready" | "sent" | "rejected";
  receivedAt: string;
  external: boolean;
}

export interface CalendarEventDTO extends SerializedDoc {
  workspaceId: string;
  ownerId: string;
  title: string;
  start: string;
  end: string;
  attendees: string[];
  agenda: string;
  videoLink: string;
  status: "proposed" | "booked" | "cancelled";
  external: boolean;
  location?: string;
}

export interface DocumentDTO extends SerializedDoc {
  workspaceId: string;
  ownerId: string;
  title: string;
  source: string;
  summary: string;
  keyPoints: string[];
  risks: string[];
  openQuestions: string[];
  citations: { section: string; excerpt: string }[];
  classification: "Public" | "Internal" | "Confidential";
  sharedTo?: string;
  runId?: string;
}

export interface ReportDTO extends SerializedDoc {
  workspaceId: string;
  ownerId: string;
  title: string;
  period: string;
  sources: string[];
  notes: string;
  narrative: string;
  metrics: { label: string; value: number; delta: number }[];
  chart: { month: string; value: number; target: number }[];
  version: number;
  status: "draft" | "ready" | "sent";
  recipients: string[];
  staleInputs: string[];
  runId?: string;
}

export interface MeetingDTO extends SerializedDoc {
  workspaceId: string;
  ownerId: string;
  title: string;
  date: string;
  duration: number;
  participants: string[];
  consent: boolean;
  notes: string;
  decisions: string[];
  actions: {
    task: string;
    owner: string;
    due: string;
    confidence: number;
    created: boolean;
  }[];
  recapSent: boolean;
  runId?: string;
}

export interface ApprovalRequestDTO extends SerializedDoc {
  workspaceId: string;
  ownerId: string;
  title: string;
  type: "expense" | "request" | "access";
  amount: number;
  category: string;
  requester: string;
  approver: string;
  justification: string;
  status: "pending" | "approved" | "rejected" | "auto_approved";
  policyCheck: string;
  separationOfDuties: boolean;
  decidedAt?: string;
}

export interface SavedCommandDTO extends SerializedDoc {
  workspaceId: string;
  ownerId: string;
  label: string;
  instruction: string;
  shortcut: string;
  useCount: number;
}

export interface WebhookEventDTO extends SerializedDoc {
  workspaceId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  delivered: boolean;
  attempts: number;
  signatureValid: boolean;
}

export interface NotificationDTO extends SerializedDoc {
  workspaceId: string;
  userId: string;
  title: string;
  body: string;
  kind: "info" | "success" | "warning" | "approval";
  read: boolean;
  href?: string;
}
