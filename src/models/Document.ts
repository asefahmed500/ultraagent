import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    source: { type: String, default: "" },
    summary: { type: String, default: "" },
    keyPoints: { type: [String], default: [] },
    risks: { type: [String], default: [] },
    openQuestions: { type: [String], default: [] },
    citations: {
      type: [{ section: String, excerpt: String }],
      default: [],
    },
    classification: { type: String, default: "Internal" },
    sharedTo: { type: String },
    runId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Document ||
  mongoose.model("Document", DocumentSchema);
