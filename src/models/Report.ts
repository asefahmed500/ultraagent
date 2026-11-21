import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    period: { type: String, default: "" },
    sources: { type: [String], default: [] },
    notes: { type: String, default: "" },
    narrative: { type: String, default: "" },
    metrics: {
      type: [{ label: String, value: Number, delta: Number }],
      default: [],
    },
    chart: {
      type: [{ month: String, value: Number, target: Number }],
      default: [],
    },
    version: { type: Number, default: 1 },
    status: { type: String, default: "draft" },
    recipients: { type: [String], default: [] },
    staleInputs: { type: [String], default: [] },
    runId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Report || mongoose.model("Report", ReportSchema);
