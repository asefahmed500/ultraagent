"use client";

import { Command, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUI } from "@/components/store-provider";

export function CommandTrigger({
  children = "New task",
  variant = "default",
  size = "sm",
}: {
  children?: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  const setOpen = useUI((s) => s.setCommandBarOpen);
  return (
    <Button variant={variant} size={size} onClick={() => setOpen(true)}>
      <Command data-icon="inline-start" />
      {children}
    </Button>
  );
}

export function FloatingCommandButton() {
  const setOpen = useUI((s) => s.setCommandBarOpen);
  return (
    <Button
      size="icon"
      className="fixed bottom-6 right-6 size-12 rounded-full shadow-xl lg:hidden"
      onClick={() => setOpen(true)}
      aria-label="New task"
    >
      <Plus className="size-5" />
    </Button>
  );
}
