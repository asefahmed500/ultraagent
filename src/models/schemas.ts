import mongoose from "mongoose";

/** A single typed action inside a Run. Mirrors the PRD's Step entity. */
export const stepSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    title: { type: String, required: true },
    detail: { type: String, default: "" },
    skill: { type: String, required: true },
    tool: { type: String, required: true },
    app: { type: String, default: "UltraAgent" },
    risk: { type: String, required: true },
    scopes: { type: [String], default: [] },
    idempotencyKey: { type: String, required: true },
    inverse: { type: String, default: "" },
    requiresApproval: { type: Boolean, default: false },
    policyReason: { type: String, default: "" },
    status: { type: String, default: "pending" },
    output: { type: String },
    changes: { type: [String], default: [] },
    error: { type: String },
    attempts: { type: Number, default: 0 },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { _id: true }
);
