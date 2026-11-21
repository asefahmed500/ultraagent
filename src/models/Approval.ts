import mongoose from "mongoose";

const ApprovalSchema = new mongoose.Schema(
  {
    runId: { type: String, required: true, index: true },
    stepId: { type: String, required: true },
    ownerId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    requestedFrom: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    risk: { type: String, default: "reversible_write" },
    action: { type: String, default: "" },
    tool: { type: String, default: "" },
    decision: { type: String, default: "pending" },
    channel: { type: String, default: "app" },
    decidedAt: { type: Date },
    decidedBy: { type: String },
    note: { type: String },
    editedInstruction: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

ApprovalSchema.index({ workspaceId: 1, decision: 1, createdAt: -1 });

export default mongoose.models.Approval ||
  mongoose.model("Approval", ApprovalSchema);
