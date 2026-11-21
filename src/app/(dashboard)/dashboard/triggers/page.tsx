import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import Trigger from "@/models/Trigger";
import { PageHeader } from "@/components/dashboard/page-header";
import { TriggersClient } from "@/components/dashboard/triggers-client";
import type { TriggerDTO } from "@/lib/types";

export default async function TriggersPage() {
  const session = await auth();
  await connectDB();
  const triggers = dtoList<TriggerDTO>(
    await Trigger.find({ workspaceId: session?.user?.workspaceId }).sort({ createdAt: -1 }).lean()
  );
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Triggers & schedules"
        description="When X happens, do Y. Every trigger has an owner, dry-run mode and kill switch."
      />
      <TriggersClient triggers={triggers} />
    </div>
  );
}
