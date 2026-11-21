import mongoose from "mongoose";

const MeetingSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    date: { type: Date, default: Date.now },
    duration: { type: Number, default: 30 },
    participants: { type: [String], default: [] },
    consent: { type: Boolean, default: true },
    notes: { type: String, default: "" },
    decisions: { type: [String], default: [] },
    actions: {
      type: [
        {
          task: String,
          owner: String,
          due: String,
          confidence: Number,
          created: Boolean,
        },
      ],
      default: [],
    },
    recapSent: { type: Boolean, default: false },
    runId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Meeting ||
  mongoose.model("Meeting", MeetingSchema);
