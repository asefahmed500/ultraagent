import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import Run from "@/models/Run";
import { PageHeader } from "@/components/dashboard/page-header";
import { OrchestrationClient } from "@/components/dashboard/orchestration-client";
import type { RunDTO } from "@/lib/types";

export default async function OrchestrationPage() {
  const session = await auth();
  await connectDB();
  const runs = dtoList<RunDTO>(
    await Run.find({
      workspaceId: session?.user?.workspaceId,
      ownerId: session?.user?.id,
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean()
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Orchestration"
        description="One orchestrator owns every run. Planner, policy engine, skill agents and the tool gateway hand off through a single audit trail."
      />
      <OrchestrationClient runs={runs} />
    </div>
  );
}
