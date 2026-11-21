import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { WEBHOOK_EVENTS, type WebhookEvent } from "@/lib/constants";
import WebhookEventModel from "@/models/WebhookEvent";

/**
 * Receives signed webhook events. In local dev a signature is optional;
 * in production set WEBHOOK_SECRET and send `x-ultraagent-signature: sha256=...`.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await request.text();
  const signature = request.headers.get("x-ultraagent-signature") ?? "";
  const secret = process.env.WEBHOOK_SECRET;
  let signatureValid = true;

  if (secret) {
    const expected = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    signatureValid = a.length === b.length && timingSafeEqual(a, b);
    if (!signatureValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = String(payload.event ?? "") as WebhookEvent;
  if (!WEBHOOK_EVENTS.includes(event)) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  await connectDB();
  await WebhookEventModel.create({
    workspaceId: session.user.workspaceId,
    event,
    payload,
    signatureValid,
    delivered: true,
    attempts: 1,
  });

  return NextResponse.json({ received: true, event }, { status: 202 });
}
