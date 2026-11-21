import { createHash } from "crypto";
import { connectDB } from "@/lib/mongodb";
import AuditEvent from "@/models/AuditEvent";

interface AuditInput {
  workspaceId: string;
  actor: string;
  actorId: string;
  action: string;
  target: string;
  targetId?: string;
  result: string;
  detail?: string;
  runId?: string;
  timestamp?: Date;
}

export function hashEvent(input: {
  previousHash: string;
  actor: string;
  action: string;
  target: string;
  result: string;
  detail: string;
  timestamp: string;
}): string {
  return createHash("sha256")
    .update(
      [
        input.previousHash,
        input.actor,
        input.action,
        input.target,
        input.result,
        input.detail,
        input.timestamp,
      ].join("|")
    )
    .digest("hex");
}

/**
 * Append an event to the immutable, hash-chained audit log.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  await connectDB();
  const previous = await AuditEvent.findOne({
    workspaceId: input.workspaceId,
  })
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  const previousHash = (previous?.hash as string) ?? "genesis";
  const timestamp = input.timestamp ?? new Date();
  const detail = input.detail ?? "";
  const hash = hashEvent({
    previousHash,
    actor: input.actor,
    action: input.action,
    target: input.target,
    result: input.result,
    detail,
    timestamp: timestamp.toISOString(),
  });

  await AuditEvent.create({
    workspaceId: input.workspaceId,
    actor: input.actor,
    actorId: input.actorId,
    action: input.action,
    target: input.target,
    targetId: input.targetId ?? "",
    result: input.result,
    detail,
    hash,
    previousHash,
    runId: input.runId,
    timestamp,
  });
}

/**
 * Walk the chain and verify every link. Returns the first broken index or -1.
 */
export async function verifyAuditChain(workspaceId: string): Promise<number> {
  await connectDB();
  const events = await AuditEvent.find({ workspaceId })
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  let previousHash = "genesis";
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const expected = hashEvent({
      previousHash,
      actor: String(event.actor),
      action: String(event.action),
      target: String(event.target),
      result: String(event.result),
      detail: String(event.detail ?? ""),
      timestamp: new Date(event.timestamp as Date).toISOString(),
    });
    if (event.hash !== expected) return i;
    previousHash = String(event.hash);
  }
  return -1;
}
