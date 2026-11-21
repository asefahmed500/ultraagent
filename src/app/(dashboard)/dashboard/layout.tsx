import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { ensureSeedData } from "@/lib/seed";
import { dtoList } from "@/lib/serialize";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import Approval from "@/models/Approval";
import Notification from "@/models/Notification";
import SavedCommand from "@/models/SavedCommand";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await ensureSeedData(session.user.id, session.user.workspaceId);
  await connectDB();

  const [user, workspace, pendingApprovals, unreadNotifications, savedCommands] =
    await Promise.all([
      User.findById(session.user.id).lean(),
      Workspace.findById(session.user.workspaceId).lean(),
      Approval.countDocuments({
        workspaceId: session.user.workspaceId,
        decision: "pending",
      }),
      Notification.countDocuments({
        userId: session.user.id,
        read: false,
      }),
      SavedCommand.find({
        workspaceId: session.user.workspaceId,
        ownerId: session.user.id,
      })
        .sort({ useCount: -1 })
        .limit(6)
        .lean(),
    ]);

  return (
    <DashboardShell
      user={{
        name: user?.name ?? session.user.name ?? "User",
        email: user?.email ?? session.user.email ?? "",
        role: (user?.role as never) ?? session.user.role,
        autonomyLevel: (user?.autonomyLevel as string) ?? session.user.autonomyLevel,
      }}
      workspace={{
        name: workspace?.name ?? "Workspace",
        plan: workspace?.plan ?? "Starter",
        region: workspace?.region ?? "us-east",
      }}
      pendingApprovals={pendingApprovals}
      unreadNotifications={unreadNotifications}
      savedCommands={dtoList(savedCommands)}
    >
      {children}
    </DashboardShell>
  );
}
