import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList, toPolicy } from "@/lib/serialize";
import { policySchema } from "@/lib/validations";
import { canManagePolicies } from "@/lib/rbac";
import Policy from "@/models/Policy";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const policies = await Policy.find({ workspaceId: session.user.workspaceId }).lean();
  return NextResponse.json({ policies: dtoList(policies) });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManagePolicies(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const data = policySchema.parse(await request.json());
    await connectDB();
    const policy = await Policy.create({
      ...data,
      workspaceId: session.user.workspaceId,
      createdBy: session.user.id,
      version: 1,
      effectiveAt: new Date(),
    });
    return NextResponse.json({ policy: toPolicy(policy) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
