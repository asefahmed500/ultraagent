import mongoose from "mongoose";

const WebhookEventSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    event: { type: String, required: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    delivered: { type: Boolean, default: true },
    attempts: { type: Number, default: 1 },
    signatureValid: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.WebhookEvent ||
  mongoose.model("WebhookEvent", WebhookEventSchema);
