import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { decideApproval } from "@/lib/agent/engine";
import { approvalDecisionSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await request.json();
    const input = approvalDecisionSchema.parse(body);
    const result = await decideApproval({
      approvalId: id,
      ...input,
      actorId: session.user.id,
      actorName: session.user.name ?? "User",
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
