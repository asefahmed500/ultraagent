"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Inbox, Mail, Send, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateEmailAction } from "@/app/actions/workspace";
import { formatRelative } from "@/lib/format";
import type { EmailMessageDTO } from "@/lib/types";

export function InboxClient({ emails }: { emails: EmailMessageDTO[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState<EmailMessageDTO | null>(null);
  const [draft, setDraft] = useState("");

  const filtered = useMemo(() => {
    if (tab === "drafts") return emails.filter((e) => e.draftStatus === "ready");
    if (tab === "archived") return emails.filter((e) => e.archived);
    if (tab === "starred") return emails.filter((e) => e.starred);
    return emails.filter((e) => !e.archived);
  }, [emails, tab]);

  async function patch(email: EmailMessageDTO, changes: Record<string, unknown>, message: string) {
    await updateEmailAction(email.id, changes as never);
    toast.success(message);
    setSelected(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Inbox</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{tab === "all" ? "All messages" : `${tab} messages`}</CardTitle>
            <CardDescription>{filtered.length} messages · classified and labelled by UltraAgent.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-muted-foreground">
                <Inbox className="size-6" /> Nothing here.
              </div>
            ) : (
              filtered.map((email) => (
                <button
                  key={email.id}
                  onClick={() => {
                    setSelected(email);
                    setDraft(email.draft ?? "");
                  }}
                  className="flex items-start gap-3 border-b px-2 py-3.5 text-left transition-colors last:border-0 hover:bg-muted/50"
                >
                  <span className={`mt-1 size-2 shrink-0 rounded-full ${email.read ? "bg-transparent" : "bg-foreground"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{email.fromName}</span>
                      {email.external ? <Badge variant="outline" className="text-[10px]">external</Badge> : null}
                      {email.draftStatus === "ready" ? <Badge variant="secondary" className="text-[10px]">draft ready</Badge> : null}
                      <span className="ml-auto text-xs text-muted-foreground">{formatRelative(email.receivedAt)}</span>
                    </div>
                    <div className="mt-0.5 truncate text-sm">{email.subject}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{email.preview}</div>
                    <div className="mt-2 flex gap-1.5">
                      <Badge variant="secondary" className="text-[10px]">{email.category}</Badge>
                      {email.labels.map((label) => (
                        <Badge key={label} variant="outline" className="text-[10px]">{label}</Badge>
                      ))}
                    </div>
                  </div>
                  <Star
                    className={`mt-1 size-4 ${email.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      void patch(email, { starred: !email.starred }, email.starred ? "Unstarred" : "Starred");
                    }}
                  />
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Reading pane</CardTitle>
            <CardDescription>Select a message to see its full body.</CardDescription>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-sm font-medium">{selected.subject}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    From {selected.from} · {formatRelative(selected.receivedAt)}
                  </div>
                </div>
                <p className="whitespace-pre-line text-sm leading-7">{selected.body}</p>
                {selected.draft ? (
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <div className="mb-2 text-xs font-medium text-muted-foreground">Draft reply — in your voice</div>
                    <p className="whitespace-pre-line text-sm">{selected.draft}</p>
                    <Textarea
                      className="mt-3 min-h-28 bg-background"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      aria-label="Edit draft reply"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="xs"
                        onClick={() => void patch(selected, { draft, draftStatus: "sent" }, "Reply sent")}
                      >
                        <Send data-icon="inline-start" /> Send reply
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => void patch(selected, { draftStatus: "rejected" }, "Draft rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      void patch(
                        selected,
                        { archived: !selected.archived },
                        selected.archived ? "Restored to inbox" : "Archived"
                      )
                    }
                  >
                    {selected.archived ? <ArchiveRestore data-icon="inline-start" /> : <Archive data-icon="inline-start" />}
                    {selected.archived ? "Restore" : "Archive"}
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => void patch(selected, { read: true }, "Marked as read")}
                  >
                    <Mail data-icon="inline-start" /> Mark read
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-muted-foreground">
                <Mail className="size-6" /> Choose a message to read.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(selected && selected.draftStatus === "sent")} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply sent</DialogTitle>
            <DialogDescription>The action was recorded in the audit log. Sent mail is irreversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSelected(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
