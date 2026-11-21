import mongoose from "mongoose";

const MemoryItemSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    layer: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    sourceRun: { type: String },
    expiresAt: { type: Date },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.MemoryItem ||
  mongoose.model("MemoryItem", MemoryItemSchema);
