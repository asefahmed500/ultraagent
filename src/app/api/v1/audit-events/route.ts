import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { verifyAuditChain } from "@/lib/audit";
import { dtoList } from "@/lib/serialize";
import AuditEvent from "@/models/AuditEvent";
import { canViewAudit } from "@/lib/rbac";
import type { AuditEventDTO } from "@/lib/types";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canViewAudit(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const actor = url.searchParams.get("actor");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const format = url.searchParams.get("format");

  await connectDB();
  const query: Record<string, unknown> = { workspaceId: session.user.workspaceId };
  if (action) query.action = action;
  if (actor) query.actor = actor;
  if (from || to) {
    query.timestamp = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  }
  const events = dtoList<AuditEventDTO>(
    await AuditEvent.find(query).sort({ timestamp: -1 }).limit(1000).lean()
  );

  if (format === "csv") {
    const header = "timestamp,actor,action,target,result,detail,hash\n";
    const lines = events
      .map((e) =>
        [
          e.timestamp,
          e.actor,
          e.action,
          e.target,
          e.result,
          String(e.detail).replace(/"/g, '""'),
          e.hash,
        ]
          .map((v) => `"${v ?? ""}"`)
          .join(",")
      )
      .join("\n");
    return new NextResponse(header + lines, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=ultraagent-audit.csv",
      },
    });
  }

  const chainValid = (await verifyAuditChain(session.user.workspaceId)) === -1;
  return NextResponse.json({ events, chainValid });
}
