import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import Policy from "@/models/Policy";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import { PageHeader } from "@/components/dashboard/page-header";
import { AdminClient } from "@/components/dashboard/admin-client";
import type { PolicyDTO, UserDTO, WorkspaceDTO } from "@/lib/types";
import { canManageWorkspace } from "@/lib/rbac";

export default async function AdminPage() {
  const session = await auth();
  await connectDB();
  const workspaceId = session?.user?.workspaceId ?? "";
  const [policies, users, workspace] = await Promise.all([
    Policy.find({ workspaceId }).sort({ version: -1 }).lean(),
    User.find({ workspaceId }).lean(),
    Workspace.findById(workspaceId).lean(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Admin console"
        description="Policies, roles, security, observability and billing. Changes are versioned and effective immediately."
      />
      <AdminClient
        policies={dtoList<PolicyDTO>(policies)}
        users={dtoList<UserDTO>(users)}
        workspace={dtoList<WorkspaceDTO>([workspace])[0]}
        canManage={canManageWorkspace(session?.user?.role ?? "member")}
      />
    </div>
  );
}
