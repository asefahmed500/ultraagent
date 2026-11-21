import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import EmailMessage from "@/models/EmailMessage";
import { PageHeader } from "@/components/dashboard/page-header";
import { CommandTrigger } from "@/components/dashboard/command-trigger";
import { InboxClient } from "@/components/dashboard/inbox-client";
import type { EmailMessageDTO } from "@/lib/types";

export default async function InboxPage() {
  const session = await auth();
  await connectDB();
  const emails = await EmailMessage.find({
    workspaceId: session?.user?.workspaceId,
    ownerId: session?.user?.id,
  })
    .sort({ receivedAt: -1 })
    .limit(100)
    .lean();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Inbox"
        description="Triaged mail, drafts to review and archived noise. UltraAgent never deletes — only archives."
      >
        <CommandTrigger>Triage inbox</CommandTrigger>
      </PageHeader>
      <InboxClient emails={dtoList<EmailMessageDTO>(emails)} />
    </div>
  );
}
