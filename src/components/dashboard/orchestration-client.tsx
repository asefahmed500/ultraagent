"use client";

import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  Bot,
  CheckCircle2,
  CircleDot,
  Cpu,
  FileCheck2,
  Mic,
  Route,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUI } from "@/components/store-provider";
import { formatRelative } from "@/lib/format";
import type { RunDTO } from "@/lib/types";

const stages = [
  { icon: Bot, title: "Orchestrator", detail: "Owns run state, pause and resume" },
  { icon: Cpu, title: "Planner", detail: "Intent → ordered plan" },
  { icon: ShieldCheck, title: "Policy engine", detail: "Allow, deny or require approval" },
  { icon: Route, title: "Skill agents", detail: "Narrow tools, no direct handoffs" },
  { icon: Wrench, title: "Tool gateway", detail: "Typed tools, retries, inverses" },
  { icon: FileCheck2, title: "Audit & verify", detail: "Hash-chained trace, undo" },
];

export function OrchestrationClient({ runs }: { runs: RunDTO[] }) {
  const setOpen = useUI((s) => s.setCommandBarOpen);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">Agent loop</CardTitle>
            <Badge variant="secondary" className="text-[10px]">multi-agent</Badge>
          </div>
          <CardDescription>Skill agents cannot call each other. Every handoff goes through the orchestrator.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
            {stages.map((stage, index) => (
              <div key={stage.title} className="flex flex-1 items-start gap-3 lg:flex-col">
                <div className="flex items-center gap-2 lg:w-full">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <stage.icon className="size-4" />
                  </span>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">0{index + 1}</span>
                </div>
                <div className="flex flex-col gap-1 pb-2">
                  <span className="text-sm font-medium">{stage.title}</span>
                  <span className="text-xs leading-5 text-muted-foreground">{stage.detail}</span>
                </div>
                {index < stages.length - 1 ? (
                  <ArrowRight className="hidden size-4 shrink-0 self-center text-muted-foreground lg:block" />
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Live runs</CardTitle>
            <CardDescription>Each run carries its own plan, policy decisions and trace.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            {runs.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No runs yet.</p>
            ) : (
              runs.map((run) => {
                const completed = run.steps.filter((step) => step.status === "completed").length;
                return (
                  <Link
                    key={run.id}
                    href={`/dashboard/runs/${run.id}`}
                    className="flex items-center gap-3 border-b px-2 py-3.5 transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <CircleDot className={`size-4 shrink-0 ${run.state === "completed" ? "text-emerald-600" : run.state === "awaiting_approval" ? "text-amber-600" : "text-muted-foreground"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{run.instruction}</div>
                      <div className="text-xs text-muted-foreground">
                        {run.skill.replace(/-/g, " ")} · {run.modelRoute} · {completed}/{run.steps.length} steps
                      </div>
                    </div>
                    <Badge variant="outline" className="hidden capitalize sm:inline-flex">{run.state.replace(/_/g, " ")}</Badge>
                    <span className="text-xs text-muted-foreground">{formatRelative(run.createdAt)}</span>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-secondary"><Mic className="size-4" /></span>
              <CardTitle className="text-base">Voice agent</CardTitle>
              <CardDescription>Speak an instruction in the command bar. It becomes a normal task with the same plan, policy checks and audit trail.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-xs">
                <AudioLines className="size-3.5 text-muted-foreground" /> Browser speech recognition
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-xs">
                <CheckCircle2 className="size-3.5 text-emerald-600" /> Same orchestration as typed input
              </div>
              <Separator />
              <Button size="sm" onClick={() => setOpen(true)}>Open voice command bar</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Isolation</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-xs leading-6 text-muted-foreground">
              <p>Tools are typed and versioned with declared risk, scopes, idempotency keys and inverses.</p>
              <p>Content from mail and files is untrusted and cannot change policy or the plan without confirmation.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
