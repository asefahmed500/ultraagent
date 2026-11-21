import mongoose from "mongoose";

const WorkspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    plan: { type: String, default: "Starter" },
    region: { type: String, default: "us-east" },
    ownerId: { type: String, required: true, index: true },
    autonomyCeiling: { type: String, default: "L1" },
    dataRetentionDays: { type: Number, default: 365 },
    monthlyActionLimit: { type: Number, default: 500 },
    actionsUsedThisMonth: { type: Number, default: 0 },
    policySetId: { type: String, default: "default" },
    settings: {
      allowExternalMail: { type: Boolean, default: false },
      requireConsentForMeetings: { type: Boolean, default: true },
      promptInjectionDefence: { type: Boolean, default: true },
      sandboxExecution: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Workspace ||
  mongoose.model("Workspace", WorkspaceSchema);
