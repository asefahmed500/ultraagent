import { CheckCircle2, Circle, ListChecks, NotebookPen, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import Meeting from "@/models/Meeting";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { CommandTrigger } from "@/components/dashboard/command-trigger";
import { formatDateTime } from "@/lib/format";
import type { MeetingDTO } from "@/lib/types";

export default async function MeetingsPage() {
  const session = await auth();
  await connectDB();
  const meetings = dtoList<MeetingDTO>(
    await Meeting.find({
      workspaceId: session?.user?.workspaceId,
      ownerId: session?.user?.id,
    })
      .sort({ date: -1 })
      .lean()
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Meetings"
        description="Notes, decisions and action items from transcripts — with consent, owners and tracker tasks."
      >
        <CommandTrigger>Create meeting notes</CommandTrigger>
      </PageHeader>

      {meetings.length === 0 ? (
        <Card><CardContent className="py-20 text-center text-sm text-muted-foreground"><NotebookPen className="mx-auto mb-3 size-6" />No meeting notes yet.</CardContent></Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {meetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{meeting.title}</CardTitle>
                  {meeting.consent ? (
                    <Badge variant="secondary" className="gap-1 text-[10px]"><ShieldCheck className="size-3" /> consent</Badge>
                  ) : null}
                </div>
                <CardDescription>
                  {formatDateTime(meeting.date)} · {meeting.duration} min · {meeting.participants.join(", ")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <p className="text-sm leading-7">{meeting.notes}</p>
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-muted-foreground">Decisions</div>
                  {meeting.decisions.map((decision) => (
                    <div key={decision} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />{decision}</div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><ListChecks className="size-3.5" />Action items</div>
                  {meeting.actions.map((action) => (
                    <div key={action.task} className="flex flex-col gap-1 rounded-lg border bg-background p-3">
                      <div className="flex items-center gap-2 text-sm">
                        {action.created ? <CheckCircle2 className="size-3.5 text-emerald-600" /> : <Circle className="size-3.5 text-muted-foreground" />}
                        <span className="font-medium">{action.task}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pl-6 text-xs text-muted-foreground">
                        <span>Owner: {action.owner}</span><span>·</span><span>Due: {action.due}</span>
                        <Badge variant={action.confidence < 0.8 ? "destructive" : "secondary"} className="text-[10px]">
                          {Math.round(action.confidence * 100)}% confidence
                        </Badge>
                        {action.created ? <span className="text-emerald-600">· tracker task created</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
                {meeting.recapSent ? <p className="text-xs text-muted-foreground">Recap sent to participants.</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
