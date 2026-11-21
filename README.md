# UltraAgent

A monolithic Next.js 16 application implementing the UltraAgent PRD — an AI agent that does the daily work of an office. It is designed around the product principle: **do the work, show the work, stay in control.**

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

**Demo account:** `demo@ultraagent.ai` / `demo1234`
Other seeded users: `admin@ultraagent.ai` (admin), `sam@company.com` (member), same password.

MongoDB must be running locally on `localhost:27017` (MongoDB Compass works). The database `ultraagent` is created automatically and seeded with workspaces, users, policies, connectors, triggers, memory, emails, events, documents, reports, meetings, approvals, runs and an audit chain.

Configuration lives in `.env.local` (see `.env.example`):

```
MONGODB_URI="mongodb://localhost:27017/ultraagent"
AUTH_SECRET="..."
ZAI_API_KEY=""   # stored only, not called
```

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript |
| UI | shadcn/ui (Radix/nova), Tailwind CSS v4, Inter via `next/font`, off-white theme |
| Forms | React Hook Form + Zod + `@hookform/resolvers/zod` + shadcn `Field` |
| State | Zustand with the App Router context-provider pattern |
| Database | MongoDB via Mongoose with cached connection and hot-reload guards |
| Auth | Auth.js v5, Credentials provider, JWT sessions, bcrypt, RBAC, `proxy.ts` route protection |
| Charts | Recharts-based shadcn chart primitives / lightweight CSS visualisations |
| Toasts | Sonner |

## What is implemented

### Product flows (PRD §7)
- **F1** — sign-up with workspace creation and onboarding question; editable autonomy level; connector scope disclosure.
- **F2** — global `⌘K` command bar: instruction → plan → policy check → streaming steps → result card → undo; one clarifying question with choices; saved commands and shortcuts.
- **F3** — inbox triage: classify, label, archive (never delete), draft replies in the user's voice, review/send.
- **F4** — scheduling: free/busy, ranked slots, event creation with agenda and video link, invite approval gate.
- **F5** — document summaries with key points, risks, open questions and section citations; permission-aware access.
- **F6** — weekly reports from named sources with metrics, chart, calculation notes, stale-input flags and versioning.
- **F7** — meeting notes with consent, decisions, action items, owners, confidence and tracker tasks.
- **F8** — approvals: policy limits, auto-approval, routing, separation of duties, one-tap decisions.
- **F9** — triggers and schedules with owner, dry-run, kill switch and run-now.
- **F10** — admin console: policies (versioned), roles, security settings, audit export, observability and billing.
- **F11** — failure and escalation: transient failure, retry with backoff, escalation and handoff signals.
- **F12** — undo with stored inverses and an immutable, hash-chained audit log.

### Core concepts (PRD §6, §9)
- Runs follow the state machine `queued → planning → executing → verifying → completed`, with `awaiting_approval`, `needs_input`, `retrying`, `failed`, `escalated`, `rejected` and `undone` branches.
- Planner selects a skill from the instruction and builds an ordered plan of typed tools (version, risk, scopes, idempotency key, inverse, rate limit).
- Policy engine evaluates declarative workspace rules plus an autonomy/risk matrix; prompt-injection text is flagged and gated.
- Autonomy levels L0–L3 with workspace ceilings; users may lower but not raise autonomy.
- Tool gateway applies idempotent effects to domain data and can compensate reversible writes.
- Memory layers (working, profile, episodic, org knowledge) with view/edit/delete.
- Model routing (small-fast, strong-planner, long-context) and cost/token tracking — local deterministic simulation.
- Signed webhook receiver and event log (`/api/v1/webhooks`).
- Observability metrics and an eval-suite view in the admin console.

### Data model (PRD §10)
`Workspace`, `User`, `Connector`, `Task`, `Run`, `Step`, `Approval`, `Policy`, `Trigger`, `MemoryItem`, `AuditEvent`, plus domain collections (`EmailMessage`, `CalendarEvent`, `Document`, `Report`, `Meeting`, `ApprovalRequest`, `SavedCommand`, `Notification`, `CustomSkill`, `WebhookEvent`).

### REST API (PRD §11)
```
POST /api/v1/tasks                       GET  /api/v1/tasks
GET  /api/v1/runs/:id                    GET  /api/v1/runs/:id/steps
POST /api/v1/runs/:id/advance            POST /api/v1/runs/:id/undo
GET  /api/v1/approvals                   POST /api/v1/approvals/:id/decision
GET  /api/v1/triggers                    POST /api/v1/triggers
GET  /api/v1/policies                    PUT  /api/v1/policies
GET  /api/v1/audit-events?format=csv     GET  /api/v1/connectors
POST /api/v1/connectors/:provider/authorize
GET  /api/v1/metrics                     GET  /api/v1/export
POST /api/v1/webhooks                    GET  /api/health
```

## Important scope note

The agent loop, skills and connectors are a **deterministic local simulation**. Authentication, persistence, validation, policy evaluation, audit, approvals, undo, RBAC and all UI are fully functional. No external Google/Microsoft APIs and no live model calls are made — `ZAI_API_KEY` is stored in `.env.local` only, as requested.

## Commands

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # production server
npm run lint     # eslint
npx tsc --noEmit # type check
```
