import mongoose from "mongoose";

const ConnectorSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    scopes: { type: [String], default: [] },
    requestedScopes: { type: [String], default: [] },
    status: { type: String, default: "disconnected" },
    health: { type: String, default: "healthy" },
    category: { type: String, default: "productivity" },
    icon: { type: String, default: "plug" },
    account: { type: String },
    lastSync: { type: Date },
    tokenRef: { type: String, default: "" },
  },
  { timestamps: true }
);

ConnectorSchema.index({ workspaceId: 1, provider: 1 }, { unique: true });

export default mongoose.models.Connector ||
  mongoose.model("Connector", ConnectorSchema);
