import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { recordAudit } from "@/lib/audit";
import Connector from "@/models/Connector";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { provider } = await params;
  await connectDB();
  await Connector.updateOne(
    { workspaceId: session.user.workspaceId, provider },
    {
      $set: {
        status: "connected",
        health: "healthy",
        tokenRef: `vault://connector/${provider}/${Date.now()}`,
        lastSync: new Date(),
      },
    }
  );
  await recordAudit({
    workspaceId: session.user.workspaceId,
    actor: session.user.name ?? "User",
    actorId: session.user.id,
    action: "connector.authorized",
    target: "Connector",
    targetId: provider,
    result: "connected",
  });
  return NextResponse.json({ provider, status: "connected" });
}
