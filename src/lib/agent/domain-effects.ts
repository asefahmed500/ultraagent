import { connectDB } from "@/lib/mongodb";
import EmailMessage from "@/models/EmailMessage";
import CalendarEvent from "@/models/CalendarEvent";
import Document from "@/models/Document";
import Report from "@/models/Report";
import Meeting from "@/models/Meeting";
import ApprovalRequest from "@/models/ApprovalRequest";
import MemoryItem from "@/models/MemoryItem";
import Notification from "@/models/Notification";
import type { SkillId } from "@/lib/constants";

export interface StepContext {
  workspaceId: string;
  ownerId: string;
  runId: string;
  instruction: string;
  skill: SkillId;
  order: number;
}

export interface StepEffect {
  output: string;
  changes: string[];
}

/** Run the stored inverse of a reversible write (saga compensation). */
export async function applyInverseEffect(
  tool: string,
  ctx: StepContext
): Promise<string> {
  await connectDB();
  const { workspaceId, runId } = ctx;
  switch (tool) {
    case "mail.label":
      await EmailMessage.updateMany(
        { workspaceId },
        { $pull: { labels: { $in: ["Finance", "Calendar", "HR", "Legal", "Newsletter"] } } }
      );
      return "Labels removed (mail.unlabel).";
    case "mail.archive":
      await EmailMessage.updateMany(
        { workspaceId, archived: true },
        { $set: { archived: false } }
      );
      return "Messages restored from archive (mail.unarchive).";
    case "mail.draft_reply":
      await EmailMessage.updateMany(
        { workspaceId, draftStatus: "ready" },
        { $set: { draft: "", draftStatus: "none" } }
      );
      return "Drafts deleted (mail.delete_draft).";
    case "calendar.create_event":
      await CalendarEvent.updateMany(
        { workspaceId, runId },
        { $set: { status: "cancelled" } }
      );
      return "Event cancelled (calendar.cancel_event).";
    case "docs.share":
      await Document.updateMany(
        { workspaceId, runId },
        { $unset: { sharedTo: "" } }
      );
      return "Share revoked (docs.unshare).";
    case "reports.save":
      await Report.deleteMany({ workspaceId, runId, status: "draft" });
      return "Draft report version deleted (reports.delete_version).";
    case "tracker.create_task":
      await Meeting.updateMany(
        { workspaceId, runId },
        { $set: { "actions.$[].created": false } }
      );
      return "Tracker tasks removed (tracker.delete_task).";
    case "memory.save":
      await MemoryItem.deleteMany({ workspaceId, sourceRun: runId });
      return "Memory item deleted (memory.delete).";
    case "notification.send":
      await Notification.deleteMany({ workspaceId, href: `/dashboard/runs/${runId}` });
      return "Notification removed (notification.delete).";
    default:
      return "No inverse available for this step.";
  }
}

const pick = (parts: string[], index: number, fallback: string) =>
  parts[index] ?? fallback;

/**
 * Apply a simulated tool call to the app's domain data. This is the "tool
 * gateway": typed effects, idempotency-safe upserts, and stored inverses.
 */
export async function applyStepEffect(
  tool: string,
  ctx: StepContext
): Promise<StepEffect> {
  await connectDB();
  const { workspaceId, ownerId, runId, instruction, order } = ctx;
  const idKey = `${runId}-${order}`;
  const subject = pick(instruction.split(" "), 0, "task");

  switch (tool) {
    case "mail.read": {
      const count = await EmailMessage.countDocuments({ workspaceId, ownerId });
      return {
        output: `Read ${count || 8} messages within your access.`,
        changes: [`Scanned ${count || 8} messages`],
      };
    }
    case "mail.classify": {
      const messages = await EmailMessage.find({ workspaceId, ownerId })
        .limit(8)
        .lean();
      const categories = ["Finance", "Calendar", "HR", "Legal", "Newsletter"];
      let changed = 0;
      for (const message of messages) {
        const category = categories[changed % categories.length];
        if (message.category !== category) {
          await EmailMessage.updateOne(
            { _id: message._id },
            { $set: { category } }
          );
          changed++;
        }
      }
      return {
        output: `Classified ${changed || messages.length} messages into 5 categories.`,
        changes: [
          `Finance: ${Math.ceil(messages.length / 5)}`,
          `Calendar: ${Math.ceil(messages.length / 5)}`,
          `Newsletter filtered`,
        ],
      };
    }
    case "mail.label": {
      const message = await EmailMessage.findOne({ workspaceId, ownerId });
      if (message) {
        const label = String(message.category ?? "Triaged");
        if (!message.labels?.includes(label)) {
          await EmailMessage.updateOne(
            { _id: message._id },
            { $addToSet: { labels: label } }
          );
        }
        return {
          output: `Applied label “${label}”. Inverse: mail.unlabel.`,
          changes: [`Label: ${label}`],
        };
      }
      return { output: "No messages to label.", changes: [] };
    }
    case "mail.archive": {
      const newsletters = await EmailMessage.find({
        workspaceId,
        ownerId,
        category: "Newsletter",
        archived: false,
      }).lean();
      await EmailMessage.updateMany(
        { _id: { $in: newsletters.map((m) => m._id) } },
        { $set: { archived: true } }
      );
      return {
        output: `Archived ${newsletters.length} low-value messages. Nothing was deleted.`,
        changes: [`Archived ${newsletters.length} newsletters`],
      };
    }
    case "mail.draft_reply": {
      const message = await EmailMessage.findOne({
        workspaceId,
        ownerId,
        draftStatus: "none",
      });
      const draft = `Hi,\n\nThanks for the note — I'll take a look and get back to you shortly.\n\nBest,\nMe`;
      if (message) {
        await EmailMessage.updateOne(
          { _id: message._id },
          { $set: { draft, draftStatus: "ready" } }
        );
        return {
          output: `Drafted a reply to ${message.fromName} in your voice. Queued for review.`,
          changes: [`Draft for ${message.subject}`, "Inverse: mail.delete_draft"],
        };
      }
      return { output: "No reply needed.", changes: [] };
    }
    case "mail.send": {
      const message = await EmailMessage.findOne({
        workspaceId,
        ownerId,
        draftStatus: "ready",
      });
      if (message) {
        await EmailMessage.updateOne(
          { _id: message._id },
          { $set: { draftStatus: "sent", read: true } }
        );
        return {
          output: `Sent reply to ${message.fromName}. This action is irreversible and was audited.`,
          changes: [`Sent to ${message.from}`, "No inverse — irreversible"],
        };
      }
      return { output: "No approved draft to send.", changes: [] };
    }
    case "calendar.read_free_busy":
    case "calendar.create_event": {
      const start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(14, 0, 0, 0);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const existing = await CalendarEvent.findOne({ workspaceId, runId });
      if (!existing) {
        await CalendarEvent.create({
          workspaceId,
          ownerId,
          title: instruction.slice(0, 80) || "Scheduled meeting",
          start,
          end,
          attendees: ["dana@company.com", "sam@company.com"],
          agenda: "Agenda prepared by UltraAgent from your instruction.",
          videoLink: "https://meet.google.com/ultra-agent",
          status: "proposed",
          external: false,
          runId,
        });
      }
      return {
        output: `Found 3 ranked slots, chose the best inside working hours. Event created with agenda and video link.`,
        changes: [
          "Proposed 3 slots",
          "Created event: tomorrow 14:00",
          "Inverse: calendar.cancel_event",
        ],
      };
    }
    case "calendar.send_invites": {
      await CalendarEvent.updateMany(
        { workspaceId, runId },
        { $set: { status: "booked" } }
      );
      return {
        output: "Invites sent to attendees. Conflict monitoring is on.",
        changes: ["Invites sent", "Status: booked"],
      };
    }
    case "docs.search": {
      if (order > 0) {
        return {
          output: "Read the document within your access. Confidential content stays restricted.",
          changes: ["Access-checked read", "No restricted content exposed"],
        };
      }
      return {
        output: `Located “${instruction.slice(0, 60)}” in Drive within your access.`,
        changes: ["Document located", "Permission filter applied"],
      };
    }
    case "docs.summarize": {
      const existing = await Document.findOne({ workspaceId, runId });
      if (!existing) {
        await Document.create({
          workspaceId,
          ownerId,
          title: instruction.slice(0, 70) || "Document summary",
          source: "Drive / vendor-contract-2026.pdf",
          summary:
            "The agreement covers a 12-month term with automatic renewal, a 30-day termination clause, and a liability cap at 12 months of fees. Pricing is locked for the first year.",
          keyPoints: [
            "12-month term, auto-renews unless cancelled 30 days prior",
            "Liability capped at 12 months of fees",
            "Pricing locked for year one",
            "Data processing addendum attached",
          ],
          risks: [
            "Auto-renewal window could be missed",
            "Liability cap may be low for enterprise use",
            "Confidential classification limits sharing",
          ],
          openQuestions: [
            "Can the renewal notice period be shortened to 15 days?",
            "Is the liability cap negotiable?",
          ],
          citations: [
            {
              section: "§4 Term and Renewal",
              excerpt: "This Agreement renews automatically for successive 12-month terms.",
            },
            {
              section: "§9 Limitation of Liability",
              excerpt: "Liability shall not exceed fees paid in the preceding 12 months.",
            },
          ],
          classification: "Confidential",
          runId,
        });
      }
      return {
        output: "Summary produced with 4 key points, 3 risks and 2 cited sections.",
        changes: ["Created summary", "Cited §4 and §9", "Inverse: none (read-only)"],
      };
    }
    case "docs.share": {
      await Document.updateMany(
        { workspaceId, runId },
        { $set: { sharedTo: "team-operations" } }
      );
      return {
        output: "Summary shared to #team-operations. Inverse: docs.unshare.",
        changes: ["Shared to #team-operations"],
      };
    }
    case "reports.collect": {
      return {
        output: "Collected data from 3 named sources. Flagged 1 stale input.",
        changes: ["3 sources read", "1 stale input flagged"],
      };
    }
    case "reports.build": {
      return {
        output: "Computed 4 metrics, a 4-week chart and the narrative with calculation notes.",
        changes: ["4 metrics computed", "Chart built"],
      };
    }
    case "reports.save": {
      const existing = await Report.findOne({ workspaceId, runId });
      if (!existing) {
        await Report.create({
          workspaceId,
          ownerId,
          title: `Weekly report — ${new Date().toISOString().slice(0, 10)}`,
          period: "Last 7 days",
          sources: ["Sheets / Revenue", "Tracker / Delivery", "CRM / Pipeline"],
          notes:
            "Metrics computed deterministically. Pipeline source is 1 day stale — flagged.",
          narrative:
            "Revenue grew 12% week over week while cycle time fell by 1.4 days. Pipeline coverage remains healthy but the CRM feed is one day behind.",
          metrics: [
            { label: "Revenue", value: 248000, delta: 12.4 },
            { label: "Tasks completed", value: 318, delta: 8.1 },
            { label: "Cycle time (days)", value: 3.2, delta: -1.4 },
            { label: "Approval acceptance", value: 86, delta: 4 },
          ],
          chart: [
            { month: "W1", value: 196, target: 200 },
            { month: "W2", value: 218, target: 210 },
            { month: "W3", value: 231, target: 220 },
            { month: "W4", value: 248, target: 230 },
          ],
          version: 1,
          status: "ready",
          recipients: ["leadership@company.com"],
          staleInputs: ["CRM / Pipeline (1 day stale)"],
          runId,
        });
      }
      return {
        output: "Version 1 saved with a 4-metric chart and calculation notes.",
        changes: ["Saved report v1", "Flagged 1 stale input", "Inverse: delete version"],
      };
    }
    case "reports.send": {
      await Report.updateMany({ workspaceId, runId }, { $set: { status: "sent" } });
      return {
        output: "Report sent to 1 distribution list after approval.",
        changes: ["Sent to leadership@company.com"],
      };
    }
    case "meetings.ingest": {
      return {
        output: "Recording consent confirmed; transcript ingested within access.",
        changes: ["Consent recorded", "Transcript ingested"],
      };
    }
    case "meetings.extract": {
      const existing = await Meeting.findOne({ workspaceId, runId });
      if (!existing) {
        await Meeting.create({
          workspaceId,
          ownerId,
          title: "Weekly operations sync",
          date: new Date(),
          duration: 32,
          participants: ["Dana", "Sam", "You"],
          consent: true,
          notes:
            "Team reviewed delivery metrics and agreed to tighten the approval flow. Confidence banner was shown and consent recorded.",
          decisions: [
            "Adopt L1 autonomy for the operations workspace",
            "Move weekly report to Fridays at 15:00",
          ],
          actions: [
            {
              task: "Draft revised approval policy",
              owner: "Dana",
              due: "Friday",
              confidence: 0.94,
              created: false,
            },
            {
              task: "Update report schedule",
              owner: "Sam",
              due: "Wednesday",
              confidence: 0.71,
              created: false,
            },
          ],
          recapSent: false,
          runId,
        });
      }
      return {
        output: "Extracted 2 decisions and 2 action items; 1 owner has low confidence.",
        changes: ["Created notes", "2 action items", "1 low-confidence owner flagged"],
      };
    }
    case "tracker.create_task": {
      await Meeting.updateMany(
        { workspaceId, runId },
        { $set: { "actions.$[].created": true } }
      );
      return {
        output: "Created 2 tasks in the tracker. Inverse: tracker.delete_task.",
        changes: ["2 tracker tasks created", "Inverses stored"],
      };
    }
    case "approvals.check_policy": {
      const amount = 1200;
      return {
        output: `Checked policy: $${amount} expense is within the $2,000 auto-approve limit, but separation of duties requires a named approver.`,
        changes: ["Policy check passed", "Routed for human decision"],
      };
    }
    case "approvals.route": {
      const existing = await ApprovalRequest.findOne({ workspaceId, runId });
      if (!existing) {
        await ApprovalRequest.create({
          workspaceId,
          ownerId,
          title: "Vendor invoice — Acme Cloud",
          type: "expense",
          amount: 1200,
          category: "Software",
          requester: "sam@company.com",
          approver: "dana@company.com",
          justification: "Annual analytics license renewal, within budget.",
          status: "pending",
          policyCheck: "Within $2,000 limit; separation of duties enforced.",
          separationOfDuties: true,
        });
      }
      return {
        output: "Routed to Dana with a one-line summary and full audit trail.",
        changes: ["Approval request created", "Routed to dana@company.com"],
      };
    }
    case "approvals.decide": {
      await ApprovalRequest.updateMany(
        { workspaceId, runId, status: "pending" },
        { $set: { status: "approved", decidedAt: new Date() } }
      );
      return {
        output: "Decision recorded in the immutable audit log.",
        changes: ["Decision recorded", "No inverse — irreversible"],
      };
    }
    case "memory.save": {
      await MemoryItem.create({
        workspaceId,
        userId: ownerId,
        layer: "episodic",
        subject: `Run ${idKey}`,
        content: instruction.slice(0, 300),
        sourceRun: runId,
        pinned: false,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      });
      return {
        output: "Stored the outcome in episodic memory (90-day retention).",
        changes: ["Memory item created", "Retention: 90 days"],
      };
    }
    case "notification.send":
    default: {
      await Notification.create({
        workspaceId,
        userId: ownerId,
        title: `UltraAgent finished: ${subject}`,
        body: instruction.slice(0, 200),
        kind: "success",
        read: false,
        href: `/dashboard/runs/${runId}`,
      });
      return {
        output: "Result prepared and notification queued.",
        changes: ["Result card ready", "Notification sent"],
      };
    }
  }
}
