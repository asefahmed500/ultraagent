import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    instruction: { type: String, required: true },
    source: { type: String, default: "command" },
    status: { type: String, default: "queued" },
    skill: { type: String, default: "general" },
    runId: { type: String },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

TaskSchema.index({ workspaceId: 1, createdAt: -1 });

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
