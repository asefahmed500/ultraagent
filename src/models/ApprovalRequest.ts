import mongoose from "mongoose";

const ApprovalRequestSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    type: { type: String, default: "request" },
    amount: { type: Number, default: 0 },
    category: { type: String, default: "General" },
    requester: { type: String, default: "" },
    approver: { type: String, required: true },
    justification: { type: String, default: "" },
    status: { type: String, default: "pending" },
    policyCheck: { type: String, default: "" },
    separationOfDuties: { type: Boolean, default: true },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.ApprovalRequest ||
  mongoose.model("ApprovalRequest", ApprovalRequestSchema);
