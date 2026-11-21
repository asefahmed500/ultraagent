import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import Connector from "@/models/Connector";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const connectors = await Connector.find({
    workspaceId: session.user.workspaceId,
  }).lean();
  return NextResponse.json({ connectors: dtoList(connectors) });
}
