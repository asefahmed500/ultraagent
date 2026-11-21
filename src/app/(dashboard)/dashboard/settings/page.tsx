import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import User from "@/models/User";
import MemoryItem from "@/models/MemoryItem";
import Notification from "@/models/Notification";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsClient } from "@/components/dashboard/settings-client";
import type { MemoryItemDTO, NotificationDTO, UserDTO } from "@/lib/types";

export default async function SettingsPage() {
  const session = await auth();
  await connectDB();
  const [user, memory, notifications] = await Promise.all([
    User.findById(session?.user?.id).lean(),
    MemoryItem.find({ workspaceId: session?.user?.workspaceId, userId: session?.user?.id })
      .sort({ pinned: -1, createdAt: -1 }).lean(),
    Notification.find({ userId: session?.user?.id }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Settings"
        description="Your profile, preferences, autonomy level, memory and notifications. You can view, edit and delete memory at any time."
      />
      <SettingsClient
        user={dtoList<UserDTO>([user])[0]}
        memory={dtoList<MemoryItemDTO>(memory)}
        notifications={dtoList<NotificationDTO>(notifications)}
      />
    </div>
  );
}
