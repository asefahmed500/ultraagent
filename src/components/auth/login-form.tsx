"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
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
import { loginSchema, type LoginInput } from "@/lib/validations";

const DEMO = { email: "demo@ultraagent.ai", password: "demo1234" };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [pending, setPending] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setPending(true);
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      toast.error("Could not sign in", {
        description: "Check your email and password, then try again.",
      });
      return;
    }
    toast.success("Welcome back to UltraAgent");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <Card className="border-border/80 shadow-lg shadow-foreground/5">
      <CardHeader className="gap-1.5">
        <CardTitle className="text-2xl tracking-tight">Welcome back</CardTitle>
        <CardDescription>Sign in to your UltraAgent workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <FieldGroup>
            <ControllerInput
              name="email"
              label="Email"
              placeholder="you@company.com"
              type="email"
              form={form}
            />
            <ControllerInput
              name="password"
              label="Password"
              placeholder="••••••••"
              type="password"
              form={form}
            />
          </FieldGroup>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
            {pending ? "Signing in…" : "Sign in"}
            {!pending ? <ArrowRight data-icon="inline-end" /> : null}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={() => {
              form.setValue("email", DEMO.email);
              form.setValue("password", DEMO.password);
              toast.info("Demo credentials filled — press Sign in");
            }}
          >
            Use demo account
          </Button>
          <FieldDescription className="text-center">
            New to UltraAgent? <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">Create a workspace</Link>
          </FieldDescription>
        </form>
      </CardContent>
    </Card>
  );
}

function ControllerInput({
  name,
  label,
  placeholder,
  type,
  form,
}: {
  name: "email" | "password";
  label: string;
  placeholder: string;
  type: string;
  form: UseFormReturn<LoginInput>;
}) {
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`login-${name}`}>{label}</FieldLabel>
          <Input
            {...field}
            id={`login-${name}`}
            type={type}
            placeholder={placeholder}
            autoComplete={name === "email" ? "email" : "current-password"}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
