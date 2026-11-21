"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createRunAction } from "@/app/actions/agent";

export function QuickInstructionButton({ instruction }: { instruction: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run() {
    if (pending) return;
    setPending(true);
    try {
      const { run } = await createRunAction({ instruction });
      toast.success("Task started", { description: instruction });
      router.push(`/dashboard/runs/${run.id}`);
      router.refresh();
    } catch (error) {
      toast.error("Could not start task", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={run} disabled={pending} className="h-auto whitespace-normal py-2 text-left">
      {pending ? <LoaderCircle className="size-3 animate-spin" /> : <ArrowUpRight className="size-3" />}
      {instruction}
    </Button>
  );
}
