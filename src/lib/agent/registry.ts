import type { AutonomyLevel, RiskClass, SkillId } from "@/lib/constants";
import type { ToolDefinition } from "@/lib/types";

export interface PlanTemplateStep {
  title: string;
  detail: string;
  tool: string;
  app: string;
  risk: RiskClass;
  scopes: string[];
  inverse: string;
}

export interface SkillDefinition {
  id: SkillId;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  keywords: string[];
  example: string;
  autonomyFloor: AutonomyLevel;
  modelRoute: "small-fast" | "strong-planner" | "long-context";
  steps: PlanTemplateStep[];
}

export const TOOLS: ToolDefinition[] = [
  {
    name: "mail.read",
    version: "1.4",
    risk: "read",
    scopes: ["mail.read"],
    inputs: ["query", "limit"],
    outputs: ["messages[]"],
    inverse: "",
    limit: "60 calls / minute",
    description: "Read messages within the user's access.",
  },
  {
    name: "mail.classify",
    version: "1.2",
    risk: "read",
    scopes: ["mail.read"],
    inputs: ["message_id", "categories"],
    outputs: ["category"],
    inverse: "",
    limit: "60 calls / minute",
    description: "Classify a message into Finance, Calendar, HR, Legal or Newsletter.",
  },
  {
    name: "mail.label",
    version: "1.1",
    risk: "reversible_write",
    scopes: ["mail.labels.write"],
    inputs: ["message_id", "label"],
    outputs: ["label"],
    inverse: "mail.unlabel(message_id, label)",
    limit: "30 calls / minute",
    description: "Apply a label to a message.",
  },
  {
    name: "mail.archive",
    version: "1.0",
    risk: "reversible_write",
    scopes: ["mail.labels.write"],
    inputs: ["message_id"],
    outputs: ["archived"],
    inverse: "mail.unarchive(message_id)",
    limit: "30 calls / minute",
    description: "Archive a message. Never deletes.",
  },
  {
    name: "mail.draft_reply",
    version: "2.0",
    risk: "reversible_write",
    scopes: ["mail.drafts.write"],
    inputs: ["thread_id", "tone", "body"],
    outputs: ["draft_id"],
    inverse: "mail.delete_draft(draft_id)",
    limit: "30 calls / minute",
    description: "Draft a reply in the user's voice.",
  },
  {
    name: "mail.send",
    version: "2.1",
    risk: "external_communication",
    scopes: ["mail.send"],
    inputs: ["draft_id"],
    outputs: ["message_id"],
    inverse: "",
    limit: "10 calls / minute",
    description: "Send a drafted message. Irreversible once sent.",
  },
  {
    name: "calendar.read_free_busy",
    version: "1.3",
    risk: "read",
    scopes: ["calendar.read"],
    inputs: ["attendees", "window"],
    outputs: ["slots[]"],
    inverse: "",
    limit: "60 calls / minute",
    description: "Read free/busy for the user and internal attendees.",
  },
  {
    name: "calendar.create_event",
    version: "1.2",
    risk: "reversible_write",
    scopes: ["calendar.events.write"],
    inputs: ["title", "start", "end", "attendees[]", "description", "video_link?"],
    outputs: ["event_id", "url"],
    inverse: "calendar.cancel_event(event_id)",
    limit: "30 calls / minute",
    description: "Create an event with agenda and video link.",
  },
  {
    name: "calendar.send_invites",
    version: "1.0",
    risk: "external_communication",
    scopes: ["calendar.events.write"],
    inputs: ["event_id"],
    outputs: ["invited[]"],
    inverse: "calendar.cancel_event(event_id)",
    limit: "20 calls / minute",
    description: "Send invitations to attendees.",
  },
  {
    name: "docs.search",
    version: "1.1",
    risk: "read",
    scopes: ["docs.read"],
    inputs: ["query"],
    outputs: ["documents[]"],
    inverse: "",
    limit: "60 calls / minute",
    description: "Locate documents by name or link within access.",
  },
  {
    name: "docs.summarize",
    version: "2.2",
    risk: "read",
    scopes: ["docs.read"],
    inputs: ["document_id"],
    outputs: ["summary", "citations[]"],
    inverse: "",
    limit: "30 calls / minute",
    description: "Summarize a document with section citations.",
  },
  {
    name: "docs.share",
    version: "1.0",
    risk: "external_communication",
    scopes: ["docs.share"],
    inputs: ["document_id", "channel"],
    outputs: ["share_url"],
    inverse: "docs.unshare(document_id, channel)",
    limit: "20 calls / minute",
    description: "Share a summary to a channel.",
  },
  {
    name: "reports.collect",
    version: "1.0",
    risk: "read",
    scopes: ["sheets.read", "tracker.read"],
    inputs: ["sources"],
    outputs: ["dataset"],
    inverse: "",
    limit: "30 calls / minute",
    description: "Collect data from named sources.",
  },
  {
    name: "reports.build",
    version: "1.3",
    risk: "read",
    scopes: ["sheets.read"],
    inputs: ["dataset", "chart_type"],
    outputs: ["report"],
    inverse: "",
    limit: "20 calls / minute",
    description: "Compute metrics, chart and narrative.",
  },
  {
    name: "reports.save",
    version: "1.1",
    risk: "reversible_write",
    scopes: ["docs.write"],
    inputs: ["report"],
    outputs: ["version"],
    inverse: "reports.delete_version(version)",
    limit: "20 calls / minute",
    description: "Save a versioned report.",
  },
  {
    name: "reports.send",
    version: "1.0",
    risk: "external_communication",
    scopes: ["docs.share"],
    inputs: ["version", "distribution_list"],
    outputs: ["sent[]"],
    inverse: "",
    limit: "10 calls / minute",
    description: "Send report to a distribution list.",
  },
  {
    name: "meetings.ingest",
    version: "1.0",
    risk: "read",
    scopes: ["meetings.read"],
    inputs: ["recording_or_transcript"],
    outputs: ["transcript"],
    inverse: "",
    limit: "20 calls / minute",
    description: "Ingest a recording or transcript with consent.",
  },
  {
    name: "meetings.extract",
    version: "1.2",
    risk: "read",
    scopes: ["meetings.read"],
    inputs: ["transcript"],
    outputs: ["notes", "decisions", "actions[]"],
    inverse: "",
    limit: "20 calls / minute",
    description: "Extract notes, decisions and action items.",
  },
  {
    name: "tracker.create_task",
    version: "1.1",
    risk: "reversible_write",
    scopes: ["tracker.write"],
    inputs: ["task", "owner", "due"],
    outputs: ["task_id"],
    inverse: "tracker.delete_task(task_id)",
    limit: "30 calls / minute",
    description: "Create a task in the tracker.",
  },
  {
    name: "approvals.check_policy",
    version: "1.1",
    risk: "read",
    scopes: ["policy.read"],
    inputs: ["request"],
    outputs: ["decision"],
    inverse: "",
    limit: "60 calls / minute",
    description: "Check a request against policy limits and budget.",
  },
  {
    name: "approvals.route",
    version: "1.0",
    risk: "reversible_write",
    scopes: ["approvals.write"],
    inputs: ["request", "approver"],
    outputs: ["approval_id"],
    inverse: "approvals.cancel(approval_id)",
    limit: "30 calls / minute",
    description: "Route a request to the correct approver.",
  },
  {
    name: "approvals.decide",
    version: "1.2",
    risk: "irreversible_financial",
    scopes: ["approvals.decide"],
    inputs: ["approval_id", "decision"],
    outputs: ["decision"],
    inverse: "",
    limit: "10 calls / minute",
    description: "Approve or reject within policy limits.",
  },
  {
    name: "memory.save",
    version: "1.0",
    risk: "reversible_write",
    scopes: ["memory.write"],
    inputs: ["layer", "subject", "content"],
    outputs: ["memory_id"],
    inverse: "memory.delete(memory_id)",
    limit: "30 calls / minute",
    description: "Store a preference, fact or outcome.",
  },
  {
    name: "notification.send",
    version: "1.0",
    risk: "reversible_write",
    scopes: ["notifications.write"],
    inputs: ["title", "body"],
    outputs: ["notification_id"],
    inverse: "notification.delete(notification_id)",
    limit: "60 calls / minute",
    description: "Notify the user in-app.",
  },
];

export const TOOL_MAP = new Map(TOOLS.map((tool) => [tool.name, tool]));

export const SKILLS: SkillDefinition[] = [
  {
    id: "inbox-triage",
    name: "Inbox triage & replies",
    description:
      "Read new mail, classify, label, archive low-value mail, draft replies and produce a digest.",
    category: "Email",
    icon: "Inbox",
    version: "1.4",
    keywords: [
      "inbox",
      "email",
      "mail",
      "triage",
      "reply",
      "replies",
      "draft",
      "digest",
    ],
    example: "Sort my inbox and reply to Dana",
    autonomyFloor: "L0",
    modelRoute: "small-fast",
    steps: [
      {
        title: "Read new mail",
        detail: "Read unread messages within your access.",
        tool: "mail.read",
        app: "Gmail",
        risk: "read",
        scopes: ["mail.read"],
        inverse: "",
      },
      {
        title: "Classify messages",
        detail: "Sort into Finance, Calendar, HR, Legal and Newsletter.",
        tool: "mail.classify",
        app: "UltraAgent",
        risk: "read",
        scopes: ["mail.read"],
        inverse: "",
      },
      {
        title: "Apply labels",
        detail: "Label each message with its category.",
        tool: "mail.label",
        app: "Gmail",
        risk: "reversible_write",
        scopes: ["mail.labels.write"],
        inverse: "mail.unlabel",
      },
      {
        title: "Archive low-value mail",
        detail: "Archive newsletters. Never delete.",
        tool: "mail.archive",
        app: "Gmail",
        risk: "reversible_write",
        scopes: ["mail.labels.write"],
        inverse: "mail.unarchive",
      },
      {
        title: "Draft replies in your voice",
        detail: "Queue drafts for your review using your style profile.",
        tool: "mail.draft_reply",
        app: "Gmail",
        risk: "reversible_write",
        scopes: ["mail.drafts.write"],
        inverse: "mail.delete_draft",
      },
    ],
  },
  {
    id: "calendar-scheduling",
    name: "Calendar scheduling",
    description:
      "Parse attendees and windows, read free/busy, propose or book a slot and send invites.",
    category: "Calendar",
    icon: "CalendarDays",
    version: "1.3",
    keywords: [
      "schedule",
      "calendar",
      "meeting",
      "book",
      "event",
      "slot",
      "invite",
      "afternoon",
      "morning",
      "tuesday",
      "monday",
      "wednesday",
      "thursday",
      "friday",
    ],
    example: "Book 30 minutes with Dana next Tuesday afternoon",
    autonomyFloor: "L0",
    modelRoute: "small-fast",
    steps: [
      {
        title: "Read free / busy",
        detail: "Check availability for you and internal attendees.",
        tool: "calendar.read_free_busy",
        app: "Google Calendar",
        risk: "read",
        scopes: ["calendar.read"],
        inverse: "",
      },
      {
        title: "Propose ranked slots",
        detail: "Respect working hours, focus blocks and time zones.",
        tool: "calendar.read_free_busy",
        app: "UltraAgent",
        risk: "read",
        scopes: ["calendar.read"],
        inverse: "",
      },
      {
        title: "Create the event",
        detail: "Create with agenda, video link and attendees.",
        tool: "calendar.create_event",
        app: "Google Calendar",
        risk: "reversible_write",
        scopes: ["calendar.events.write"],
        inverse: "calendar.cancel_event",
      },
      {
        title: "Send invites",
        detail: "Notify attendees and flag conflicts.",
        tool: "calendar.send_invites",
        app: "Google Calendar",
        risk: "external_communication",
        scopes: ["calendar.events.write"],
        inverse: "calendar.cancel_event",
      },
    ],
  },
  {
    id: "document-summary",
    name: "Document summary",
    description:
      "Locate a document, read it within access, summarize with key points, risks and citations.",
    category: "Documents",
    icon: "FileText",
    version: "2.0",
    keywords: [
      "document",
      "summarize",
      "summary",
      "contract",
      "file",
      "read",
      "cite",
      "pdf",
    ],
    example: "Summarize the vendor contract and cite the risk sections",
    autonomyFloor: "L0",
    modelRoute: "long-context",
    steps: [
      {
        title: "Locate the document",
        detail: "Find by name or link within your access.",
        tool: "docs.search",
        app: "Drive",
        risk: "read",
        scopes: ["docs.read"],
        inverse: "",
      },
      {
        title: "Read within access",
        detail: "Apply permission-aware retrieval.",
        tool: "docs.search",
        app: "Drive",
        risk: "read",
        scopes: ["docs.read"],
        inverse: "",
      },
      {
        title: "Summarize with citations",
        detail: "Key points, risks, open questions and source sections.",
        tool: "docs.summarize",
        app: "UltraAgent",
        risk: "read",
        scopes: ["docs.read"],
        inverse: "",
      },
      {
        title: "Share the summary",
        detail: "Optionally share to a channel.",
        tool: "docs.share",
        app: "Slack",
        risk: "external_communication",
        scopes: ["docs.share"],
        inverse: "docs.unshare",
      },
    ],
  },
  {
    id: "weekly-report",
    name: "Weekly report",
    description:
      "Collect data from named sources, compute metrics, build a chart and save a versioned report.",
    category: "Reporting",
    icon: "ChartNoAxesCombined",
    version: "1.2",
    keywords: [
      "report",
      "weekly",
      "metrics",
      "spreadsheet",
      "sheet",
      "chart",
      "kpi",
    ],
    example: "Build the weekly report from the tracker and send it to the team",
    autonomyFloor: "L0",
    modelRoute: "strong-planner",
    steps: [
      {
        title: "Collect source data",
        detail: "Read sheets, tracker and CRM; flag stale inputs.",
        tool: "reports.collect",
        app: "Sheets",
        risk: "read",
        scopes: ["sheets.read", "tracker.read"],
        inverse: "",
      },
      {
        title: "Compute metrics and chart",
        detail: "Build the narrative with calculation notes.",
        tool: "reports.build",
        app: "UltraAgent",
        risk: "read",
        scopes: ["sheets.read"],
        inverse: "",
      },
      {
        title: "Save versioned report",
        detail: "Save to a doc with a version number.",
        tool: "reports.save",
        app: "Docs",
        risk: "reversible_write",
        scopes: ["docs.write"],
        inverse: "reports.delete_version",
      },
      {
        title: "Send to distribution list",
        detail: "Requires approval before delivery.",
        tool: "reports.send",
        app: "Email",
        risk: "external_communication",
        scopes: ["docs.share"],
        inverse: "",
      },
    ],
  },
  {
    id: "meeting-notes",
    name: "Meeting notes & actions",
    description:
      "Ingest a transcript with consent, extract decisions and actions, create tracker tasks and send a recap.",
    category: "Meetings",
    icon: "NotebookPen",
    version: "1.1",
    keywords: [
      "meeting notes",
      "transcript",
      "recap",
      "action items",
      "decisions",
    ],
    example: "Turn the standup transcript into notes and action items",
    autonomyFloor: "L0",
    modelRoute: "long-context",
    steps: [
      {
        title: "Confirm recording consent",
        detail: "Check the consent banner before ingest.",
        tool: "meetings.ingest",
        app: "Meet",
        risk: "read",
        scopes: ["meetings.read"],
        inverse: "",
      },
      {
        title: "Extract notes and actions",
        detail: "Decisions, owners and dates; flag low confidence.",
        tool: "meetings.extract",
        app: "UltraAgent",
        risk: "read",
        scopes: ["meetings.read"],
        inverse: "",
      },
      {
        title: "Create tracker tasks",
        detail: "Create one task per confirmed action item.",
        tool: "tracker.create_task",
        app: "Linear",
        risk: "reversible_write",
        scopes: ["tracker.write"],
        inverse: "tracker.delete_task",
      },
      {
        title: "Send recap",
        detail: "Send the recap to participants.",
        tool: "notification.send",
        app: "Email",
        risk: "external_communication",
        scopes: ["notifications.write"],
        inverse: "notification.delete",
      },
    ],
  },
  {
    id: "approvals",
    name: "Approvals & expenses",
    description:
      "Check requests against policy, auto-approve within limits, route exceptions and keep a full audit.",
    category: "Approvals",
    icon: "ShieldCheck",
    version: "1.2",
    keywords: [
      "approval",
      "approve",
      "expense",
      "request",
      "invoice",
      "budget",
      "reimbursement",
    ],
    example: "Check the vendor invoice and route it for approval",
    autonomyFloor: "L0",
    modelRoute: "small-fast",
    steps: [
      {
        title: "Check policy limits",
        detail: "Amount, category and budget; enforce separation of duties.",
        tool: "approvals.check_policy",
        app: "UltraAgent",
        risk: "read",
        scopes: ["policy.read"],
        inverse: "",
      },
      {
        title: "Route to approver",
        detail: "Send a one-line summary to the correct manager.",
        tool: "approvals.route",
        app: "Email",
        risk: "reversible_write",
        scopes: ["approvals.write"],
        inverse: "approvals.cancel",
      },
      {
        title: "Record decision",
        detail: "Apply the human decision with full audit.",
        tool: "approvals.decide",
        app: "UltraAgent",
        risk: "irreversible_financial",
        scopes: ["approvals.decide"],
        inverse: "",
      },
    ],
  },
  {
    id: "general",
    name: "General assistant",
    description: "Plan and carry out a multi-step office task with visible progress.",
    category: "General",
    icon: "Sparkles",
    version: "1.0",
    keywords: [],
    example: "Prepare a briefing for tomorrow's client call",
    autonomyFloor: "L0",
    modelRoute: "strong-planner",
    steps: [
      {
        title: "Understand the request",
        detail: "Parse intent, people, files and dates using memory.",
        tool: "memory.save",
        app: "UltraAgent",
        risk: "read",
        scopes: [],
        inverse: "",
      },
      {
        title: "Plan the work",
        detail: "Produce an ordered plan with tools and expected outputs.",
        tool: "notification.send",
        app: "UltraAgent",
        risk: "read",
        scopes: [],
        inverse: "",
      },
      {
        title: "Verify and report",
        detail: "Confirm the outcome and write the result card.",
        tool: "notification.send",
        app: "UltraAgent",
        risk: "reversible_write",
        scopes: ["notifications.write"],
        inverse: "notification.delete",
      },
    ],
  },
];

export const SKILL_MAP = new Map(SKILLS.map((skill) => [skill.id, skill]));

export function detectSkill(instruction: string): SkillId {
  const text = instruction.toLowerCase();
  let best: { id: SkillId; score: number } = { id: "general", score: 0 };
  for (const skill of SKILLS) {
    const score = skill.keywords.reduce(
      (sum, keyword) => sum + (text.includes(keyword) ? keyword.length : 0),
      0
    );
    if (score > best.score) best = { id: skill.id, score };
  }
  return best.score >= 4 ? best.id : "general";
}

export function isAmbiguous(instruction: string, skill: SkillId): boolean {
  const text = instruction.trim().toLowerCase();
  if (skill !== "general") return false;
  return (
    text.length < 16 ||
    /^(help|what|how|hey|hi|hello|can you|please)\b/.test(text) ||
    text.endsWith("?")
  );
}

/**
 * Build the plan for a skill, dropping optional actions the user did not ask
 * for (sharing, sending, tracker writes). This keeps the plan first principle:
 * only proposed work that matches the instruction.
 */
export function planFor(skillId: SkillId, instruction = ""): PlanTemplateStep[] {
  const skill = SKILL_MAP.get(skillId) ?? SKILL_MAP.get("general")!;
  const text = instruction.toLowerCase();
  const filtered = skill.steps.filter((step) => {
    if (step.tool === "docs.share") return /share|post|send/.test(text);
    if (step.tool === "reports.send") return /send|email|distribute|share/.test(text);
    if (step.tool === "calendar.send_invites") return /invite|send|notify/.test(text);
    if (step.tool === "tracker.create_task") return /task|action item|create/.test(text);
    return true;
  });
  return filtered.length ? filtered : skill.steps.slice(0, 1);
}
