import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Inbox,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import Run from "@/models/Run";
import Approval from "@/models/Approval";
import EmailMessage from "@/models/EmailMessage";
import CalendarEvent from "@/models/CalendarEvent";
import Workspace from "@/models/Workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/dashboard/page-header";
import { CommandTrigger, FloatingCommandButton } from "@/components/dashboard/command-trigger";
import { QuickInstructionButton } from "@/components/dashboard/quick-instruction";
import { formatRelative, truncate } from "@/lib/format";

export default async function HomePage() {
  const session = await auth();
  await connectDB();
  const workspaceId = session?.user?.workspaceId ?? "";
  const ownerId = session?.user?.id ?? "";

  const [runs, approvals, drafts, events, workspace] = await Promise.all([
    Run.find({ workspaceId, ownerId }).sort({ createdAt: -1 }).limit(6).lean(),
    Approval.find({ workspaceId, decision: "pending" }).sort({ createdAt: -1 }).limit(4).lean(),
    EmailMessage.countDocuments({ workspaceId, ownerId, draftStatus: "ready" }),
    CalendarEvent.find({ workspaceId, ownerId })
      .sort({ start: 1 })
      .limit(3)
      .lean(),
    Workspace.findById(workspaceId).lean(),
  ]);

  const runList = dtoList<import("@/lib/types").RunDTO>(runs);
  const approvalList = dtoList<import("@/lib/types").ApprovalDTO>(approvals);
  const completed = runList.filter((r) => r.state === "completed").length;
  const actionRatio = workspace?.monthlyActionLimit
    ? Math.round(
        ((workspace.actionsUsedThisMonth ?? 0) / workspace.monthlyActionLimit) * 100
      )
    : 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Your daily brief"
        description="Everything UltraAgent did, what needs your decision, and what's next."
      >
        <CommandTrigger />
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/activity">View activity <ArrowRight data-icon="inline-end" /></Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tasks completed", value: completed, icon: CheckCircle2, hint: "all time" },
          { label: "Pending approvals", value: approvalList.length, icon: ShieldAlert, hint: "need a decision" },
          { label: "Drafts to review", value: drafts, icon: Inbox, hint: "queued for you" },
          { label: "Upcoming events", value: events.length, icon: CalendarDays, hint: "next 3" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent runs</CardTitle>
              <CardDescription>See exactly what the agent did, step by step.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/tasks">All tasks</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {runList.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Sparkles className="size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No runs yet. Give UltraAgent an instruction to get started.</p>
                <CommandTrigger>Start your first task</CommandTrigger>
              </div>
            ) : (
              <div className="flex flex-col">
                {runList.map((run) => (
                  <Link
                    key={run.id}
                    href={`/dashboard/runs/${run.id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${run.state === "completed" ? "bg-emerald-500/10 text-emerald-600" : run.state === "awaiting_approval" ? "bg-amber-500/10 text-amber-600" : "bg-muted"}`}>
                      {run.state === "completed" ? <CheckCircle2 className="size-4" /> : run.state === "awaiting_approval" ? <Clock className="size-4" /> : <Sparkles className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{run.instruction}</div>
                      <div className="text-xs text-muted-foreground">
                        {run.skill.replace(/-/g, " ")} · {run.steps.length} steps · ${run.cost.toFixed(2)}
                      </div>
                    </div>
                    <Badge variant="outline" className="hidden capitalize sm:inline-flex">
                      {run.state.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatRelative(run.createdAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Needs your decision</CardTitle>
              <CardDescription>High-risk steps are paused until you approve.</CardDescription>
            </CardHeader>
            <CardContent>
              {approvalList.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nothing waiting. You&apos;re in control.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {approvalList.map((approval) => (
                    <Link
                      key={approval.id}
                      href="/dashboard/approvals"
                      className="flex flex-col gap-1 rounded-lg border bg-background p-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="size-3.5 text-amber-600" />
                        <span className="text-sm font-medium">{approval.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{truncate(approval.summary, 80)}</span>
                    </Link>
                  ))}
                </div>
              )}
              <Separator className="my-4" />
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/dashboard/approvals">Open approvals</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workspace usage</CardTitle>
              <CardDescription>{workspace?.name ?? "Workspace"} · {workspace?.plan ?? "Starter"}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Actions this month</span>
                <span className="font-medium tabular-nums">
                  {workspace?.actionsUsedThisMonth ?? 0} / {workspace?.monthlyActionLimit ?? 0}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.min(actionRatio, 100)}%` }} />
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="size-3" /> {actionRatio}% of monthly allowance used
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next on your calendar</CardTitle>
            <CardDescription>Proposed and booked events.</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            ) : (
              <div className="flex flex-col">
                {events.map((event) => (
                  <div key={String(event._id)} className="flex items-center gap-3 border-b py-2.5 last:border-0">
                    <span className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary text-[10px] font-medium">
                      {new Date(event.start as Date).toLocaleDateString("en-US", { month: "short" })}
                      <span className="text-xs">{new Date(event.start as Date).getDate()}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{String(event.title)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.start as Date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} · {(event.attendees as string[]).length} attendees
                      </div>
                    </div>
                    <Badge variant={event.status === "booked" ? "secondary" : "outline"} className="text-[10px]">
                      {String(event.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Try an instruction</CardTitle>
            <CardDescription>Click one to run it immediately.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[
              "Sort my inbox and reply to Dana",
              "Book 30 minutes with Dana next Tuesday afternoon",
              "Summarize the vendor contract and cite the risk sections",
              "Build the weekly report from the tracker",
              "Check the vendor invoice and route it for approval",
            ].map((instruction) => (
              <QuickInstructionButton key={instruction} instruction={instruction} />
            ))}
          </CardContent>
        </Card>
      </div>

      <FloatingCommandButton />
    </div>
  );
}
