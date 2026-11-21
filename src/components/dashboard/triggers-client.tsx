"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Play, Plus, Trash2, Webhook } from "lucide-react";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  createTriggerAction,
  deleteTriggerAction,
  runTriggerNowAction,
  setTriggerEnabledAction,
} from "@/app/actions/workspace";
import { formatRelative } from "@/lib/format";
import type { TriggerDTO } from "@/lib/types";

const SKILLS = [
  "inbox-triage", "calendar-scheduling", "document-summary",
  "weekly-report", "meeting-notes", "approvals", "general",
];

export function TriggersClient({ triggers }: { triggers: TriggerDTO[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", source: "schedule", condition: "", schedule: "0 15 * * 5",
    skill: "weekly-report", instruction: "", enabled: true, dryRun: false,
  });

  async function create() {
    const result = await createTriggerAction(form);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Trigger created");
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus data-icon="inline-start" /> New trigger</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a trigger</DialogTitle><DialogDescription>Define when UltraAgent should run a skill automatically.</DialogDescription></DialogHeader>
            <FieldGroup>
              <Field><FieldLabel htmlFor="t-name">Name</FieldLabel><Input id="t-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Friday weekly report" /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field><FieldLabel htmlFor="t-source">Source</FieldLabel>
                  <select id="t-source" className="flex h-9 w-full rounded-lg border bg-background px-3 text-sm" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                    <option value="schedule">Time schedule</option><option value="webhook">Webhook event</option><option value="condition">Condition</option><option value="manual">Manual</option>
                  </select>
                </Field>
                <Field><FieldLabel htmlFor="t-skill">Skill</FieldLabel>
                  <select id="t-skill" className="flex h-9 w-full rounded-lg border bg-background px-3 text-sm" value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })}>
                    {SKILLS.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
                  </select>
                </Field>
              </div>
              <Field><FieldLabel htmlFor="t-condition">When</FieldLabel><Input id="t-condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} placeholder="Every Friday at 15:00" /></Field>
              <Field><FieldLabel htmlFor="t-schedule">Cron (optional)</FieldLabel><Input id="t-schedule" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} /></Field>
              <Field><FieldLabel htmlFor="t-instruction">Instruction</FieldLabel><Input id="t-instruction" value={form.instruction} onChange={(e) => setForm({ ...form, instruction: e.target.value })} placeholder="Build the weekly report from the tracker" /></Field>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} /> Enabled</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.dryRun} onCheckedChange={(v) => setForm({ ...form, dryRun: v })} /> Dry run</label>
              </div>
            </FieldGroup>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create} disabled={!form.name || form.instruction.length < 4}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {triggers.length === 0 ? (
        <Card><CardContent className="py-20 text-center text-sm text-muted-foreground">No triggers yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {triggers.map((trigger) => (
            <Card key={trigger.id}>
              <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{trigger.name}</CardTitle>
                  <Badge variant={trigger.enabled ? "secondary" : "outline"}>{trigger.enabled ? "enabled" : "paused"}</Badge>
                </div>
                <CardDescription className="flex items-center gap-1.5">
                  {trigger.source === "webhook" ? <Webhook className="size-3.5" /> : <CalendarClock className="size-3.5" />}
                  {trigger.condition}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm">{trigger.instruction}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px]">{trigger.skill.replace(/-/g, " ")}</Badge>
                  {trigger.dryRun ? <Badge variant="secondary" className="text-[10px]">dry run</Badge> : null}
                  <Badge variant="outline" className="text-[10px]">{trigger.runCount} runs</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {trigger.lastRunAt ? `Last run ${formatRelative(trigger.lastRunAt)}` : "Never run"}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="xs" onClick={async () => {
                    const runId = await runTriggerNowAction(trigger.id);
                    toast.success("Trigger run started");
                    router.push(`/dashboard/runs/${runId}`);
                  }}><Play data-icon="inline-start" /> Run now</Button>
                  <Button size="xs" variant="outline" onClick={async () => {
                    await setTriggerEnabledAction(trigger.id, !trigger.enabled);
                    toast.success(trigger.enabled ? "Trigger paused" : "Trigger enabled");
                    router.refresh();
                  }}>{trigger.enabled ? "Pause" : "Enable"}</Button>
                  <Button size="xs" variant="ghost" onClick={async () => {
                    await deleteTriggerAction(trigger.id);
                    toast.success("Trigger deleted");
                    router.refresh();
                  }}><Trash2 data-icon="inline-start" /> Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
