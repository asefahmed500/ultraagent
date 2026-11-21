import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    image: { type: String },
    role: { type: String, default: "member" },
    workspaceId: { type: String, required: true, index: true },
    autonomyLevel: { type: String, default: "L1" },
    autonomyCeiling: { type: String, default: "L2" },
    onboardingComplete: { type: Boolean, default: false },
    firstGoal: { type: String, default: "all" },
    locale: { type: String, default: "en" },
    timezone: { type: String, default: "UTC" },
    workingHours: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "17:00" },
    },
    tone: { type: String, default: "concise and professional" },
    styleProfile: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
