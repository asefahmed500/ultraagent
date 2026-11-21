import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Run from "@/models/Run";
import Approval from "@/models/Approval";
import Task from "@/models/Task";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const workspaceId = session.user.workspaceId;
  const [runs, approvals, tasks] = await Promise.all([
    Run.find({ workspaceId }).lean(),
    Approval.find({ workspaceId }).lean(),
    Task.find({ workspaceId }).lean(),
  ]);

  const completed = runs.filter((r) => r.state === "completed").length;
  const failed = runs.filter((r) => ["failed", "escalated"].includes(String(r.state))).length;
  const corrected = runs.filter((r) => {
    const approval = approvals.find((a) => String(a.runId) === String(r._id));
    return approval?.editedInstruction || approval?.decision === "edited";
  }).length;
  const decided = approvals.filter((a) => a.decision !== "pending");
  const approvedUnchanged = decided.filter((a) => a.decision === "approved").length;
  const latencies = runs
    .filter((r) => typeof r.latencyMs === "number" && r.latencyMs > 0)
    .map((r) => r.latencyMs as number)
    .sort((a, b) => a - b);

  return NextResponse.json({
    totalRuns: runs.length,
    completed,
    failed,
    successRate: runs.length ? Math.round((completed / runs.length) * 100) : 0,
    correctionRate: completed ? Math.round((corrected / completed) * 100) : 0,
    approvalAcceptance: decided.length
      ? Math.round((approvedUnchanged / decided.length) * 100)
      : 0,
    pendingApprovals: approvals.filter((a) => a.decision === "pending").length,
    p50LatencyMs: latencies.length ? latencies[Math.floor(latencies.length / 2)] : 0,
    costPerRun: runs.length
      ? Number(
          (
            runs.reduce((sum, r) => sum + Number(r.cost ?? 0), 0) / runs.length
          ).toFixed(3)
        )
      : 0,
    weeklyActiveTasks: tasks.length,
    trustIncidents: 0,
  });
}
