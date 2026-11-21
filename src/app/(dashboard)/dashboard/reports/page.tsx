import { AlertTriangle, BarChart3, Check, Send } from "lucide-react";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import Report from "@/models/Report";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { CommandTrigger } from "@/components/dashboard/command-trigger";
import { formatNumber } from "@/lib/format";
import type { ReportDTO } from "@/lib/types";

export default async function ReportsPage() {
  const session = await auth();
  await connectDB();
  const reports = dtoList<ReportDTO>(
    await Report.find({
      workspaceId: session?.user?.workspaceId,
      ownerId: session?.user?.id,
    })
      .sort({ createdAt: -1 })
      .lean()
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Reports"
        description="Versioned reports built from named sources, with charts, calculation notes and stale-input flags."
      >
        <CommandTrigger>Build a report</CommandTrigger>
      </PageHeader>

      {reports.length === 0 ? (
        <Card><CardContent className="py-20 text-center text-sm text-muted-foreground"><BarChart3 className="mx-auto mb-3 size-6" />No reports yet.</CardContent></Card>
      ) : (
        <div className="flex flex-col gap-6">
          {reports.map((report) => {
            const max = Math.max(...report.chart.map((point) => Math.max(point.value, point.target)), 1);
            return (
              <Card key={report.id}>
                <CardHeader className="gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <Badge variant="outline">v{report.version}</Badge>
                    <Badge variant={report.status === "sent" ? "secondary" : "outline"} className="capitalize">{report.status}</Badge>
                    <span className="ml-auto text-xs text-muted-foreground">{report.period}</span>
                  </div>
                  <CardDescription>Sources: {report.sources.join(" · ")}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {report.metrics.map((metric) => (
                      <div key={metric.label} className="rounded-xl border bg-background p-4">
                        <div className="text-xs text-muted-foreground">{metric.label}</div>
                        <div className="mt-1.5 text-2xl font-semibold tabular-nums">
                          {metric.value > 1000 ? `$${formatNumber(metric.value)}` : metric.value}
                        </div>
                        <div className={`mt-1 text-xs ${metric.delta >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                          {metric.delta >= 0 ? "+" : ""}{metric.delta}% vs last week
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border bg-background p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                      <BarChart3 className="size-4" /> Weekly trend
                    </div>
                    <div className="flex h-40 items-end gap-6">
                      {report.chart.map((point) => (
                        <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                          <div className="flex h-32 w-full items-end justify-center gap-1.5">
                            <div className="w-1/3 rounded-t bg-foreground" style={{ height: `${(point.value / max) * 100}%` }} title={`Actual ${point.value}`} />
                            <div className="w-1/3 rounded-t bg-border" style={{ height: `${(point.target / max) * 100}%` }} title={`Target ${point.target}`} />
                          </div>
                          <span className="text-xs text-muted-foreground">{point.month}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-foreground" /> Actual</span>
                      <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-border" /> Target</span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border bg-background p-4">
                      <div className="mb-2 text-xs font-medium text-muted-foreground">Narrative &amp; calculation notes</div>
                      <p className="text-sm leading-7">{report.narrative}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{report.notes}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      {report.staleInputs.length > 0 ? (
                        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                          <div><div className="font-medium">Stale inputs flagged</div>{report.staleInputs.join(", ")}</div>
                        </div>
                      ) : null}
                      <div className="flex items-start gap-2 rounded-xl border bg-background p-3 text-xs">
                        <Send className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                        <div><div className="font-medium">Distribution</div><span className="text-muted-foreground">{report.recipients.join(", ")}</span></div>
                      </div>
                      {report.status === "sent" ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-600"><Check className="size-3.5" /> Sent after approval</div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
