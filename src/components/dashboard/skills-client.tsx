"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, FlaskConical, Plus, Sparkles, Wrench } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { createCustomSkillAction, runSkillTestAction } from "@/app/actions/workspace";
import type { SkillDTO } from "@/lib/types";

interface CustomSkill {
  id: string;
  name: string;
  description: string;
  instruction: string;
  risk: string;
  tools: string[];
  version: string;
  tests: Array<{ name: string; instruction: string; expected: string; passed: boolean }>;
}

export function SkillsClient({
  catalog,
  custom,
}: {
  catalog: SkillDTO[];
  custom: CustomSkill[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: "", name: "", description: "", instruction: "",
    risk: "reversible_write", tools: "notification.send",
  });

  async function create() {
    const result = await createCustomSkillAction({
      ...form,
      tools: form.tools.split(",").map((t) => t.trim()).filter(Boolean),
    });
    if (result.error) toast.error(result.error);
    else {
      toast.success("Custom skill created");
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus data-icon="inline-start" /> Build a skill</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Custom skill</DialogTitle><DialogDescription>Define a reusable capability with a narrow tool set and an autonomy floor.</DialogDescription></DialogHeader>
            <FieldGroup>
              <Field><FieldLabel htmlFor="s-id">ID</FieldLabel><Input id="s-id" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="daily-brief" /></Field>
              <Field><FieldLabel htmlFor="s-name">Name</FieldLabel><Input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Daily brief" /></Field>
              <Field><FieldLabel htmlFor="s-desc">Description</FieldLabel><Textarea id="s-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
              <Field><FieldLabel htmlFor="s-inst">Example instruction</FieldLabel><Input id="s-inst" value={form.instruction} onChange={(e) => setForm({ ...form, instruction: e.target.value })} placeholder="Prepare a briefing for today's meetings" /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field><FieldLabel htmlFor="s-risk">Risk class</FieldLabel>
                  <select id="s-risk" className="flex h-9 rounded-lg border bg-background px-3 text-sm" value={form.risk} onChange={(e) => setForm({ ...form, risk: e.target.value })}>
                    <option value="read">Read</option><option value="reversible_write">Reversible write</option><option value="external_communication">External communication</option><option value="irreversible_financial">Irreversible / financial</option>
                  </select>
                </Field>
                <Field><FieldLabel htmlFor="s-tools">Tools (comma separated)</FieldLabel><Input id="s-tools" value={form.tools} onChange={(e) => setForm({ ...form, tools: e.target.value })} /></Field>
              </div>
            </FieldGroup>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create} disabled={!form.id || !form.name || form.description.length < 10}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">Catalog — installed</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {catalog.map((skill) => (
            <Card key={skill.id}>
              <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-secondary"><Sparkles className="size-4" /></span>
                  <Badge variant="secondary" className="text-[10px]">v{skill.version}</Badge>
                </div>
                <CardTitle className="text-base">{skill.name}</CardTitle>
                <CardDescription>{skill.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px]">{skill.category}</Badge>
                  <Badge variant="outline" className="text-[10px]">floor {skill.autonomyFloor}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Try: “{skill.example}”</p>
                <Button size="xs" variant="outline" disabled={testing === skill.id} onClick={async () => {
                  setTesting(skill.id);
                  const { createRunAction } = await import("@/app/actions/agent");
                  const { run } = await createRunAction({ instruction: skill.example });
                  setTesting(null);
                  router.push(`/dashboard/runs/${run.id}`);
                }}><FlaskConical data-icon="inline-start" /> Test skill</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {custom.length > 0 ? (
        <div>
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">Custom skills</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {custom.map((skill) => (
              <Card key={skill.id}>
                <CardHeader className="gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-secondary"><Wrench className="size-4" /></span>
                    <Badge variant="outline" className="text-[10px]">custom</Badge>
                  </div>
                  <CardTitle className="text-base">{skill.name}</CardTitle>
                  <CardDescription>{skill.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">{skill.tools.map((tool) => <Badge key={tool} variant="outline" className="font-mono text-[10px]">{tool}</Badge>)}</div>
                  {skill.tests.map((test) => (
                    <div key={test.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                      {test.passed ? <Check className="size-3 text-emerald-600" /> : null}{test.name}: {test.expected}
                    </div>
                  ))}
                  <Button size="xs" variant="outline" onClick={async () => {
                    const runId = await runSkillTestAction(skill.id, skill.instruction);
                    toast.success("Test run started");
                    router.push(`/dashboard/runs/${runId}`);
                  }}><FlaskConical data-icon="inline-start" /> Run test</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
