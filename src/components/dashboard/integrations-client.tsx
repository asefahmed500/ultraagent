"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Activity, Check, Plug, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { setConnectorAction } from "@/app/actions/workspace";
import { formatRelative } from "@/lib/format";
import type { ConnectorDTO } from "@/lib/types";

export function IntegrationsClient({
  connectors,
  canManage,
}: {
  connectors: ConnectorDTO[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [inspect, setInspect] = useState<ConnectorDTO | null>(null);

  async function toggle(connector: ConnectorDTO) {
    const connected = connector.status !== "connected";
    const result = await setConnectorAction(connector.provider, connected);
    if (result.error) toast.error(result.error);
    else {
      toast.success(connected ? `${connector.name} connected` : `${connector.name} disconnected`);
      router.refresh();
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {connectors.map((connector) => {
        const connected = connector.status === "connected";
        return (
          <Card key={connector.id}>
            <CardHeader className="gap-2">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary"><Plug className="size-5" /></span>
                <Badge variant={connected ? "secondary" : "outline"} className="gap-1.5">
                  <span className={`size-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                  {connector.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <CardTitle className="text-base">{connector.name}</CardTitle>
              <CardDescription>{connector.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-1.5">
                {connector.scopes.map((scope) => (
                  <Badge key={scope} variant="outline" className="font-mono text-[10px]">{scope}</Badge>
                ))}
              </div>
              {connected ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="size-3 text-emerald-600" /> Healthy · synced {formatRelative(connector.lastSync)}
                </div>
              ) : null}
              <div className="flex gap-2">
                <Button size="sm" variant={connected ? "outline" : "default"} className="flex-1" disabled={!canManage} onClick={() => toggle(connector)}>
                  {connected ? "Disconnect" : "Connect"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setInspect(connector)}>Scopes</Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={Boolean(inspect)} onOpenChange={() => setInspect(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{inspect?.name} — requested access</DialogTitle>
            <DialogDescription>Plain-language scopes shown before OAuth consent.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {inspect?.requestedScopes.map((scope) => (
              <div key={scope} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                <Shield className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-mono text-xs">{scope}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {scope.includes("write") || scope.includes("send")
                      ? "Allows UltraAgent to create or change data. High-risk steps still need approval."
                      : "Read-only access within your permissions."}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Check className="size-3.5 text-emerald-600" /> Tokens are stored in a vault reference, never in prompts or logs.</div>
          <DialogFooter><Button onClick={() => setInspect(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
