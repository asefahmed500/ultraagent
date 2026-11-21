"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Clock, ExternalLink, Plus, ShieldAlert, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { decideApprovalAction } from "@/app/actions/agent";
import {
  createApprovalRequestAction,
  decideApprovalRequestAction,
} from "@/app/actions/workspace";
import { formatCurrency, formatRelative } from "@/lib/format";
import type { ApprovalDTO, ApprovalRequestDTO } from "@/lib/types";

export function ApprovalsClient({
  gates,
  requests,
  canDecide,
}: {
  gates: ApprovalDTO[];
  requests: ApprovalRequestDTO[];
  canDecide: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("gates");
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [form, setForm] = useState({
    title: "",
    type: "expense",
    amount: "0",
    category: "Software",
    approver: "dana@company.com",
    justification: "",
  });

  async function decideGate(id: string, decision: "approved" | "rejected") {
    try {
      await decideApprovalAction({ approvalId: id, decision, note });
      toast.success(decision === "approved" ? "Approved — run resumed" : "Rejected");
      setNote("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  async function createRequest() {
    const result = await createApprovalRequestAction({
      ...form,
      amount: Number(form.amount),
    });
    if (result.error) toast.error(result.error);
    else {
      toast.success("Approval request created");
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="gates">Agent step gates ({gates.filter((g) => g.decision === "pending").length})</TabsTrigger>
            <TabsTrigger value="requests">Requests &amp; expenses ({requests.filter((r) => r.status === "pending").length})</TabsTrigger>
          </TabsList>
        </Tabs>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus data-icon="inline-start" /> New request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New approval request</DialogTitle>
              <DialogDescription>Policy checks limit, category and separation of duties automatically.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field><FieldLabel htmlFor="ar-title">Title</FieldLabel><Input id="ar-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field><FieldLabel htmlFor="ar-type">Type</FieldLabel>
                  <select id="ar-type" className="flex h-9 w-full rounded-lg border bg-background px-3 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="expense">Expense</option><option value="request">Request</option><option value="access">Access</option>
                  </select>
                </Field>
                <Field><FieldLabel htmlFor="ar-amount">Amount</FieldLabel><Input id="ar-amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
              </div>
              <Field><FieldLabel htmlFor="ar-category">Category</FieldLabel><Input id="ar-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
              <Field><FieldLabel htmlFor="ar-approver">Approver</FieldLabel><Input id="ar-approver" type="email" value={form.approver} onChange={(e) => setForm({ ...form, approver: e.target.value })} /></Field>
              <Field><FieldLabel htmlFor="ar-just">Justification</FieldLabel><Textarea id="ar-just" value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} /></Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={createRequest} disabled={!form.title || form.justification.length < 10}>Create request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {tab === "gates" ? (
        <div className="flex flex-col gap-4">
          {gates.length === 0 ? <Card><CardContent className="py-16 text-center text-sm text-muted-foreground"><ShieldAlert className="mx-auto mb-3 size-6" />No step gates yet.</CardContent></Card> : null}
          {gates.map((gate) => (
            <Card key={gate.id} className={gate.decision === "pending" ? "border-amber-500/30" : ""}>
              <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{gate.title}</CardTitle>
                  <Badge variant={gate.decision === "pending" ? "secondary" : "outline"} className="capitalize">{gate.decision}</Badge>
                  <Badge variant="outline" className="text-[10px]">{gate.risk.replace(/_/g, " ")}</Badge>
                  <span className="ml-auto text-xs text-muted-foreground">{formatRelative(gate.createdAt)}</span>
                </div>
                <CardDescription>{gate.summary}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{gate.tool}</span>
                <Button variant="ghost" size="xs" asChild><Link href={`/dashboard/runs/${gate.runId}`}>View run <ExternalLink data-icon="inline-end" /></Link></Button>
                {gate.decision === "pending" && canDecide ? (
                  <div className="ml-auto flex items-center gap-2">
                    <Input className="h-8 w-48 text-xs" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                    <Button size="xs" variant="outline" onClick={() => decideGate(gate.id, "rejected")}><X data-icon="inline-start" /> Reject</Button>
                    <Button size="xs" onClick={() => decideGate(gate.id, "approved")}><Check data-icon="inline-start" /> Approve</Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col">
            {requests.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">No requests yet.</p> : requests.map((request) => (
              <div key={request.id} className="flex flex-wrap items-center gap-3 border-b py-4 last:border-0">
                <span className={`flex size-9 items-center justify-center rounded-lg ${request.status === "pending" ? "bg-amber-500/10 text-amber-600" : request.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>
                  {request.status === "pending" ? <Clock className="size-4" /> : request.status === "rejected" ? <X className="size-4" /> : <Check className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="text-sm font-medium">{request.title}</span><Badge variant="outline" className="text-[10px]">{request.type}</Badge></div>
                  <div className="text-xs text-muted-foreground">{request.category} · {request.justification}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Policy: {request.policyCheck}</div>
                </div>
                <div className="text-right"><div className="text-sm font-medium tabular-nums">{formatCurrency(request.amount)}</div><div className="text-xs text-muted-foreground">→ {request.approver}</div></div>
                <Badge variant="outline" className="capitalize">{request.status.replace(/_/g, " ")}</Badge>
                {request.status === "pending" && canDecide ? (
                  <div className="flex gap-2">
                    <Button size="xs" variant="outline" onClick={async () => { await decideApprovalRequestAction(request.id, "rejected"); toast.success("Rejected"); router.refresh(); }}>Reject</Button>
                    <Button size="xs" onClick={async () => { await decideApprovalRequestAction(request.id, "approved"); toast.success("Approved"); router.refresh(); }}>Approve</Button>
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
