import mongoose from "mongoose";

const TriggerSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    source: { type: String, default: "schedule" },
    condition: { type: String, default: "" },
    schedule: { type: String },
    skill: { type: String, default: "general" },
    instruction: { type: String, required: true },
    params: { type: mongoose.Schema.Types.Mixed, default: {} },
    enabled: { type: Boolean, default: true },
    dryRun: { type: Boolean, default: false },
    lastRunAt: { type: Date },
    runCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Trigger ||
  mongoose.model("Trigger", TriggerSchema);
