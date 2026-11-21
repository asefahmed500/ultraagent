"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Bell, Brain, Plus, Save, Trash2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  createMemoryAction,
  deleteMemoryAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  updateMemoryAction,
} from "@/app/actions/workspace";
import { updateSettingsAction } from "@/app/actions/settings";
import { settingsSchema, type SettingsInput } from "@/lib/validations";
import { formatRelative } from "@/lib/format";
import type { MemoryItemDTO, NotificationDTO, UserDTO } from "@/lib/types";

export function SettingsClient({
  user,
  memory,
  notifications,
}: {
  user: UserDTO;
  memory: MemoryItemDTO[];
  notifications: NotificationDTO[];
}) {
  const router = useRouter();
  const [newMemory, setNewMemory] = useState({ subject: "", content: "", layer: "user_profile" });
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user.name ?? "",
      tone: user.tone ?? "concise and professional",
      timezone: user.timezone ?? "UTC",
      workStart: user.workingHours?.start ?? "09:00",
      workEnd: user.workingHours?.end ?? "17:00",
      autonomyLevel: user.autonomyLevel ?? "L1",
      locale: user.locale ?? "en",
    },
  });

  async function save(values: SettingsInput) {
    const result = await updateSettingsAction(values);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Settings saved");
      router.refresh();
    }
  }

  return (
    <Tabs defaultValue="profile" className="flex flex-col gap-6">
      <TabsList className="w-fit">
        <TabsTrigger value="profile"><UserRound data-icon="inline-start" /> Profile</TabsTrigger>
        <TabsTrigger value="memory"><Brain data-icon="inline-start" /> Memory</TabsTrigger>
        <TabsTrigger value="notifications"><Bell data-icon="inline-start" /> Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <form onSubmit={form.handleSubmit(save)} className="flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Profile &amp; preferences</CardTitle><CardDescription>Used to draft replies in your voice and respect your working hours.</CardDescription></CardHeader>
            <CardContent>
              <FieldGroup>
                <Field><FieldLabel htmlFor="set-name">Name</FieldLabel><Input id="set-name" {...form.register("name")} /></Field>
                <Field><FieldLabel htmlFor="set-tone">Writing tone</FieldLabel><Input id="set-tone" {...form.register("tone")} /></Field>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Field><FieldLabel htmlFor="set-tz">Timezone</FieldLabel><Input id="set-tz" {...form.register("timezone")} /></Field>
                  <Field><FieldLabel htmlFor="set-start">Work starts</FieldLabel><Input id="set-start" type="time" {...form.register("workStart")} /></Field>
                  <Field><FieldLabel htmlFor="set-end">Work ends</FieldLabel><Input id="set-end" type="time" {...form.register("workEnd")} /></Field>
                </div>
                <Controller
                  name="autonomyLevel"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="set-autonomy">Default autonomy</FieldLabel>
                      <Select value={field.value} onValueChange={(v) => field.onChange(v as SettingsInput["autonomyLevel"])}>
                        <SelectTrigger id="set-autonomy"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectGroup>
                          <SelectItem value="L0">L0 — Suggest only</SelectItem>
                          <SelectItem value="L1">L1 — Ask before external actions</SelectItem>
                          <SelectItem value="L2">L2 — Act within policy</SelectItem>
                          <SelectItem value="L3">L3 — Autopilot</SelectItem>
                        </SelectGroup></SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <Field><FieldLabel htmlFor="set-locale">Locale</FieldLabel><Input id="set-locale" {...form.register("locale")} /></Field>
              </FieldGroup>
            </CardContent>
          </Card>
          <Button type="submit" className="w-fit"><Save data-icon="inline-start" /> Save settings</Button>
        </form>
      </TabsContent>

      <TabsContent value="memory" className="flex flex-col gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Add a memory</CardTitle><CardDescription>Preferences, facts and past outcomes. Never secrets or restricted content.</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field><FieldLabel htmlFor="mem-subject">Subject</FieldLabel><Input id="mem-subject" value={newMemory.subject} onChange={(e) => setNewMemory({ ...newMemory, subject: e.target.value })} /></Field>
              <Field><FieldLabel htmlFor="mem-layer">Layer</FieldLabel>
                <select id="mem-layer" className="flex h-9 rounded-lg border bg-background px-3 text-sm" value={newMemory.layer} onChange={(e) => setNewMemory({ ...newMemory, layer: e.target.value })}>
                  <option value="user_profile">User profile</option><option value="episodic">Episodic</option><option value="org_knowledge">Org knowledge</option><option value="working">Working</option>
                </select>
              </Field>
            </div>
            <Textarea value={newMemory.content} onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })} placeholder="What should UltraAgent remember?" />
            <Button className="w-fit" disabled={!newMemory.subject || newMemory.content.length < 2} onClick={async () => {
              await createMemoryAction({ ...newMemory, pinned: false });
              toast.success("Memory saved");
              setNewMemory({ subject: "", content: "", layer: "user_profile" });
              router.refresh();
            }}><Plus data-icon="inline-start" /> Add memory</Button>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {memory.length === 0 ? <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No memories stored.</CardContent></Card> : null}
          {memory.map((item) => (
            <MemoryCard key={item.id} item={item} onChanged={() => router.refresh()} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="text-base">Notifications</CardTitle><CardDescription>Quiet by default — summarized, not one alert per step.</CardDescription></div>
            <Button size="sm" variant="outline" onClick={async () => { await markAllNotificationsReadAction(); toast.success("All marked as read"); router.refresh(); }}>Mark all read</Button>
          </CardHeader>
          <CardContent className="flex flex-col">
            {notifications.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No notifications.</p> : notifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 border-b py-4 last:border-0">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.read ? "bg-border" : "bg-foreground"}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2"><span className="text-sm font-medium">{notification.title}</span><Badge variant="outline" className="text-[10px]">{notification.kind}</Badge></div>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                  <span className="text-xs text-muted-foreground">{formatRelative(notification.createdAt)}</span>
                </div>
                {!notification.read ? <Button size="xs" variant="ghost" onClick={async () => { await markNotificationReadAction(notification.id); router.refresh(); }}>Mark read</Button> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function MemoryCard({ item, onChanged }: { item: MemoryItemDTO; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(item.subject);
  const [content, setContent] = useState(item.content);
  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm">{item.subject}</CardTitle>
          <Badge variant="outline" className="text-[10px]">{item.layer.replace(/_/g, " ")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {editing ? (
          <>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} />
          </>
        ) : (
          <p className="text-sm leading-7 text-muted-foreground">{item.content}</p>
        )}
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button size="xs" onClick={async () => { await updateMemoryAction(item.id, { subject, content, pinned: item.pinned }); setEditing(false); toast.success("Memory updated"); onChanged(); }}>Save</Button>
              <Button size="xs" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          ) : (
            <Button size="xs" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
          )}
          <Button size="xs" variant="ghost" onClick={async () => { await deleteMemoryAction(item.id); toast.success("Memory deleted"); onChanged(); }}><Trash2 data-icon="inline-start" /> Delete</Button>
          {item.pinned ? <Badge variant="secondary" className="ml-auto text-[10px]">pinned</Badge> : null}
        </div>
      </CardContent>
    </Card>
  );
}
