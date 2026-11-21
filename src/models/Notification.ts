import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    kind: { type: String, default: "info" },
    read: { type: Boolean, default: false },
    href: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
