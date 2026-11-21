"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CornerDownLeft, LoaderCircle, Mic, Sparkles } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useUI } from "@/components/store-provider";
import { createRunAction } from "@/app/actions/agent";
import { SKILLS } from "@/lib/agent/registry";

interface SavedCommand {
  id: string;
  label: string;
  instruction: string;
  shortcut: string;
  useCount: number;
}

export function CommandBar({ savedCommands = [] }: { savedCommands?: SavedCommand[] }) {
  const router = useRouter();
  const open = useUI((s) => s.commandBarOpen);
  const setOpen = useUI((s) => s.setCommandBarOpen);
  const [value, setValue] = useState("");
  const [dryRun, setDryRun] = useState(false);
  const [pending, setPending] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  async function run(instruction: string) {
    if (!instruction.trim() || pending) return;
    setPending(true);
    try {
      const { run } = await createRunAction({ instruction, dryRun });
      setOpen(false);
      setValue("");
      toast.success(dryRun ? "Dry run created" : "Task started", {
        description: "Watch the plan execute step by step.",
      });
      router.push(`/dashboard/runs/${run.id}`);
      router.refresh();
    } catch (error) {
      toast.error("Could not start the task", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setPending(false);
    }
  }

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Constructor) {
      toast.error("Voice input is not supported in this browser", {
        description: "Use Chrome or Edge, or type your instruction instead.",
      });
      return;
    }
    const recognition = new Constructor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setValue((current) => (current ? `${current} ${transcript}` : transcript));
        toast.success("Voice instruction captured");
      }
    };
    recognition.onerror = (event) => {
      toast.error("Could not hear you", { description: event.error });
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="UltraAgent command bar"
      description="Type an instruction and UltraAgent will plan the work before acting."
    >
      <Command shouldFilter loop>
      <CommandInput
        placeholder="Sort my inbox and reply to Dana…"
        value={value}
        onValueChange={setValue}
        onKeyDown={(event) => {
          if (event.key === "Enter" && value.trim()) {
            event.preventDefault();
            void run(value);
          }
        }}
      />
      <CommandList>
        <CommandEmpty>No matching skill. Press Enter to run a general task.</CommandEmpty>
        {savedCommands.length > 0 ? (
          <CommandGroup heading="Saved commands">
            {savedCommands.map((command) => (
              <CommandItem
                key={command.id}
                value={`saved ${command.label} ${command.instruction}`}
                onSelect={() => void run(command.instruction)}
              >
                <Sparkles />
                <span>{command.label}</span>
                {command.shortcut ? <CommandShortcut>{command.shortcut}</CommandShortcut> : null}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        <CommandSeparator />
        <CommandGroup heading="Skills">
          {SKILLS.map((skill) => (
            <CommandItem
              key={skill.id}
              value={`skill ${skill.name} ${skill.example} ${skill.keywords.join(" ")}`}
              onSelect={() => void run(value.trim() || skill.example)}
            >
              <Sparkles />
              <span className="flex flex-col">
                <span>{skill.name}</span>
                <span className="text-xs text-muted-foreground">{skill.example}</span>
              </span>
              <Badge variant="outline" className="ml-auto text-[10px]">{skill.version}</Badge>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="flex items-center gap-4 border-t px-4 py-3 text-xs text-muted-foreground">
        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox
            id="dry-run"
            checked={dryRun}
            onCheckedChange={(checked) => setDryRun(checked === true)}
          />
          Dry run — plan only, make no changes
        </label>
        <Button
          type="button"
          size="xs"
          variant={listening ? "secondary" : "outline"}
          onClick={toggleVoice}
          className={listening ? "text-destructive" : ""}
        >
          <Mic data-icon="inline-start" />
          {listening ? "Listening…" : "Voice"}
        </Button>
        <Button
          type="button"
          size="xs"
          onClick={() => void run(value)}
          disabled={!value.trim() || pending}
          className="ml-auto"
        >
          {pending ? <LoaderCircle className="size-3 animate-spin" /> : <CornerDownLeft className="size-3" />}
          Run
        </Button>
      </div>
      </Command>
    </CommandDialog>
  );
}
