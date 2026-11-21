import mongoose from "mongoose";
import { stepSchema } from "@/models/schemas";

const RunSchema = new mongoose.Schema(
  {
    taskId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    skill: { type: String, required: true },
    instruction: { type: String, required: true },
    state: { type: String, default: "queued" },
    plan: { type: [stepSchema], default: [] },
    steps: { type: [stepSchema], default: [] },
    outcome: { type: String },
    summary: { type: String },
    cost: { type: Number, default: 0 },
    tokens: { type: Number, default: 0 },
    model: { type: String, default: "glm-4.5-air (simulated)" },
    startedAt: { type: Date },
    endedAt: { type: Date },
    approvalId: { type: String },
    undoAvailable: { type: Boolean, default: false },
    clarification: { type: String },
    clarificationChoices: { type: [String], default: [] },
    error: { type: String },
    latencyMs: { type: Number, default: 0 },
    retries: { type: Number, default: 0 },
    dryRun: { type: Boolean, default: false },
    modelRoute: { type: String, default: "small-fast" },
  },
  { timestamps: true }
);

RunSchema.index({ workspaceId: 1, createdAt: -1 });
RunSchema.index({ ownerId: 1, state: 1 });

export default mongoose.models.Run || mongoose.model("Run", RunSchema);
