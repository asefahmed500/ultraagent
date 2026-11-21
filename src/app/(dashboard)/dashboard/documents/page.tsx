import { FileText, Quote, ShieldAlert } from "lucide-react";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import Document from "@/models/Document";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/dashboard/page-header";
import { CommandTrigger } from "@/components/dashboard/command-trigger";
import type { DocumentDTO } from "@/lib/types";

export default async function DocumentsPage() {
  const session = await auth();
  await connectDB();
  const documents = dtoList<DocumentDTO>(
    await Document.find({
      workspaceId: session?.user?.workspaceId,
      ownerId: session?.user?.id,
    })
      .sort({ createdAt: -1 })
      .lean()
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Documents"
        description="Summaries with key points, risks, open questions and source citations. Retrieval is permission-aware."
      >
        <CommandTrigger>Summarize a document</CommandTrigger>
      </PageHeader>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-20 text-center text-sm text-muted-foreground">
            <FileText className="size-6" /> No summaries yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {documents.map((document) => (
            <Card key={document.id}>
              <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{document.title}</CardTitle>
                  <Badge variant={document.classification === "Confidential" ? "destructive" : "secondary"}>
                    {document.classification}
                  </Badge>
                </div>
                <CardDescription>{document.source}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <p className="text-sm leading-7">{document.summary}</p>
                <Section title="Key points" items={document.keyPoints} />
                <Section title="Risks" items={document.risks} icon={<ShieldAlert className="size-3.5 text-amber-600" />} />
                <Section title="Open questions" items={document.openQuestions} />
                {document.citations.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-medium text-muted-foreground">Source citations</div>
                    {document.citations.map((citation) => (
                      <div key={citation.section} className="rounded-lg border bg-muted/40 p-3 text-xs">
                        <div className="flex items-center gap-1.5 font-medium"><Quote className="size-3" /> {citation.section}</div>
                        <p className="mt-1.5 text-muted-foreground">{citation.excerpt}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                {document.sharedTo ? (
                  <>
                    <Separator />
                    <p className="text-xs text-muted-foreground">Shared to {document.sharedTo}</p>
                  </>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, items, icon }: { title: string; items: string[]; icon?: React.ReactNode }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{icon}{title}</div>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" /> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
