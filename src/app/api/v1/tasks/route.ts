import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { createRunFromInstruction } from "@/lib/agent/engine";
import { commandSchema } from "@/lib/validations";
import Task from "@/models/Task";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const tasks = await Task.find({
    workspaceId: session.user.workspaceId,
    ownerId: session.user.id,
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const input = commandSchema.parse(body);
    const result = await createRunFromInstruction({
      workspaceId: session.user.workspaceId,
      ownerId: session.user.id,
      instruction: input.instruction,
      dryRun: input.dryRun,
      source: "api",
      actorName: session.user.name ?? "API user",
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
