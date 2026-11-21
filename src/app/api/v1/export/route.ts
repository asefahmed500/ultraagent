import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import Run from "@/models/Run";
import Task from "@/models/Task";
import MemoryItem from "@/models/MemoryItem";
import Approval from "@/models/Approval";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const workspaceId = session.user.workspaceId;
  const [tasks, runs, memory, approvals] = await Promise.all([
    Task.find({ workspaceId, ownerId: session.user.id }).lean(),
    Run.find({ workspaceId, ownerId: session.user.id }).lean(),
    MemoryItem.find({ workspaceId, userId: session.user.id }).lean(),
    Approval.find({ workspaceId, ownerId: session.user.id }).lean(),
  ]);

  return new NextResponse(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        user: { id: session.user.id, email: session.user.email },
        tasks: dtoList(tasks),
        runs: dtoList(runs),
        memory: dtoList(memory),
        approvals: dtoList(approvals),
      },
      null,
      2
    ),
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "attachment; filename=ultraagent-export.json",
      },
    }
  );
}
