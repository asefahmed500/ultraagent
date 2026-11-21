"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signupAction } from "@/app/actions/auth";
import { signupSchema, type SignupInput } from "@/lib/validations";

const GOALS = [
  { value: "inbox", label: "Inbox — triage and replies" },
  { value: "calendar", label: "Calendar — scheduling" },
  { value: "reports", label: "Reports — weekly summaries" },
  { value: "all", label: "All of the above" },
];

const LEVELS = ["L0", "L1", "L2", "L3"] as const;

export function SignupForm() {
  const [pending, setPending] = useState(false);
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      workspace: "",
      firstGoal: "all",
      autonomyLevel: "L1",
    },
  });

  async function onSubmit(values: SignupInput) {
    setPending(true);
    try {
      const result = await signupAction(values);
      if (result?.error) {
        toast.error("Could not create workspace", { description: result.error });
      }
    } catch {
      toast.error("Could not create workspace", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="border-border/80 shadow-lg shadow-foreground/5">
      <CardHeader className="gap-1.5">
        <CardTitle className="text-2xl tracking-tight">Create your workspace</CardTitle>
        <CardDescription>One question to start: what should UltraAgent help with first?</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <FieldGroup>
            <TextField name="name" label="Your name" placeholder="Alex Morgan" form={form} />
            <TextField name="email" label="Work email" placeholder="you@company.com" type="email" form={form} />
            <TextField name="workspace" label="Workspace name" placeholder="Acme Operations" form={form} />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="password" label="Password" placeholder="At least 8 characters" type="password" form={form} />
              <TextField name="confirmPassword" label="Confirm password" placeholder="Repeat password" type="password" form={form} />
            </div>
            <Controller
              name="firstGoal"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-goal">Help me with first</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="signup-goal" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Choose a starting point" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {GOALS.map((goal) => (
                          <SelectItem key={goal.value} value={goal.value}>
                            {goal.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="autonomyLevel"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-autonomy">Default autonomy</FieldLabel>
                  <Select value={field.value} onValueChange={(v) => field.onChange(v as SignupInput["autonomyLevel"])}>
                    <SelectTrigger id="signup-autonomy" aria-invalid={fieldState.invalid}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level} — {level === "L0" ? "Suggest only" : level === "L1" ? "Ask before external actions" : level === "L2" ? "Act within policy" : "Autopilot (admin only)"}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>You can change this any time in Settings.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
            {pending ? "Creating workspace…" : "Create workspace"}
            {!pending ? <ArrowRight data-icon="inline-end" /> : null}
          </Button>
          <FieldDescription className="text-center">
            Already have an account? <Link href="/login" className="font-medium text-foreground underline underline-offset-4">Sign in</Link>
          </FieldDescription>
        </form>
      </CardContent>
    </Card>
  );
}

function TextField({
  name,
  label,
  placeholder,
  type = "text",
  form,
}: {
  name: "name" | "email" | "password" | "confirmPassword" | "workspace";
  label: string;
  placeholder: string;
  type?: string;
  form: UseFormReturn<SignupInput>;
}) {
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`signup-${name}`}>{label}</FieldLabel>
          <Input
            {...field}
            id={`signup-${name}`}
            type={type}
            placeholder={placeholder}
            autoComplete={
              name === "email" ? "email" : name.includes("password") ? "new-password" : "off"
            }
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
