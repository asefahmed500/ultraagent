import Link from "next/link";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import Task from "@/models/Task";
import Run from "@/models/Run";
import SavedCommand from "@/models/SavedCommand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";
import { CommandTrigger } from "@/components/dashboard/command-trigger";
import { SavedCommands } from "@/components/dashboard/saved-commands";
import { formatRelative, truncate } from "@/lib/format";
import type { RunDTO, SavedCommandDTO } from "@/lib/types";

export default async function TasksPage() {
  const session = await auth();
  await connectDB();
  const workspaceId = session?.user?.workspaceId ?? "";
  const ownerId = session?.user?.id ?? "";

  const [tasks, runs, savedCommands] = await Promise.all([
    Task.find({ workspaceId, ownerId }).sort({ createdAt: -1 }).limit(100).lean(),
    Run.find({ workspaceId, ownerId }).sort({ createdAt: -1 }).limit(100).lean(),
    SavedCommand.find({ workspaceId, ownerId }).sort({ useCount: -1 }).lean(),
  ]);

  const runByTask = new Map(
    dtoList<RunDTO>(runs).map((run) => [run.taskId, run])
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Tasks"
        description="Every instruction you've given UltraAgent, with its run history."
      >
        <CommandTrigger />
      </PageHeader>

      <SavedCommands commands={dtoList<SavedCommandDTO>(savedCommands)} />

      <Card>
        <CardHeader>
          <CardTitle>Task history</CardTitle>
          <CardDescription>{tasks.length} tasks in this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No tasks yet. Use the command bar to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instruction</TableHead>
                    <TableHead>Skill</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const run = runByTask.get(String(task._id));
                    return (
                      <TableRow key={String(task._id)}>
                        <TableCell className="max-w-sm font-medium">
                          {truncate(String(task.instruction), 80)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{String(task.skill).replace(/-/g, " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{String(task.source)}</TableCell>
                        <TableCell>
                          <Badge variant={task.status === "completed" ? "secondary" : "outline"} className="capitalize">
                            {String(task.status).replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {run ? `${run.steps.filter((s) => s.status === "completed").length}/${run.steps.length}` : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatRelative(task.createdAt as Date)}
                        </TableCell>
                        <TableCell>
                          {run ? (
                            <Button variant="ghost" size="xs" asChild>
                              <Link href={`/dashboard/runs/${run.id}`}>Open</Link>
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
