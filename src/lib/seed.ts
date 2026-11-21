import { connectDB } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import { recordAudit } from "@/lib/audit";
import Workspace from "@/models/Workspace";
import User from "@/models/User";
import Connector from "@/models/Connector";
import Policy from "@/models/Policy";
import Trigger from "@/models/Trigger";
import MemoryItem from "@/models/MemoryItem";
import EmailMessage from "@/models/EmailMessage";
import CalendarEvent from "@/models/CalendarEvent";
import Document from "@/models/Document";
import Report from "@/models/Report";
import Meeting from "@/models/Meeting";
import ApprovalRequest from "@/models/ApprovalRequest";
import SavedCommand from "@/models/SavedCommand";
import Notification from "@/models/Notification";
import Task from "@/models/Task";
import Run from "@/models/Run";
import Approval from "@/models/Approval";

export const DEMO_EMAIL = "demo@ultraagent.ai";
export const DEMO_PASSWORD = "demo1234";

const CONNECTORS = [
  {
    provider: "google-workspace",
    name: "Google Workspace",
    description: "Gmail, Calendar and Drive for your workspace.",
    scopes: ["mail.read", "mail.labels.write", "calendar.read", "calendar.events.write", "docs.read"],
    category: "Productivity",
    icon: "Mail",
    status: "connected",
  },
  {
    provider: "microsoft-365",
    name: "Microsoft 365",
    description: "Outlook, Exchange and SharePoint for your workspace.",
    scopes: ["mail.read", "calendar.read", "docs.read"],
    category: "Productivity",
    icon: "Mail",
    status: "disconnected",
  },
  {
    provider: "slack",
    name: "Slack",
    description: "Post summaries, approvals and recaps to channels.",
    scopes: ["chat.write", "channels.read"],
    category: "Communication",
    icon: "MessageSquare",
    status: "connected",
  },
  {
    provider: "teams",
    name: "Microsoft Teams",
    description: "Send recaps and one-tap approval decisions.",
    scopes: ["chat.write"],
    category: "Communication",
    icon: "MessageSquare",
    status: "disconnected",
  },
  {
    provider: "salesforce",
    name: "Salesforce",
    description: "CRM data for reports and pipeline briefings.",
    scopes: ["crm.read"],
    category: "CRM",
    icon: "Cloud",
    status: "disconnected",
  },
  {
    provider: "jira",
    name: "Jira",
    description: "Create and update tracker tasks from actions.",
    scopes: ["tracker.write"],
    category: "Engineering",
    icon: "KanbanSquare",
    status: "connected",
  },
  {
    provider: "stripe",
    name: "Stripe",
    description: "Finance data for expense and invoice checks.",
    scopes: ["finance.read"],
    category: "Finance",
    icon: "CreditCard",
    status: "disconnected",
  },
];

const POLICIES = [
  {
    name: "External mail needs approval",
    scope: "workspace",
    rule: "Never send external mail without a human decision.",
    effect: "require_approval",
    risk: "external_communication",
    condition: "mail.send",
    enabled: true,
  },
  {
    name: "Payments above $2,000",
    scope: "workspace",
    rule: "Financial actions over $2,000 require a named approver.",
    effect: "require_approval",
    risk: "irreversible_financial",
    condition: "financial",
    threshold: 2000,
    enabled: true,
  },
  {
    name: "No actions on Confidential docs",
    scope: "workspace",
    rule: "Confidential documents cannot be shared without admin consent.",
    effect: "deny",
    risk: "all",
    condition: "docs.share",
    enabled: true,
  },
  {
    name: "Auto-approve internal reads",
    scope: "workspace",
    rule: "Read-only steps inside the workspace are always allowed.",
    effect: "allow",
    risk: "read",
    condition: "always",
    enabled: true,
  },
  {
    name: "Newsletter archiving",
    scope: "workspace",
    rule: "Archiving newsletters is a safe reversible write.",
    effect: "allow",
    risk: "reversible_write",
    condition: "mail.archive",
    enabled: true,
  },
];

const EMAILS = [
  ["dana@company.com", "Dana Lee", "Q3 budget approval", "Can you approve the Q3 budget by Friday? The finance team is waiting on the final sign-off.", "Finance", false],
  ["sam@company.com", "Sam Rivera", "Notes from today's sync", "Here are the notes and action items from our sync. Let me know if I missed anything.", "Calendar", false],
  ["hr@company.com", "People Team", "Benefits enrolment closes soon", "Enrolment for next year closes on the 30th. Please review your selections.", "HR", false],
  ["legal@company.com", "Legal", "Vendor contract — please review", "Attached is the vendor agreement. Key sections are 4 and 9.", "Legal", false],
  ["newsletter@designweekly.com", "Design Weekly", "This week in design systems", "A roundup of new component libraries and typography tools.", "Newsletter", true],
  ["dana@company.com", "Dana Lee", "Re: Client briefing", "Thanks for the draft. Could you shorten the executive summary?", "Calendar", false],
  ["finance@company.com", "Finance", "Invoice #INV-2041 attached", "Please review and route invoice INV-2041 for approval.", "Finance", false],
  ["notifications@github.com", "GitHub", "Weekly digest for ultraagent/web", "12 PRs merged, 3 issues closed, 1 security alert.", "Newsletter", false],
  ["ops@company.com", "Ops", "Friday report inputs", "The spreadsheet and tracker are updated for this week's report.", "Finance", false],
  ["news@producthunt.com", "Product Hunt", "Top products this week", "Your weekly digest of new launches.", "Newsletter", true],
] as const;

export async function ensureSeedData(
  userId?: string,
  workspaceId?: string
): Promise<void> {
  await connectDB();

  const existingWorkspace = workspaceId
    ? await Workspace.findById(workspaceId)
    : await Workspace.findOne({ slug: "ultraagent-demo" });
  if (existingWorkspace) return;

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const workspace = await Workspace.create({
    name: "UltraAgent Demo",
    slug: "ultraagent-demo",
    plan: "Team",
    region: "us-east",
    ownerId: "pending",
    autonomyCeiling: "L2",
    dataRetentionDays: 365,
    monthlyActionLimit: 2500,
    actionsUsedThisMonth: 184,
  });

  const demo = await User.create({
    name: "Alex Morgan",
    email: DEMO_EMAIL,
    passwordHash,
    role: "owner",
    workspaceId: String(workspace._id),
    autonomyLevel: "L1",
    autonomyCeiling: "L2",
    onboardingComplete: true,
    firstGoal: "all",
    timezone: "America/New_York",
    workingHours: { start: "09:00", end: "17:00" },
    tone: "concise and professional",
    styleProfile:
      "Short sentences, direct asks, warm but never casual. Signs off as 'Best, Alex'.",
  });

  await User.create([
    {
      name: "Priya Shah",
      email: "admin@ultraagent.ai",
      passwordHash,
      role: "admin",
      workspaceId: String(workspace._id),
      autonomyLevel: "L1",
      autonomyCeiling: "L3",
      onboardingComplete: true,
      firstGoal: "all",
    },
    {
      name: "Sam Rivera",
      email: "sam@company.com",
      passwordHash,
      role: "member",
      workspaceId: String(workspace._id),
      autonomyLevel: "L1",
      autonomyCeiling: "L1",
      onboardingComplete: true,
      firstGoal: "inbox",
    },
  ]);

  workspace.ownerId = String(demo._id);
  await workspace.save();

  await Connector.insertMany(
    CONNECTORS.map((connector) => ({
      ...connector,
      workspaceId: String(workspace._id),
      requestedScopes: connector.scopes,
      health: connector.status === "connected" ? "healthy" : "healthy",
      account:
        connector.status === "connected" ? "alex@company.com" : undefined,
      lastSync: new Date(Date.now() - 1000 * 60 * 42),
      tokenRef: `vault://connector/${connector.provider}`,
    }))
  );

  await Policy.insertMany(
    POLICIES.map((policy) => ({
      ...policy,
      workspaceId: String(workspace._id),
      createdBy: String(demo._id),
      version: 1,
      effectiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    }))
  );

  await Trigger.insertMany([
    {
      workspaceId: String(workspace._id),
      ownerId: String(demo._id),
      name: "Friday weekly report",
      source: "schedule",
      condition: "Every Friday at 15:00",
      schedule: "0 15 * * 5",
      skill: "weekly-report",
      instruction: "Build the weekly report from the tracker and save it",
      params: { recipients: "leadership@company.com" },
      enabled: true,
      dryRun: false,
      runCount: 6,
      lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    },
    {
      workspaceId: String(workspace._id),
      ownerId: String(demo._id),
      name: "Daily inbox triage",
      source: "schedule",
      condition: "Every weekday at 08:00",
      schedule: "0 8 * * 1-5",
      skill: "inbox-triage",
      instruction: "Sort my inbox and draft replies to important messages",
      params: {},
      enabled: true,
      dryRun: false,
      runCount: 23,
      lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 9),
    },
    {
      workspaceId: String(workspace._id),
      ownerId: String(demo._id),
      name: "Vendor invoice routing",
      source: "webhook",
      condition: "When a vendor invoice arrives",
      skill: "approvals",
      instruction: "Check the vendor invoice and route it for approval",
      params: { limit: "2000" },
      enabled: false,
      dryRun: true,
      runCount: 2,
    },
  ]);

  await MemoryItem.insertMany([
    {
      workspaceId: String(workspace._id),
      userId: String(demo._id),
      layer: "user_profile",
      subject: "Writing tone",
      content: "Concise and professional. Avoid long intros. Sign off with 'Best, Alex'.",
      pinned: true,
    },
    {
      workspaceId: String(workspace._id),
      userId: String(demo._id),
      layer: "user_profile",
      subject: "Working hours",
      content: "09:00–17:00 America/New_York. No external meetings before 10:00.",
      pinned: false,
    },
    {
      workspaceId: String(workspace._id),
      userId: String(demo._id),
      layer: "org_knowledge",
      subject: "Approval policy",
      content: "External spend above $2,000 needs Dana's approval. Never approve your own request chain.",
      pinned: true,
    },
    {
      workspaceId: String(workspace._id),
      userId: String(demo._id),
      layer: "episodic",
      subject: "Weekly report preference",
      content: "User prefers the report saved as a doc before it is emailed.",
      pinned: false,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  ]);

  await EmailMessage.insertMany(
    EMAILS.map(([from, fromName, subject, body, category, external], index) => ({
      workspaceId: String(workspace._id),
      ownerId: String(demo._id),
      from,
      fromName,
      to: "alex@company.com",
      subject,
      preview: body.slice(0, 110),
      body,
      category,
      labels: [category],
      read: index % 3 === 0,
      archived: false,
      starred: index === 0 || index === 5,
      external,
      receivedAt: new Date(Date.now() - index * 1000 * 60 * 73),
    }))
  );

  await CalendarEvent.insertMany([
    {
      workspaceId: String(workspace._id),
      ownerId: String(demo._id),
      title: "Weekly operations sync",
      start: new Date(Date.now() + 1000 * 60 * 60 * 24),
      end: new Date(Date.now() + 1000 * 60 * 60 * 24 + 30 * 60 * 1000),
      attendees: ["dana@company.com", "sam@company.com"],
      agenda: "Delivery metrics, approval flow, weekly report timing.",
      videoLink: "https://meet.google.com/ultra-agent",
      status: "booked",
      external: false,
    },
    {
      workspaceId: String(workspace._id),
      ownerId: String(demo._id),
      title: "Client briefing — Acme",
      start: new Date(Date.now() + 1000 * 60 * 60 * 48),
      end: new Date(Date.now() + 1000 * 60 * 60 * 49),
      attendees: ["client@acme.com"],
      agenda: "Q3 results and renewal proposal.",
      videoLink: "https://meet.google.com/acme-brief",
      status: "proposed",
      external: true,
    },
    {
      workspaceId: String(workspace._id),
      ownerId: String(demo._id),
      title: "Focus block — Report prep",
      start: new Date(Date.now() + 1000 * 60 * 60 * 72),
      end: new Date(Date.now() + 1000 * 60 * 60 * 74),
      attendees: [],
      agenda: "Prepare inputs for the weekly report.",
      videoLink: "",
      status: "booked",
      external: false,
    },
  ]);

  await Document.create({
    workspaceId: String(workspace._id),
    ownerId: String(demo._id),
    title: "Vendor contract — Acme Cloud",
    source: "Drive / vendor-contract-2026.pdf",
    summary: "12-month auto-renewing agreement with a liability cap and locked year-one pricing.",
    keyPoints: ["Auto-renews in 12 months", "Liability capped at 12 months of fees", "Pricing locked for year one"],
    risks: ["30-day renewal notice window", "Liability cap may be low"],
    openQuestions: ["Can the notice period be shortened?"],
    citations: [{ section: "§4 Term and Renewal", excerpt: "Renews automatically for successive 12-month terms." }],
    classification: "Confidential",
  });

  await Report.create({
    workspaceId: String(workspace._id),
    ownerId: String(demo._id),
    title: "Weekly report — last week",
    period: "Last 7 days",
    sources: ["Sheets / Revenue", "Tracker / Delivery", "CRM / Pipeline"],
    notes: "CRM input was 1 day stale and flagged in the output.",
    narrative: "Revenue grew 12% week over week while cycle time fell by 1.4 days.",
    metrics: [
      { label: "Revenue", value: 248000, delta: 12.4 },
      { label: "Tasks completed", value: 318, delta: 8.1 },
      { label: "Cycle time", value: 3.2, delta: -1.4 },
      { label: "Approval acceptance", value: 86, delta: 4 },
    ],
    chart: [
      { month: "W1", value: 196, target: 200 },
      { month: "W2", value: 218, target: 210 },
      { month: "W3", value: 231, target: 220 },
      { month: "W4", value: 248, target: 230 },
    ],
    version: 3,
    status: "sent",
    recipients: ["leadership@company.com"],
    staleInputs: ["CRM / Pipeline (1 day stale)"],
  });

  await Meeting.create({
    workspaceId: String(workspace._id),
    ownerId: String(demo._id),
    title: "Weekly operations sync",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    duration: 32,
    participants: ["Dana", "Sam", "Alex"],
    consent: true,
    notes: "Reviewed delivery metrics and agreed to tighten the approval flow.",
    decisions: ["Adopt L1 autonomy", "Move weekly report to Fridays"],
    actions: [
      { task: "Draft revised approval policy", owner: "Dana", due: "Friday", confidence: 0.94, created: true },
      { task: "Update report schedule", owner: "Sam", due: "Wednesday", confidence: 0.71, created: true },
    ],
    recapSent: true,
  });

  await ApprovalRequest.insertMany([
    {
      workspaceId: String(workspace._id),
      ownerId: String(demo._id),
      title: "Vendor invoice — Acme Cloud",
      type: "expense",
      amount: 1200,
      category: "Software",
      requester: "sam@company.com",
      approver: "dana@company.com",
      justification: "Annual analytics licence renewal, within budget.",
      status: "pending",
      policyCheck: "Within $2,000 limit; separation of duties enforced.",
      separationOfDuties: true,
    },
    {
      workspaceId: String(workspace._id),
      ownerId: String(demo._id),
      title: "Conference travel",
      type: "expense",
      amount: 2450,
      category: "Travel",
      requester: "alex@company.com",
      approver: "dana@company.com",
      justification: "Operations summit registration and travel.",
      status: "pending",
      policyCheck: "Above $2,000 — named approver required.",
      separationOfDuties: true,
    },
  ]);

  await SavedCommand.insertMany([
    { workspaceId: String(workspace._id), ownerId: String(demo._id), label: "Triage inbox", instruction: "Sort my inbox and draft replies", shortcut: "⌘1", useCount: 14 },
    { workspaceId: String(workspace._id), ownerId: String(demo._id), label: "Weekly report", instruction: "Build the weekly report from the tracker", shortcut: "⌘2", useCount: 8 },
    { workspaceId: String(workspace._id), ownerId: String(demo._id), label: "Daily brief", instruction: "Prepare a briefing for today's meetings", shortcut: "⌘3", useCount: 21 },
    { workspaceId: String(workspace._id), ownerId: String(demo._id), label: "Approvals", instruction: "Check pending approvals and route them", shortcut: "⌘4", useCount: 5 },
  ]);

  await Notification.insertMany([
    { workspaceId: String(workspace._id), userId: String(demo._id), title: "Weekly report is ready", body: "Version 3 was saved and sent to leadership.", kind: "success", read: false },
    { workspaceId: String(workspace._id), userId: String(demo._id), title: "2 approvals waiting", body: "One expense is above the auto-approve limit.", kind: "approval", read: false, href: "/dashboard/approvals" },
    { workspaceId: String(workspace._id), userId: String(demo._id), title: "Connector healthy", body: "Google Workspace reconnected after a token refresh.", kind: "info", read: true },
  ]);

  await recordAudit({
    workspaceId: String(workspace._id),
    actor: "System",
    actorId: "system",
    action: "workspace.created",
    target: "Workspace",
    targetId: String(workspace._id),
    result: "created",
    detail: "Seed workspace and demo data created.",
  });

  // A completed run — visible on Home, Tasks, Activity and the run detail page.
  const completedTask = await Task.create({
    ownerId: String(demo._id),
    workspaceId: String(workspace._id),
    instruction: "Sort my inbox and draft replies",
    source: "trigger",
    status: "completed",
    skill: "inbox-triage",
  });
  const completedSteps = [
    {
      order: 0, title: "Read new mail", detail: "Read unread messages within your access.",
      skill: "inbox-triage", tool: "mail.read", app: "Gmail", risk: "read",
      scopes: ["mail.read"], idempotencyKey: "seed-read-1", inverse: "",
      requiresApproval: false, policyReason: "Read-only step — safe to run.",
      status: "completed", output: "Read 10 messages within your access.",
      changes: ["Scanned 10 messages"], attempts: 1,
      completedAt: new Date(Date.now() - 1000 * 60 * 46),
    },
    {
      order: 1, title: "Classify messages", detail: "Sort into 5 categories.",
      skill: "inbox-triage", tool: "mail.classify", app: "UltraAgent", risk: "read",
      scopes: ["mail.read"], idempotencyKey: "seed-classify-1", inverse: "",
      requiresApproval: false, policyReason: "Read-only step — safe to run.",
      status: "completed", output: "Classified 10 messages into 5 categories.",
      changes: ["Finance: 2", "Calendar: 2", "Newsletter filtered"], attempts: 1,
      completedAt: new Date(Date.now() - 1000 * 60 * 44),
    },
    {
      order: 2, title: "Apply labels", detail: "Label each message with its category.",
      skill: "inbox-triage", tool: "mail.label", app: "Gmail", risk: "reversible_write",
      scopes: ["mail.labels.write"], idempotencyKey: "seed-label-1", inverse: "mail.unlabel",
      requiresApproval: false, policyReason: "Reversible write allowed at L1.",
      status: "completed", output: "Applied label “Finance”. Inverse: mail.unlabel.",
      changes: ["Label: Finance"], attempts: 1,
      completedAt: new Date(Date.now() - 1000 * 60 * 42),
    },
  ];
  const completedRun = await Run.create({
    taskId: String(completedTask._id),
    ownerId: String(demo._id),
    workspaceId: String(workspace._id),
    skill: "inbox-triage",
    instruction: "Sort my inbox and draft replies",
    state: "completed",
    plan: completedSteps,
    steps: completedSteps,
    outcome: "3 steps completed successfully.",
    summary: "Scanned 10 messages · Classified into 5 categories · Labels applied",
    cost: 0.06, tokens: 960, model: "glm-4.5-air (simulated)",
    startedAt: new Date(Date.now() - 1000 * 60 * 48),
    endedAt: new Date(Date.now() - 1000 * 60 * 40),
    undoAvailable: true, latencyMs: 480000, modelRoute: "small-fast",
  });
  completedTask.runId = String(completedRun._id);
  await completedTask.save();
  for (const step of completedSteps) {
    await recordAudit({
      workspaceId: String(workspace._id), actor: "UltraAgent", actorId: String(demo._id),
      action: "run.step.completed", target: "Step", targetId: step.title,
      result: "completed", detail: `${step.tool} — ${step.output}`, runId: String(completedRun._id),
      timestamp: step.completedAt,
    });
  }
  await recordAudit({
    workspaceId: String(workspace._id), actor: "UltraAgent", actorId: String(demo._id),
    action: "run.completed", target: "Run", targetId: String(completedRun._id),
    result: "completed", detail: "3 steps completed", runId: String(completedRun._id),
  });

  // A run paused at an approval gate — visible in Approvals and Home.
  const pendingTask = await Task.create({
    ownerId: String(demo._id),
    workspaceId: String(workspace._id),
    instruction: "Book 30 minutes with the client tomorrow and send invites",
    source: "command",
    status: "awaiting_approval",
    skill: "calendar-scheduling",
  });
  const pendingSteps = [
    {
      order: 0, title: "Read free / busy", detail: "Check availability for all attendees.",
      skill: "calendar-scheduling", tool: "calendar.read_free_busy", app: "Google Calendar", risk: "read",
      scopes: ["calendar.read"], idempotencyKey: "seed-fb-1", inverse: "",
      requiresApproval: false, policyReason: "Read-only step — safe to run.",
      status: "completed", output: "Found 3 ranked slots inside working hours.",
      changes: ["Proposed 3 slots"], attempts: 1,
      completedAt: new Date(Date.now() - 1000 * 60 * 12),
    },
    {
      order: 1, title: "Create the event", detail: "Create with agenda and video link.",
      skill: "calendar-scheduling", tool: "calendar.create_event", app: "Google Calendar", risk: "reversible_write",
      scopes: ["calendar.events.write"], idempotencyKey: "seed-event-1", inverse: "calendar.cancel_event",
      requiresApproval: false, policyReason: "Reversible write allowed at L1.",
      status: "completed", output: "Event created with agenda and video link.",
      changes: ["Created event: tomorrow 14:00", "Inverse: calendar.cancel_event"], attempts: 1,
      completedAt: new Date(Date.now() - 1000 * 60 * 10),
    },
    {
      order: 2, title: "Send invites", detail: "Notify external attendees.",
      skill: "calendar-scheduling", tool: "calendar.send_invites", app: "Google Calendar", risk: "external_communication",
      scopes: ["calendar.events.write"], idempotencyKey: "seed-invites-1", inverse: "calendar.cancel_event",
      requiresApproval: true, policyReason: "L1 requires approval before external communication.",
      status: "awaiting_approval", attempts: 0,
    },
  ];
  const pendingRun = await Run.create({
    taskId: String(pendingTask._id),
    ownerId: String(demo._id),
    workspaceId: String(workspace._id),
    skill: "calendar-scheduling",
    instruction: "Book 30 minutes with the client tomorrow and send invites",
    state: "awaiting_approval",
    plan: pendingSteps,
    steps: pendingSteps,
    cost: 0.04, tokens: 640,
    startedAt: new Date(Date.now() - 1000 * 60 * 14),
    undoAvailable: false, modelRoute: "small-fast",
  });
  pendingTask.runId = String(pendingRun._id);
  await pendingTask.save();
  const pendingStepsWithIds = (pendingRun.steps as unknown as Array<{ _id: unknown; title: string }>);
  const gate = await Approval.create({
    runId: String(pendingRun._id),
    stepId: String(pendingStepsWithIds[2]?._id ?? "seed-step"),
    ownerId: String(demo._id),
    workspaceId: String(workspace._id),
    requestedFrom: "Alex Morgan",
    title: "Send invites",
    summary: "External attendees are involved. L1 requires approval before external communication.",
    risk: "external_communication",
    action: "Google Calendar",
    tool: "calendar.send_invites",
    decision: "pending",
    channel: "app",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  pendingRun.approvalId = String(gate._id);
  await pendingRun.save();
  await recordAudit({
    workspaceId: String(workspace._id), actor: "UltraAgent", actorId: String(demo._id),
    action: "run.awaiting_approval", target: "Approval", targetId: String(gate._id),
    result: "pending", detail: "Send invites", runId: String(pendingRun._id),
  });
}
