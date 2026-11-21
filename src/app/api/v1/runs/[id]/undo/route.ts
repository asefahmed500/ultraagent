import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { undoRun } from "@/lib/agent/engine";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const run = await undoRun(id, {
      actorId: session.user.id,
      actorName: session.user.name ?? "User",
    });
    return NextResponse.json({ run });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not undo" },
      { status: 400 }
    );
  }
}
