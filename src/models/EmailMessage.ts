import mongoose from "mongoose";

const EmailMessageSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    from: { type: String, required: true },
    fromName: { type: String, required: true },
    to: { type: String, default: "me" },
    subject: { type: String, required: true },
    preview: { type: String, default: "" },
    body: { type: String, default: "" },
    category: { type: String, default: "Unsorted" },
    labels: { type: [String], default: [] },
    read: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    starred: { type: Boolean, default: false },
    draft: { type: String },
    draftStatus: { type: String, default: "none" },
    receivedAt: { type: Date, default: Date.now },
    external: { type: Boolean, default: false },
  },
  { timestamps: true }
);

EmailMessageSchema.index({ workspaceId: 1, archived: 1, receivedAt: -1 });

export default mongoose.models.EmailMessage ||
  mongoose.model("EmailMessage", EmailMessageSchema);
