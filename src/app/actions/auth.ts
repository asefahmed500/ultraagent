"use server";

import { signIn } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import { signupSchema } from "@/lib/validations";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import { slugify } from "@/lib/format";

export async function signupAction(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  workspace: string;
  firstGoal: string;
  autonomyLevel: "L0" | "L1" | "L2" | "L3";
}) {
  const parsed = signupSchema.parse(input);
  await connectDB();

  const existing = await User.findOne({ email: parsed.email.toLowerCase() });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(parsed.password);
  const workspace = await Workspace.create({
    name: parsed.workspace,
    slug: `${slugify(parsed.workspace)}-${Date.now().toString(36)}`,
    plan: "Starter",
    region: "us-east",
    ownerId: "pending",
    autonomyCeiling: "L2",
    dataRetentionDays: 365,
    monthlyActionLimit: 500,
  });

  await User.create({
    name: parsed.name,
    email: parsed.email.toLowerCase(),
    passwordHash,
    role: "owner",
    workspaceId: String(workspace._id),
    autonomyLevel: parsed.autonomyLevel,
    autonomyCeiling: "L2",
    onboardingComplete: true,
    firstGoal: parsed.firstGoal,
  });

  workspace.ownerId = String((await User.findOne({ email: parsed.email.toLowerCase() }))._id);
  await workspace.save();

  await signIn("credentials", {
    email: parsed.email.toLowerCase(),
    password: parsed.password,
    redirectTo: "/dashboard",
  });

  return { error: null };
}
