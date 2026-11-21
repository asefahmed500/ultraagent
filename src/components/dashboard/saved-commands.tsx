"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bookmark, Play, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  createSavedCommandAction,
  deleteSavedCommandAction,
  runSavedCommandAction,
} from "@/app/actions/workspace";
import type { SavedCommandDTO } from "@/lib/types";

export function SavedCommands({ commands }: { commands: SavedCommandDTO[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [instruction, setInstruction] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [pending, setPending] = useState(false);

  async function create() {
    setPending(true);
    try {
      const result = await createSavedCommandAction({ label, instruction, shortcut });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Saved command created");
        setOpen(false);
        setLabel("");
        setInstruction("");
        setShortcut("");
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Saved commands</CardTitle>
          <CardDescription>Reusable instructions and shortcuts (CMD-5).</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus data-icon="inline-start" /> Save command</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save a command</DialogTitle>
              <DialogDescription>Create a shortcut for an instruction you run often.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="cmd-label">Label</FieldLabel>
                <Input id="cmd-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Triage inbox" />
              </Field>
              <Field>
                <FieldLabel htmlFor="cmd-instruction">Instruction</FieldLabel>
                <Input id="cmd-instruction" value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="Sort my inbox and draft replies" />
              </Field>
              <Field>
                <FieldLabel htmlFor="cmd-shortcut">Shortcut (optional)</FieldLabel>
                <Input id="cmd-shortcut" value={shortcut} onChange={(e) => setShortcut(e.target.value)} placeholder="⌘1" />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={create} disabled={pending || !label || !instruction}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {commands.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved commands yet.</p>
        ) : (
          commands.map((command) => (
            <div key={command.id} className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5">
              <Bookmark className="size-3.5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{command.label}</span>
                <span className="text-xs text-muted-foreground">{command.useCount} runs used</span>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={async () => {
                  const runId = await runSavedCommandAction(command.id);
                  router.push(`/dashboard/runs/${runId}`);
                }}
                aria-label={`Run ${command.label}`}
              >
                <Play />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={async () => {
                  await deleteSavedCommandAction(command.id);
                  toast.success("Command removed");
                  router.refresh();
                }}
                aria-label={`Delete ${command.label}`}
              >
                <Trash2 />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
