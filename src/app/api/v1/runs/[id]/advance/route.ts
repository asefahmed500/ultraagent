import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { advanceRun } from "@/lib/agent/engine";

/** Advance a run one step phase. Used by the live run player and API clients. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const run = await advanceRun(id, {
      actorId: session.user.id,
      actorName: session.user.name ?? "User",
    });
    return NextResponse.json({ run });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not advance" },
      { status: 400 }
    );
  }
}
