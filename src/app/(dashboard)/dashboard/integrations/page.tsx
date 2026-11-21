import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import Connector from "@/models/Connector";
import { PageHeader } from "@/components/dashboard/page-header";
import { IntegrationsClient } from "@/components/dashboard/integrations-client";
import type { ConnectorDTO } from "@/lib/types";

export default async function IntegrationsPage() {
  const session = await auth();
  await connectDB();
  const connectors = dtoList<ConnectorDTO>(
    await Connector.find({ workspaceId: session?.user?.workspaceId }).sort({ name: 1 }).lean()
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Integrations"
        description="Connect the apps your team already uses. Requested scopes are shown in plain language before consent."
      />
      <IntegrationsClient
        connectors={connectors}
        canManage={["owner", "admin"].includes(session?.user?.role ?? "member")}
      />
    </div>
  );
}
