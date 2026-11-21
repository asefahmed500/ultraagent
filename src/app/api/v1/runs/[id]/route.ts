import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { toRun } from "@/lib/serialize";
import Run from "@/models/Run";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const run = await Run.findOne({
    _id: id,
    workspaceId: session.user.workspaceId,
    ownerId: session.user.id,
  }).lean();
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ run: toRun(run) });
}
