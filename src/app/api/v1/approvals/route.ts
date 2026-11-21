import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import Approval from "@/models/Approval";
import type { ApprovalDTO } from "@/lib/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const approvals = await Approval.find({ workspaceId: session.user.workspaceId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return NextResponse.json({ approvals: dtoList<ApprovalDTO>(approvals) });
}
