import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { toRun } from "@/lib/serialize";
import Run from "@/models/Run";
import { Button } from "@/components/ui/button";
import { RunPlayer } from "@/components/dashboard/run-player";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  await connectDB();
  const run = await Run.findOne({
    _id: id,
    workspaceId: session?.user?.workspaceId,
    ownerId: session?.user?.id,
  }).lean();
  if (!run) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link href="/dashboard/tasks"><ArrowLeft data-icon="inline-start" /> Back to tasks</Link>
      </Button>
      <RunPlayer initialRun={toRun(run)} />
    </div>
  );
}
