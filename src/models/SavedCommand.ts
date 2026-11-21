import mongoose from "mongoose";

const SavedCommandSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    label: { type: String, required: true },
    instruction: { type: String, required: true },
    shortcut: { type: String, default: "" },
    useCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.SavedCommand ||
  mongoose.model("SavedCommand", SavedCommandSchema);
