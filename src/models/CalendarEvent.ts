import mongoose from "mongoose";

const CalendarEventSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    attendees: { type: [String], default: [] },
    agenda: { type: String, default: "" },
    videoLink: { type: String, default: "" },
    status: { type: String, default: "proposed" },
    external: { type: Boolean, default: false },
    location: { type: String },
    runId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.CalendarEvent ||
  mongoose.model("CalendarEvent", CalendarEventSchema);
