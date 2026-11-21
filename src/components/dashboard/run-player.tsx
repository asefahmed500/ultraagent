"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  Circle,
  CircleCheck,
  Clock,
  ExternalLink,
  LoaderCircle,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  advanceRunAction,
  answerClarificationAction,
  retryStepAction,
  undoRunAction,
} from "@/app/actions/agent";
import { RISK_LABELS, type RiskClass } from "@/lib/constants";
import type { RunDTO } from "@/lib/types";
import { formatDateTime, formatRelative } from "@/lib/format";

const TERMINAL = ["completed", "failed", "rejected", "undone", "escalated", "needs_input"];

export function RunPlayer({ initialRun }: { initialRun: RunDTO }) {
  const router = useRouter();
  const [run, setRun] = useState(initialRun);
  const runRef = useRef(run);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      const current = runRef.current;
      if (!current || TERMINAL.includes(current.state)) return;
      try {
        const updated = await advanceRunAction(current.id);
        if (cancelled) return;
        runRef.current = updated;
        setRun(updated);
      } catch {
        // transient — keep polling
      }
      if (!cancelled) timer = setTimeout(tick, 900);
    };
    timer = setTimeout(tick, 900);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [initialRun.id]);

  const done = run.steps.filter((step) => step.status === "completed").length;
  const total = run.steps.length || 1;
  const progress = Math.round((done / total) * 100);

  async function act(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      const result = await action();
      if (result && typeof result === "object" && "id" in result) {
        setRun(result as RunDTO);
        runRef.current = result as RunDTO;
      } else if (result && typeof result === "object" && "runId" in result) {
        router.push(`/dashboard/runs/${String((result as { runId: string }).runId)}`);
      }
      toast.success(message);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={run.state === "completed" ? "secondary" : "outline"} className="capitalize">
              {run.state.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline">{run.skill.replace(/-/g, " ")}</Badge>
            <Badge variant="outline">{run.modelRoute}</Badge>
            {run.dryRun ? <Badge variant="secondary">Dry run</Badge> : null}
            <span className="ml-auto text-xs text-muted-foreground">
              Started {formatDateTime(run.startedAt)}
            </span>
          </div>
          <CardTitle className="text-xl leading-8">{run.instruction}</CardTitle>
          <CardDescription>
            {run.steps.length} planned steps · {run.tokens} tokens · ${run.cost.toFixed(2)} estimated cost
          </CardDescription>
          <Progress value={progress} className="h-1.5" />
        </CardHeader>
      </Card>

      {run.state === "needs_input" ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" /> One quick question
            </CardTitle>
            <CardDescription>{run.clarification}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(run.clarificationChoices ?? []).map((choice) => (
              <Button
                key={choice}
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void act(
                    () => answerClarificationAction(run.id, choice),
                    "Plan created"
                  )
                }
              >
                {choice}
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {run.state === "awaiting_approval" ? (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <ShieldAlert className="size-4" />
          <AlertTitle>Approval required</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>A high-risk step is paused. Decide in the Approvals queue to resume this run.</span>
            <Button size="sm" variant="outline" asChild className="w-fit">
              <a href="/dashboard/approvals">Open approvals <ExternalLink data-icon="inline-end" /></a>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {["failed", "escalated"].includes(run.state) ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>{run.state === "escalated" ? "Escalated to a human" : "Run failed"}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{run.error ?? "A step failed."}</span>
            {run.steps
              .filter((step) => step.status === "failed")
              .map((step) => (
                <Button
                  key={step.id}
                  size="xs"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void act(
                      () => retryStepAction(run.id, step.id ?? ""),
                      "Step queued for retry"
                    )
                  }
                >
                  <RotateCcw data-icon="inline-start" /> Retry step
                </Button>
              ))}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan &amp; progress</CardTitle>
          <CardDescription>
            Steps stream as they run. Risk classes and policy decisions are shown for every action.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          {run.steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No plan yet — answering your question first.</p>
          ) : (
            run.steps.map((step, index) => (
              <StepRow key={step.id} step={step} isLast={index === run.steps.length - 1} />
            ))
          )}
        </CardContent>
      </Card>

      {run.state === "completed" ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleCheck className="size-4 text-emerald-600" /> Result
            </CardTitle>
            <CardDescription>{run.outcome}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {run.steps
                .flatMap((step) => step.changes ?? [])
                .map((change, index) => (
                  <Badge key={`${change}-${index}`} variant="secondary">{change}</Badge>
                ))}
            </div>
            <p className="text-sm text-muted-foreground">{run.summary}</p>
            <div className="flex flex-wrap items-center gap-2">
              {run.undoAvailable ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void act(() => undoRunAction(run.id), "Reversible actions undone")}
                >
                  <Undo2 data-icon="inline-start" /> Undo reversible actions
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" asChild>
                <a href="/dashboard/activity">View audit trail <ExternalLink data-icon="inline-end" /></a>
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">
                Completed {formatRelative(run.endedAt)}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {run.state === "undone" ? (
        <Alert>
          <Undo2 className="size-4" />
          <AlertTitle>Undone</AlertTitle>
          <AlertDescription>{run.outcome}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

function StepRow({
  step,
  isLast,
}: {
  step: RunDTO["steps"][number];
  isLast: boolean;
}) {
  const statusIcon = {
    pending: <Circle className="size-4 text-muted-foreground" />,
    running: <LoaderCircle className="size-4 animate-spin text-foreground" />,
    awaiting_approval: <Clock className="size-4 text-amber-600" />,
    completed: <CircleCheck className="size-4 text-emerald-600" />,
    rejected: <X className="size-4 text-destructive" />,
    failed: <AlertTriangle className="size-4 text-destructive" />,
    undone: <Undo2 className="size-4 text-muted-foreground" />,
  }[step.status] ?? <Circle className="size-4" />;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span className="flex size-8 items-center justify-center rounded-full border bg-background">
          {statusIcon}
        </span>
        {!isLast ? <span className="my-1 w-px flex-1 bg-border" /> : null}
      </div>
      <div className={`flex flex-1 flex-col gap-2 ${isLast ? "pb-0" : "pb-6"}`}>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-sm font-medium">{step.title}</span>
          <Badge variant="outline" className="text-[10px]">
            {(RISK_LABELS[step.risk as RiskClass] ?? step.risk)}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">{step.app}</Badge>
          <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
            {step.status === "completed" && step.completedAt
              ? formatRelative(step.completedAt)
              : step.status.replace(/_/g, " ")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{step.detail}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{step.tool}</p>
        {step.requiresApproval ? (
          <p className="text-xs text-amber-700">Policy: {step.policyReason}</p>
        ) : null}
        {step.output ? (
          <div className="rounded-lg border bg-background p-3 text-xs leading-6">
            {step.output}
            {step.changes?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {step.changes.map((change, i) => (
                  <Badge key={`${change}-${i}`} variant="secondary" className="text-[10px]">
                    <Check className="mr-1 size-2.5" /> {change}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        {step.error ? <p className="text-xs text-destructive">{step.error}</p> : null}
      </div>
    </div>
  );
}
