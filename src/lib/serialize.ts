import type {
  ApprovalDTO,
  AuditEventDTO,
  CalendarEventDTO,
  ConnectorDTO,
  DocumentDTO,
  MeetingDTO,
  MemoryItemDTO,
  NotificationDTO,
  PolicyDTO,
  ReportDTO,
  RunDTO,
  SavedCommandDTO,
  TaskDTO,
  TriggerDTO,
  UserDTO,
  WebhookEventDTO,
  WorkspaceDTO,
  EmailMessageDTO,
  ApprovalRequestDTO,
} from "@/lib/types";

/** Convert a Mongoose doc/lean object into a plain, JSON-safe DTO. */
export function dto<T extends object>(doc: unknown): T {
  const raw = JSON.parse(JSON.stringify(doc ?? {})) as Record<string, unknown>;
  const id = raw._id;
  delete raw._id;
  return {
    ...raw,
    id:
      typeof id === "string"
        ? id
        : id && typeof id === "object" && "toString" in id
          ? String(id)
          : "",
  } as unknown as T;
}

export function dtoList<T extends object>(docs: unknown[]): T[] {
  return docs.map((doc) => dto<T>(doc));
}

export const toUser = (d: unknown) => dto<UserDTO>(d);
export const toWorkspace = (d: unknown) => dto<WorkspaceDTO>(d);
export const toTask = (d: unknown) => dto<TaskDTO>(d);
export const toRun = (d: unknown) => dto<RunDTO>(d);
export const toApproval = (d: unknown) => dto<ApprovalDTO>(d);
export const toAudit = (d: unknown) => dto<AuditEventDTO>(d);
export const toConnector = (d: unknown) => dto<ConnectorDTO>(d);
export const toPolicy = (d: unknown) => dto<PolicyDTO>(d);
export const toTrigger = (d: unknown) => dto<TriggerDTO>(d);
export const toMemory = (d: unknown) => dto<MemoryItemDTO>(d);
export const toEmail = (d: unknown) => dto<EmailMessageDTO>(d);
export const toEvent = (d: unknown) => dto<CalendarEventDTO>(d);
export const toDocument = (d: unknown) => dto<DocumentDTO>(d);
export const toReport = (d: unknown) => dto<ReportDTO>(d);
export const toMeeting = (d: unknown) => dto<MeetingDTO>(d);
export const toApprovalRequest = (d: unknown) => dto<ApprovalRequestDTO>(d);
export const toSavedCommand = (d: unknown) => dto<SavedCommandDTO>(d);
export const toWebhookEvent = (d: unknown) => dto<WebhookEventDTO>(d);
export const toNotification = (d: unknown) => dto<NotificationDTO>(d);
