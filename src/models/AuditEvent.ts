import mongoose from "mongoose";

const AuditEventSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    actor: { type: String, required: true },
    actorId: { type: String, required: true },
    action: { type: String, required: true, index: true },
    target: { type: String, required: true },
    targetId: { type: String, default: "" },
    result: { type: String, required: true },
    detail: { type: String, default: "" },
    hash: { type: String, required: true },
    previousHash: { type: String, default: "genesis" },
    runId: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AuditEventSchema.index({ workspaceId: 1, timestamp: -1 });

// Append-only enforcement.
AuditEventSchema.pre("findOneAndUpdate", function () {
  throw new Error("Audit events are immutable");
});
AuditEventSchema.pre("updateOne", function () {
  throw new Error("Audit events are immutable");
});
AuditEventSchema.pre("deleteOne", function () {
  throw new Error("Audit events are immutable");
});

export default mongoose.models.AuditEvent ||
  mongoose.model("AuditEvent", AuditEventSchema);
