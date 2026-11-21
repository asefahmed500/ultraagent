import Link from "next/link";
import { Download, ShieldCheck, ShieldAlert } from "lucide-react";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import { verifyAuditChain } from "@/lib/audit";
import AuditEvent from "@/models/AuditEvent";
import { canViewAudit } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatDateTime, truncate } from "@/lib/format";
import type { AuditEventDTO } from "@/lib/types";

export default async function ActivityPage() {
  const session = await auth();
  await connectDB();
  const workspaceId = session?.user?.workspaceId ?? "";
  const canView = canViewAudit(session?.user?.role ?? "member");
  const [events, chainIndex] = await Promise.all([
    AuditEvent.find({ workspaceId }).sort({ timestamp: -1 }).limit(200).lean(),
    verifyAuditChain(workspaceId),
  ]);
  const eventList = dtoList<AuditEventDTO>(events);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Activity"
        description="An immutable, hash-chained log of every step, tool call and decision."
      >
        <Button variant="outline" size="sm" asChild>
          <a href="/api/v1/audit-events?format=csv" download><Download data-icon="inline-start" /> Export CSV</a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/api/v1/export" download><Download data-icon="inline-start" /> Export data</Link>
        </Button>
      </PageHeader>

      {!canView ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">Your role cannot view the audit log.</CardContent></Card>
      ) : (
        <>
          <Card className={chainIndex === -1 ? "border-emerald-500/30" : "border-destructive/30"}>
            <CardHeader className="flex flex-row items-center gap-3">
              {chainIndex === -1 ? <ShieldCheck className="size-5 text-emerald-600" /> : <ShieldAlert className="size-5 text-destructive" />}
              <div>
                <CardTitle className="text-base">Audit chain {chainIndex === -1 ? "verified" : "compromised"}</CardTitle>
                <CardDescription>
                  {chainIndex === -1
                    ? `${eventList.length} events verified in order. Every hash links to the previous event.`
                    : `First mismatch at event ${chainIndex}.`}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event log</CardTitle>
              <CardDescription>Newest first. Query by actor, action or date via GET /api/v1/audit-events.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Detail</TableHead>
                      <TableHead>Hash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventList.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(event.timestamp)}</TableCell>
                        <TableCell className="text-sm">{event.actor}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{event.action}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{event.target}</TableCell>
                        <TableCell><Badge variant={event.result === "completed" || event.result === "approved" ? "secondary" : "outline"} className="text-[10px]">{event.result}</Badge></TableCell>
                        <TableCell className="max-w-xs text-xs text-muted-foreground">{truncate(event.detail, 70)}</TableCell>
                        <TableCell className="font-mono text-[10px] text-muted-foreground">{event.hash.slice(0, 12)}…</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
