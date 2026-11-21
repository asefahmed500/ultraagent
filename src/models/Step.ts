import mongoose from "mongoose";
import { stepSchema } from "@/models/schemas";

const stepPaths = { ...stepSchema.obj } as Record<string, unknown>;
delete stepPaths._id;

const StepSchema = new mongoose.Schema(
  {
    runId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    ...stepPaths,
  },
  { timestamps: true }
);

export default mongoose.models.Step || mongoose.model("Step", StepSchema);
