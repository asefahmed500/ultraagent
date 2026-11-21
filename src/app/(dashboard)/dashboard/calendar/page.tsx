import { CalendarDays, Clock, MapPin, Video } from "lucide-react";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import CalendarEvent from "@/models/CalendarEvent";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { CommandTrigger } from "@/components/dashboard/command-trigger";
import { formatDate } from "@/lib/format";
import type { CalendarEventDTO } from "@/lib/types";

export default async function CalendarPage() {
  const session = await auth();
  await connectDB();
  const events = dtoList<CalendarEventDTO>(
    await CalendarEvent.find({
      workspaceId: session?.user?.workspaceId,
      ownerId: session?.user?.id,
    })
      .sort({ start: 1 })
      .lean()
  );

  const proposed = events.filter((event) => event.status === "proposed");
  const booked = events.filter((event) => event.status === "booked");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Calendar"
        description="Proposed slots and booked events. UltraAgent respects working hours, focus blocks and time zones."
      >
        <CommandTrigger>Schedule a meeting</CommandTrigger>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proposed</CardTitle>
            <CardDescription>Ranked slots awaiting your confirmation.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {proposed.length === 0 ? <Empty label="No proposed slots" /> : proposed.map((event) => <EventCard key={event.id} event={event} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booked</CardTitle>
            <CardDescription>Confirmed events with agenda and video links.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {booked.length === 0 ? <Empty label="No booked events" /> : booked.map((event) => <EventCard key={event.id} event={event} />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-muted-foreground">
      <CalendarDays className="size-6" /> {label}
    </div>
  );
}

function EventCard({ event }: { event: CalendarEventDTO }) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary text-[10px] font-medium uppercase">
          {start.toLocaleDateString("en-US", { month: "short" })}
          <span className="text-sm font-semibold">{start.getDate()}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{event.title}</span>
            {event.external ? <Badge variant="outline" className="text-[10px]">external</Badge> : null}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            <span className="mx-1">·</span> {formatDate(event.start)}
          </div>
        </div>
        <Badge variant={event.status === "booked" ? "secondary" : "outline"} className="capitalize">
          {event.status}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{event.agenda}</p>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Video className="size-3" /> {event.videoLink ? "Video link attached" : "No video link"}</span>
        {event.attendees.length > 0 ? <span>{event.attendees.join(", ")}</span> : null}
        {event.location ? <span className="flex items-center gap-1"><MapPin className="size-3" /> {event.location}</span> : null}
      </div>
    </div>
  );
}
