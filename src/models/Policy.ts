import mongoose from "mongoose";

const PolicySchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    scope: { type: String, default: "workspace" },
    name: { type: String, required: true },
    rule: { type: String, required: true },
    effect: { type: String, required: true },
    risk: { type: String, default: "all" },
    condition: { type: String, default: "" },
    threshold: { type: Number },
    enabled: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
    effectiveAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Policy || mongoose.model("Policy", PolicySchema);
