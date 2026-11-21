import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import Approval from "@/models/Approval";
import ApprovalRequest from "@/models/ApprovalRequest";
import { PageHeader } from "@/components/dashboard/page-header";
import { CommandTrigger } from "@/components/dashboard/command-trigger";
import { ApprovalsClient } from "@/components/dashboard/approvals-client";
import type { ApprovalDTO, ApprovalRequestDTO } from "@/lib/types";

export default async function ApprovalsPage() {
  const session = await auth();
  await connectDB();
  const workspaceId = session?.user?.workspaceId ?? "";
  const [gates, requests] = await Promise.all([
    Approval.find({ workspaceId }).sort({ createdAt: -1 }).limit(80).lean(),
    ApprovalRequest.find({ workspaceId }).sort({ createdAt: -1 }).limit(80).lean(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Approvals"
        description="One-tap decisions on high-risk agent steps and incoming requests. Every decision is audited."
      >
        <CommandTrigger>Check approvals</CommandTrigger>
      </PageHeader>
      <ApprovalsClient
        gates={dtoList<ApprovalDTO>(gates)}
        requests={dtoList<ApprovalRequestDTO>(requests)}
        canDecide={["owner", "admin", "manager"].includes(session?.user?.role ?? "member")}
      />
    </div>
  );
}
