import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import Step from "@/models/Step";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const steps = await Step.find({
    runId: id,
    workspaceId: session.user.workspaceId,
  })
    .sort({ order: 1 })
    .lean();
  return NextResponse.json({ steps: dtoList(steps) });
}
