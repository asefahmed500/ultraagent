import mongoose from "mongoose";

const CustomSkillSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    instruction: { type: String, default: "" },
    risk: { type: String, default: "reversible_write" },
    tools: { type: [String], default: [] },
    version: { type: String, default: "1.0" },
    tests: {
      type: [
        { name: String, instruction: String, expected: String, passed: Boolean },
      ],
      default: [],
    },
    installed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.CustomSkill ||
  mongoose.model("CustomSkill", CustomSkillSchema);
