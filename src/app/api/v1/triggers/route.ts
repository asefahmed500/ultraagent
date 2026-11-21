import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList, toTrigger } from "@/lib/serialize";
import { triggerSchema } from "@/lib/validations";
import Trigger from "@/models/Trigger";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const triggers = await Trigger.find({
    workspaceId: session.user.workspaceId,
  }).lean();
  return NextResponse.json({ triggers: dtoList(triggers) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = triggerSchema.parse(await request.json());
    await connectDB();
    const trigger = await Trigger.create({
      ...data,
      workspaceId: session.user.workspaceId,
      ownerId: session.user.id,
      params: {},
    });
    return NextResponse.json({ trigger: toTrigger(trigger) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
