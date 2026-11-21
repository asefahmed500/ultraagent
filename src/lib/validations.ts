import { z } from "zod";
import {
  AUTONOMY_LEVELS,
  MEMORY_LAYERS,
  RISK_CLASSES,
  ROLES,
  TRIGGER_SOURCES,
} from "@/lib/constants";

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters.").max(60),
    email: z.email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password is too long."),
    confirmPassword: z.string(),
    workspace: z
      .string()
      .min(2, "Workspace name must be at least 2 characters.")
      .max(60),
    firstGoal: z.string().min(1, "Choose what you want help with first."),
    autonomyLevel: z.enum(AUTONOMY_LEVELS),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const commandSchema = z.object({
  instruction: z
    .string()
    .min(4, "Describe what you want UltraAgent to do.")
    .max(600, "Keep the instruction under 600 characters."),
  dryRun: z.boolean().optional().default(false),
  autonomyOverride: z.enum(AUTONOMY_LEVELS).optional(),
});
export type CommandInput = z.infer<typeof commandSchema>;

export const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(60),
  tone: z.string().min(2, "Describe your preferred tone.").max(120),
  timezone: z.string().min(1),
  workStart: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM."),
  workEnd: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM."),
  autonomyLevel: z.enum(AUTONOMY_LEVELS),
  locale: z.string().min(2),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

export const workspaceSchema = z.object({
  name: z.string().min(2).max(60),
  plan: z.enum(["Starter", "Team", "Enterprise"]),
  region: z.string().min(2),
  dataRetentionDays: z.coerce.number().min(1).max(3650),
  monthlyActionLimit: z.coerce.number().min(10).max(1_000_000),
  autonomyCeiling: z.enum(AUTONOMY_LEVELS),
});
export type WorkspaceInput = z.infer<typeof workspaceSchema>;

export const policySchema = z.object({
  name: z.string().min(3, "Give the policy a name.").max(80),
  scope: z.string().min(1),
  rule: z.string().min(3, "Describe the rule.").max(200),
  effect: z.enum(["allow", "deny", "require_approval"]),
  risk: z.enum([...RISK_CLASSES, "all"]),
  condition: z.string().min(1),
  threshold: z.coerce.number().min(0).optional(),
  enabled: z.boolean(),
});
export type PolicyInput = z.infer<typeof policySchema>;

export const triggerSchema = z.object({
  name: z.string().min(3, "Give the trigger a name.").max(80),
  source: z.enum(TRIGGER_SOURCES),
  condition: z.string().min(2, "Describe when this runs.").max(200),
  schedule: z.string().optional(),
  skill: z.string().min(1),
  instruction: z.string().min(4, "Describe the work to run.").max(600),
  enabled: z.boolean(),
  dryRun: z.boolean(),
});
export type TriggerInput = z.infer<typeof triggerSchema>;

export const memorySchema = z.object({
  layer: z.enum(MEMORY_LAYERS),
  subject: z.string().min(2, "Add a subject.").max(100),
  content: z.string().min(2, "Add content.").max(2000),
  pinned: z.boolean(),
});
export type MemoryInput = z.infer<typeof memorySchema>;

export const approvalDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected", "edited"]),
  note: z.string().max(500).optional(),
  editedInstruction: z.string().max(600).optional(),
});
export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>;

export const connectorSchema = z.object({
  provider: z.string().min(1),
  scopes: z.array(z.string()),
  account: z.string().optional(),
});
export type ConnectorInput = z.infer<typeof connectorSchema>;

export const skillSchema = z.object({
  id: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens."),
  name: z.string().min(3).max(80),
  description: z.string().min(10).max(400),
  instruction: z.string().min(10).max(600),
  risk: z.enum(RISK_CLASSES),
  tools: z.array(z.string()).min(1, "Choose at least one tool."),
});
export type SkillInput = z.infer<typeof skillSchema>;

export const roleSchema = z.object({
  role: z.enum(ROLES),
  autonomyLevel: z.enum(AUTONOMY_LEVELS),
});
export type RoleInput = z.infer<typeof roleSchema>;

export const approvalRequestSchema = z.object({
  title: z.string().min(3).max(100),
  type: z.enum(["expense", "request", "access"]),
  amount: z.coerce.number().min(0),
  category: z.string().min(2).max(60),
  approver: z.email("Choose a valid approver email."),
  justification: z.string().min(10).max(600),
});
export type ApprovalRequestInput = z.infer<typeof approvalRequestSchema>;

export const onboardingSchema = z.object({
  firstGoal: z.string().min(1),
  autonomyLevel: z.enum(AUTONOMY_LEVELS),
});
