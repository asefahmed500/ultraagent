"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Activity, Gauge, Plus, ScrollText, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  createPolicyAction, deletePolicyAction, setPolicyEnabledAction,
} from "@/app/actions/workspace";
import {
  updateMemberRoleAction, updateWorkspaceAction,
} from "@/app/actions/settings";
import { PLANS_DETAILS, type Plan } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import type { PolicyDTO, UserDTO, WorkspaceDTO } from "@/lib/types";

interface Metrics {
  totalRuns: number; completed: number; failed: number; successRate: number;
  correctionRate: number; approvalAcceptance: number; pendingApprovals: number;
  p50LatencyMs: number; costPerRun: number; weeklyActiveTasks: number; trustIncidents: number;
}

export function AdminClient({
  policies, users, workspace, canManage,
}: {
  policies: PolicyDTO[]; users: UserDTO[]; workspace: WorkspaceDTO; canManage: boolean;
}) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policy, setPolicy] = useState({
    name: "", scope: "workspace", rule: "", effect: "require_approval",
    risk: "external_communication", condition: "always", enabled: true,
  });
  const [workspaceForm, setWorkspaceForm] = useState({
    name: workspace?.name ?? "", plan: (workspace?.plan ?? "Starter") as Plan,
    region: workspace?.region ?? "us-east",
    dataRetentionDays: workspace?.dataRetentionDays ?? 365,
    monthlyActionLimit: workspace?.monthlyActionLimit ?? 500,
    autonomyCeiling: workspace?.autonomyCeiling ?? "L2",
  });

  useEffect(() => {
    fetch("/api/v1/metrics").then((r) => r.json()).then(setMetrics).catch(() => null);
  }, []);

  return (
    <Tabs defaultValue="governance" className="flex flex-col gap-6">
      <TabsList className="w-fit flex-wrap">
        <TabsTrigger value="governance"><ScrollText data-icon="inline-start" /> Governance</TabsTrigger>
        <TabsTrigger value="roles"><Users data-icon="inline-start" /> Roles</TabsTrigger>
        <TabsTrigger value="observability"><Gauge data-icon="inline-start" /> Observability</TabsTrigger>
        <TabsTrigger value="billing"><Activity data-icon="inline-start" /> Plan &amp; billing</TabsTrigger>
      </TabsList>

      <TabsContent value="governance" className="flex flex-col gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="text-base">Policies</CardTitle><CardDescription>Declarative rules evaluated per step. Deny beats allow; approval gates are explicit.</CardDescription></div>
            <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
              <DialogTrigger asChild><Button size="sm" disabled={!canManage}><Plus data-icon="inline-start" /> New policy</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create policy</DialogTitle><DialogDescription>Rules are versioned and take effect immediately.</DialogDescription></DialogHeader>
                <FieldGroup>
                  <Field><FieldLabel htmlFor="p-name">Name</FieldLabel><Input id="p-name" value={policy.name} onChange={(e) => setPolicy({ ...policy, name: e.target.value })} /></Field>
                  <Field><FieldLabel htmlFor="p-rule">Rule</FieldLabel><Input id="p-rule" value={policy.rule} onChange={(e) => setPolicy({ ...policy, rule: e.target.value })} /></Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field><FieldLabel htmlFor="p-effect">Effect</FieldLabel>
                      <select id="p-effect" className="flex h-9 rounded-lg border bg-background px-3 text-sm" value={policy.effect} onChange={(e) => setPolicy({ ...policy, effect: e.target.value })}>
                        <option value="allow">Allow</option><option value="deny">Deny</option><option value="require_approval">Require approval</option>
                      </select>
                    </Field>
                    <Field><FieldLabel htmlFor="p-risk">Risk</FieldLabel>
                      <select id="p-risk" className="flex h-9 rounded-lg border bg-background px-3 text-sm" value={policy.risk} onChange={(e) => setPolicy({ ...policy, risk: e.target.value })}>
                        <option value="all">All</option><option value="read">Read</option><option value="reversible_write">Reversible write</option><option value="external_communication">External</option><option value="irreversible_financial">Financial</option>
                      </select>
                    </Field>
                  </div>
                  <Field><FieldLabel htmlFor="p-cond">Condition</FieldLabel><Input id="p-cond" value={policy.condition} onChange={(e) => setPolicy({ ...policy, condition: e.target.value })} placeholder="always / mail.send / external" /></Field>
                </FieldGroup>
                <DialogFooter><Button variant="outline" onClick={() => setPolicyOpen(false)}>Cancel</Button><Button onClick={async () => {
                  const result = await createPolicyAction(policy as Parameters<typeof createPolicyAction>[0]);
                  if (result.error) toast.error(result.error);
                  else { toast.success("Policy created"); setPolicyOpen(false); router.refresh(); }
                }} disabled={!policy.name || policy.rule.length < 3}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="flex flex-col">
            {policies.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-3 border-b py-3 last:border-0">
                <Switch checked={item.enabled} disabled={!canManage} onCheckedChange={async (v) => {
                  await setPolicyEnabledAction(item.id, v);
                  toast.success(v ? "Policy enabled" : "Policy disabled");
                  router.refresh();
                }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="text-sm font-medium">{item.name}</span><Badge variant="outline" className="text-[10px]">v{item.version}</Badge></div>
                  <div className="text-xs text-muted-foreground">{item.rule} · condition: {item.condition}</div>
                </div>
                <Badge variant={item.effect === "deny" ? "destructive" : item.effect === "allow" ? "secondary" : "outline"} className="text-[10px]">{item.effect.replace(/_/g, " ")}</Badge>
                <Badge variant="outline" className="text-[10px]">{item.risk.replace(/_/g, " ")}</Badge>
                <Button size="xs" variant="ghost" disabled={!canManage} onClick={async () => {
                  await deletePolicyAction(item.id);
                  toast.success("Policy deleted");
                  router.refresh();
                }}><Trash2 data-icon="inline-start" /> Delete</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="roles">
        <Card>
          <CardHeader><CardTitle className="text-base">Members &amp; roles</CardTitle><CardDescription>Role-based access and least-privilege scopes. Admins set autonomy ceilings.</CardDescription></CardHeader>
          <CardContent className="flex flex-col">
            {users.map((member) => (
              <div key={member.id} className="flex flex-wrap items-center gap-3 border-b py-4 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{member.name}</div>
                  <div className="text-xs text-muted-foreground">{member.email}</div>
                </div>
                <Badge variant="outline" className="capitalize">{member.role}</Badge>
                <select
                  className="flex h-8 rounded-lg border bg-background px-2 text-xs"
                  value={member.role}
                  disabled={!canManage || member.role === "owner"}
                  onChange={async (e) => {
                    const result = await updateMemberRoleAction({ userId: member.id, role: e.target.value as UserDTO["role"], autonomyLevel: member.autonomyLevel });
                    if (result.error) toast.error(result.error);
                    else { toast.success("Role updated"); router.refresh(); }
                  }}
                >
                  {["admin", "manager", "member", "viewer"].map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
                <select
                  className="flex h-8 rounded-lg border bg-background px-2 text-xs"
                  value={member.autonomyLevel}
                  disabled={!canManage}
                  onChange={async (e) => {
                    const result = await updateMemberRoleAction({ userId: member.id, role: member.role, autonomyLevel: e.target.value as UserDTO["autonomyLevel"] });
                    if (result.error) toast.error(result.error);
                    else { toast.success("Autonomy updated"); router.refresh(); }
                  }}
                >
                  {["L0", "L1", "L2", "L3"].map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="observability">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Success rate", metrics ? `${metrics.successRate}%` : "—"],
            ["Approval acceptance", metrics ? `${metrics.approvalAcceptance}%` : "—"],
            ["Correction rate", metrics ? `${metrics.correctionRate}%` : "—"],
            ["Trust incidents / 10k", metrics ? formatNumber(metrics.trustIncidents) : "—"],
            ["p50 latency", metrics ? `${(metrics.p50LatencyMs / 1000).toFixed(1)}s` : "—"],
            ["Cost per run", metrics ? `$${metrics.costPerRun.toFixed(3)}` : "—"],
            ["Weekly active tasks", metrics ? String(metrics.weeklyActiveTasks) : "—"],
            ["Pending approvals", metrics ? String(metrics.pendingApprovals) : "—"],
          ].map(([label, value]) => (
            <Card key={label}><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold tabular-nums">{value}</div></CardContent></Card>
          ))}
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Eval suite</CardTitle><CardDescription>Golden tasks per skill, adversarial prompt-injection set and a regression gate before prompts, models or tools ship.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[
              ["Inbox triage", 12, "pass"], ["Calendar", 8, "pass"], ["Documents", 10, "pass"],
              ["Reports", 7, "pass"], ["Meetings", 6, "pass"], ["Approvals", 9, "pass"],
              ["Prompt injection", 14, "pass"], ["Permission escapes", 11, "pass"],
            ].map(([name, count, status]) => (
              <div key={String(name)} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span className="font-medium">{name}</span>
                <span className="text-muted-foreground">{count} cases · {status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="billing">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Workspace</CardTitle><CardDescription>Plan, region and data controls.</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FieldGroup>
                <Field><FieldLabel htmlFor="w-name">Workspace name</FieldLabel><Input id="w-name" value={workspaceForm.name} onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field><FieldLabel htmlFor="w-plan">Plan</FieldLabel>
                    <select id="w-plan" className="flex h-9 rounded-lg border bg-background px-3 text-sm" value={workspaceForm.plan} onChange={(e) => setWorkspaceForm({ ...workspaceForm, plan: e.target.value as Plan })}>
                      {Object.keys(PLANS_DETAILS).map((plan) => <option key={plan} value={plan}>{plan}</option>)}
                    </select>
                  </Field>
                  <Field><FieldLabel htmlFor="w-region">Region</FieldLabel><Input id="w-region" value={workspaceForm.region} onChange={(e) => setWorkspaceForm({ ...workspaceForm, region: e.target.value })} /></Field>
                  <Field><FieldLabel htmlFor="w-retention">Retention (days)</FieldLabel><Input id="w-retention" type="number" value={workspaceForm.dataRetentionDays} onChange={(e) => setWorkspaceForm({ ...workspaceForm, dataRetentionDays: Number(e.target.value) })} /></Field>
                  <Field><FieldLabel htmlFor="w-limit">Monthly actions</FieldLabel><Input id="w-limit" type="number" value={workspaceForm.monthlyActionLimit} onChange={(e) => setWorkspaceForm({ ...workspaceForm, monthlyActionLimit: Number(e.target.value) })} /></Field>
                </div>
                <Field><FieldLabel htmlFor="w-ceiling">Autonomy ceiling</FieldLabel>
                  <select id="w-ceiling" className="flex h-9 rounded-lg border bg-background px-3 text-sm" value={workspaceForm.autonomyCeiling} onChange={(e) => setWorkspaceForm({ ...workspaceForm, autonomyCeiling: e.target.value as never })}>
                    {["L0", "L1", "L2", "L3"].map((level) => <option key={level} value={level}>{level}</option>)}
                  </select>
                </Field>
              </FieldGroup>
              <Button className="w-fit" disabled={!canManage} onClick={async () => {
                const result = await updateWorkspaceAction(workspaceForm);
                if (result.error) toast.error(result.error);
                else { toast.success("Workspace updated"); router.refresh(); }
              }}>Save workspace settings</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Current plan</CardTitle><CardDescription>{workspace?.plan} · {PLANS_DETAILS[(workspace?.plan as Plan) ?? "Starter"]?.unit}</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="text-3xl font-semibold">
                {PLANS_DETAILS[(workspace?.plan as Plan) ?? "Starter"]?.price === 0 ? "Custom" : `$${PLANS_DETAILS[(workspace?.plan as Plan) ?? "Starter"]?.price}`}
              </div>
              <p className="text-sm text-muted-foreground">{PLANS_DETAILS[(workspace?.plan as Plan) ?? "Starter"]?.actions}</p>
              <div className="flex flex-col gap-2">
                {PLANS_DETAILS[(workspace?.plan as Plan) ?? "Starter"]?.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground"><span className="size-1.5 rounded-full bg-foreground" />{feature}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
