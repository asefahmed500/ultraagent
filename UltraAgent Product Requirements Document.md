# UltraAgent: Product Requirements Document

Version 0.1 (draft) · 21 November 2026 · Status: for review

Note: UltraAgent is described here from the product brief (an agent that does daily office work). Numbers marked (target) are proposed starting points to validate, not measurements.

## 1. Summary

UltraAgent is a SaaS AI agent that does the daily work of an office: email, calendar, documents, reports, meeting notes and approvals, across the tools a team already uses. A user gives a plain-language instruction in a command bar, or sets a trigger or policy. UltraAgent plans the work, acts inside connected apps within the user's permissions, shows exactly what it did, and asks for approval when the risk is high.

Product principle: do the work, show the work, stay in control.

## 2. Problem and opportunity

- Office workers lose a large share of the week to small repeatable tasks: replying, scheduling, summarizing, reporting, chasing approvals.
- Existing automation tools need setup by technical staff; chat assistants answer questions but do not reliably act inside company systems.
- Teams want delegation they can trust: clear permissions, an audit trail, and an undo.
- Opportunity: an agent that works across apps, learns team conventions, and is safe enough for an IT admin to approve.

## 3. Goals, non-goals and success metrics

### Goals

1. Complete common office tasks from one instruction, end to end, with no manual steps in the happy path.
2. Earn trust: every action is visible, attributable, reversible where possible, and governed by policy.
3. Be fast to adopt: a new user gets a first useful result in under 10 minutes.
4. Be enterprise ready: SSO, role-based access, audit, data controls.

### Non-goals (v1)

- Replacing the underlying apps (mail, calendar, drive). UltraAgent works through them.
- Fully autonomous operation without any human review for high-risk actions.
- Voice-first or mobile-first experiences (web and desktop first; mobile companion later).
- Custom model training per customer.

### Success metrics

| Metric | Definition | Target |
| --- | --- | --- |
| Time to first value | Sign-up to first completed task | under 10 min |
| Task success rate | Runs completed without user correction | 85% at launch, 92% at v1 (target) |
| Approval acceptance | Proposed actions approved unchanged | above 80% |
| Weekly active tasks per user | Completed runs per active user per week | 15+ |
| Hours saved | Self-reported plus estimated from task types | 5+ per user per week (target) |
| Trust incidents | Unintended actions per 10,000 runs | under 1 |
| p50 run latency (simple task) | Instruction to result | under 20 s |
| 90-day retention (teams) | Teams active in month 3 | above 70% |

## 4. Users and personas

| Persona | Role | Needs | UltraAgent value |
| --- | --- | --- | --- |
| Maya | Operations lead / executive assistant | Inbox, calendars, approvals for several people | Delegates routine work, sets rules, reviews a daily digest |
| Sam | Individual contributor | Fewer admin chores, quick summaries | Command bar for reports, notes, scheduling |
| Dev | Team manager | Visibility, consistent process | Team playbooks, approval policies, weekly reports |
| Priya | IT / security admin | Control, compliance, least privilege | Connector scopes, policy engine, audit log, SSO |
| Leo | Executive | Short briefings, decisions only | Daily brief, one-tap approvals |

## 5. Scope and release plan

| Release | Scope |
| --- | --- |
| MVP (private beta) | Command bar; email triage and drafting; calendar scheduling; document summaries; approvals inbox; two connector suites (Google Workspace, Microsoft 365); audit log; autonomy levels L0 to L2 |
| v1 (public launch) | Weekly reports and spreadsheets; meeting notes and action items; expense and request approvals; Slack or Teams; triggers and schedules; team policies; SSO and roles; admin console |
| v2 | Custom skills builder; CRM and ticketing connectors; org knowledge search; multi-step workflows with branching; mobile companion; marketplace of skills |

## 6. Core concepts

| Term | Meaning |
| --- | --- |
| Task | A user goal expressed in natural language or created by a trigger |
| Run | One execution attempt of a task, with a plan, steps and result |
| Step | A single action or reasoning unit inside a run |
| Skill | A reusable capability (for example Inbox triage) with its own prompts, tools and checks |
| Connector | An authorized link to an external app that exposes tools |
| Tool | A typed function the agent can call (for example calendar.create\_event) |
| Policy | A rule that allows, blocks, or requires approval for an action |
| Approval | A human decision requested by the agent before an action |
| Memory | Stored preferences, facts and past outcomes used to improve results |
| Autonomy level | How much the agent may do without asking (section 9.6) |

## 7. User flows

### F1. Sign-up, workspace setup and connections

1. User signs up with email or SSO and creates or joins a workspace.
2. Onboarding asks one question: what should UltraAgent help with first (inbox, calendar, reports, all).
3. User connects an app. The connector screen shows requested scopes in plain language before the OAuth consent screen.
4. UltraAgent runs a read-only first pass (for example, summarizes the last week of mail) so value appears before any write permission is granted.
5. User picks a default autonomy level (default L1: ask before sending or changing anything).

Edge cases: OAuth denied (explain what is lost, continue with other connectors); admin consent required (send request to admin); expired token (prompt re-auth, queue pending work).

### F2. Command bar request (the universal flow)

1. User types an instruction, for example Sort my inbox and reply to Dana.
2. UltraAgent shows a short plan with the steps it will take and the apps involved.
3. Policy check: each step is classified read, reversible write, or irreversible or external action.
4. Execution streams progress step by step (Read, Label, Draft).
5. Result card shows what changed, with links, a diff where relevant, and an Undo option.
6. Low-risk work completes automatically; high-risk steps pause for approval.
7. User can reply with a correction; UltraAgent stores the preference if the user confirms.

Success: the user sees a completed result with a full record. Edge cases: ambiguous request (one clarifying question maximum, offering choices), missing connector (offer to connect), conflicting instruction (explain and ask).

### F3. Inbox triage and replies

Trigger: command, schedule (for example 8:00 daily) or new-mail event. Flow: read new mail, classify (Finance, Calendar, HR, Legal, Newsletter), apply labels, archive low-value mail, draft replies in the user's voice, queue drafts for review, summarize in a digest. Controls: never send external mail at L1 without approval; never delete, only archive; show the draft with the original thread.

### F4. Scheduling

Flow: parse request (attendees, duration, window), read free and busy for the user and attendees, propose or book a slot, create the event with agenda and video link, send invites, notify on conflict. Rules: respect working hours, focus blocks and time zones; external invites need approval at L1; offer three options if no perfect slot exists.

### F5. Document summary

Flow: locate document by name or link, read within the user's access, produce a summary with key points, risks and open questions, cite sections, optionally share to a channel. Controls: summaries never include content the requester cannot access; show source sections.

### F6. Weekly report

Flow: collect data from named sources (sheets, tracker, CRM), compute metrics, build a chart and narrative, save to a doc or sheet, send to a distribution list after approval. Controls: show data sources and calculation notes; flag missing or stale inputs; reports are versioned.

### F7. Meeting notes and actions

Flow: join or ingest a recording or transcript (with consent), produce notes, extract decisions and action items with owners and dates, create tasks in the tracker, send recap. Controls: recording consent banner; owners confirmed when confidence is low.

### F8. Approvals (requests and expenses)

Flow: request arrives (form, mail or chat), UltraAgent checks policy (limit, category, budget), auto-approves within policy at the allowed level, routes the rest to the right manager with a one-line summary, notifies the requester. Controls: dollar limits, separation of duties (agent never approves its own request chain), full audit.

### F9. Triggers and recurring work

User or admin defines: when X happens (event, time, condition), do Y (a skill with parameters). Examples: every Friday build the weekly report; when a vendor invoice arrives, extract fields and route for approval. Each trigger has an owner, a dry-run mode and an on and off switch.

### F10. Admin policy and governance

Admin opens the console: manage connectors and scopes, set org-wide autonomy ceilings, define approval rules, review audit logs, set data retention, manage roles, export logs. Changes are versioned and take effect with a clear effective time.

### F11. Failure and escalation

When a step fails: retry with backoff if transient; try an alternative tool if available; otherwise stop, keep completed work, explain in one sentence what failed, and offer Retry, Edit plan or Hand off to me. Never leave a half-done change without saying so.

### F12. Undo and audit

Every write action stores an inverse where possible (unlabel, delete draft, cancel event). Undo is available on the result card and in the audit log. Irreversible actions (sent mail) are marked and require approval at L0 to L2.

### Screen map

| Screen | Purpose |
| --- | --- |
| Command bar (global) | Instruct, see plan, approve, undo |
| Home | Daily brief, pending approvals, recent runs |
| Inbox | Triaged mail, drafts to review |
| Calendar | Proposed and booked events |
| Documents | Summaries and shared outputs |
| Reports | Generated reports and schedules |
| Meetings | Notes, actions, recaps |
| Approvals | Queue with one-tap decide |
| Integrations | Connectors and scopes |
| Activity | Audit trail of every step |
| Admin | Policies, roles, security, billing |

## 8. Functional requirements

Priority: P0 required for MVP, P1 required for v1, P2 later.

| ID | Requirement | Priority |
| --- | --- | --- |
| CMD-1 | Command bar accepts natural language and returns a plan before acting (unless L3 for that skill) | P0 |
| CMD-2 | Streaming progress with step names and statuses | P0 |
| CMD-3 | Result card with changes, links, undo | P0 |
| CMD-4 | Clarifying question limited to one per run, with choices | P0 |
| CMD-5 | Saved commands and shortcuts | P1 |
| EML-1 | Read, classify and label mail | P0 |
| EML-2 | Draft replies using user style profile | P0 |
| EML-3 | Send with approval; archive but never delete | P0 |
| EML-4 | Daily digest of triage results | P1 |
| CAL-1 | Read free and busy for user and internal attendees | P0 |
| CAL-2 | Create and update events with agenda and link | P0 |
| CAL-3 | Resolve conflicts with ranked options | P1 |
| DOC-1 | Summarize documents the user can access | P0 |
| DOC-2 | Cite source sections in summaries | P0 |
| RPT-1 | Build report from sheets and trackers with charts | P1 |
| RPT-2 | Scheduled and versioned reports | P1 |
| MTG-1 | Notes and action items from transcript | P1 |
| MTG-2 | Create tasks from actions in the tracker | P1 |
| APR-1 | Policy-based auto-approval within limits | P1 |
| APR-2 | Routing to correct approver with summary | P0 |
| APR-3 | One-tap approve or reject from email, chat or app | P1 |
| INT-1 | Connector framework with OAuth, scopes and health checks | P0 |
| INT-2 | Google Workspace and Microsoft 365 | P0 |
| INT-3 | Slack or Teams | P1 |
| INT-4 | CRM, ticketing, finance connectors | P2 |
| AUT-1 | Autonomy levels L0 to L3 per user and per skill | P0 |
| AUT-2 | Triggers and schedules with dry run | P1 |
| AUD-1 | Immutable audit log of every step and tool call | P0 |
| AUD-2 | Export and retention controls | P1 |
| SEC-1 | SSO (SAML, OIDC) and SCIM | P1 |
| SEC-2 | Role-based access and least-privilege scopes | P0 |
| MEM-1 | User preferences and style memory with view, edit, delete | P0 |
| MEM-2 | Org knowledge search with permission-aware retrieval | P2 |
| ADM-1 | Admin console for policy, connectors, logs | P1 |
| SKL-1 | Custom skills builder with testing | P2 |

## 9. Agentic infrastructure

### 9.1 Architecture

```
Clients: web app · desktop · command bar · email and chat actions
            |
        API gateway (auth, rate limits, tenant routing)
            |
   Orchestrator  <->  Planner  <->  Policy engine
            |                         |
     Skill agents (inbox, calendar,   Risk classifier
     docs, reports, meetings,         Approval service
     approvals)                       |
            |                      Human in the loop
      Tool gateway (typed tools, retries, idempotency)
            |
   Connectors: Google · Microsoft · Slack/Teams · Drive · CRM

Shared services: memory store · vector index · model router
                 job queue and scheduler · secrets vault
                 audit log · observability and evals
```

### 9.2 Agent loop

1. Understand: parse intent, resolve people, files and dates using memory and connectors.
2. Plan: produce an ordered list of steps with tools, inputs and expected outputs.
3. Check policy: classify each step by risk, apply org and user rules, mark approval points.
4. Act: execute steps through the tool gateway with idempotency keys.
5. Verify: confirm the outcome (read back the event, label, draft); compare with the plan.
6. Report: summarize results, store a trace, offer undo, update memory if the user confirms.

The loop runs as a durable workflow so a run survives restarts and long waits for approval.

### 9.3 Components

| Component | Responsibility |
| --- | --- |
| API gateway | Authentication, tenant isolation, rate limits, request signing |
| Orchestrator | Owns the run state machine, schedules steps, handles pause and resume |
| Planner | Turns intent into a plan; replans on failure or new information |
| Skill agents | Specialists with focused prompts, tool subsets and domain checks |
| Tool gateway | Single entry for all tool calls: validation, retries, timeouts, idempotency, logging |
| Connectors | OAuth, token refresh, scope enforcement, vendor API adapters |
| Policy engine | Evaluates rules per step; outputs allow, deny or require approval |
| Approval service | Creates, delivers and records human decisions across channels |
| Memory service | Preferences, style, facts, episodic outcomes; permission-aware retrieval |
| Model router | Chooses model by task type, cost and latency; fallback chain |
| Scheduler and queue | Triggers, recurring jobs, retries, back pressure |
| Audit and observability | Immutable event log, traces, metrics, replay |
| Eval service | Offline and online quality tests, regression gates |

### 9.4 Run state machine

```
queued -> planning -> awaiting_approval -> executing -> verifying -> completed
             |               |                 |            |
             v               v                 v            v
          needs_input     rejected          failed -> retrying -> executing
                                               |
                                          escalated (human handoff)
```

Rules: every transition is logged; awaiting\_approval has a timeout and reminder; failed runs always keep a list of completed steps and their inverses.

### 9.5 Tool and connector layer

Tools are typed, versioned and described so the planner can choose them. Example definition:

```
tool: calendar.create_event
version: 1.2
risk: reversible_write
scopes: calendar.events.write
inputs: title, start, end, attendees[], description, video_link?
outputs: event_id, url
idempotency_key: hash(user, title, start, attendees)
inverse: calendar.cancel_event(event_id)
limits: 30 calls per minute per user
```

Requirements: strict schema validation on inputs and outputs; per-tool timeouts and retry policy; dry-run mode that returns what would change; every tool declares risk class and inverse. The tool layer follows the Model Context Protocol pattern so new connectors can be added as servers without changing the orchestrator.

### 9.6 Autonomy levels

| Level | Behavior | Default for |
| --- | --- | --- |
| L0 Suggest | Plans and drafts only; user executes | New workspaces, regulated teams |
| L1 Ask | Acts on reads and safe writes; asks before external or irreversible actions | Default |
| L2 Act within policy | Executes anything allowed by policy; asks only on exceptions | Trusted skills and users |
| L3 Autopilot | Runs scheduled and triggered work without prompts, with digest and undo | Admin-enabled skills only |

Admins set a ceiling per role and per skill; users may lower but not raise above it.

### 9.7 Policy engine and permissions

- Identity: the agent acts as the user (delegated OAuth) and never has broader access than the user.
- Risk classes: read, reversible write, external communication, irreversible or financial.
- Rules are declarative and evaluated per step. Examples: external mail needs approval unless the recipient is in the allowlist; payments above a limit need a named approver; no actions on documents labeled Confidential unless an admin enables it.
- Separation of duties: the agent cannot approve a request it created or routed on behalf of the same user.
- Prompt-injection defence: content from mail, files and web is treated as untrusted data; it cannot change policy, add tools or alter the plan without user confirmation; instructions found in data are flagged.
- Every denied or escalated step is explained in plain language.

### 9.8 Memory

| Layer | Contents | Retention |
| --- | --- | --- |
| Working | Current run context | Run lifetime |
| User profile | Preferences, tone, working hours, contacts | Until edited or deleted |
| Episodic | Past runs and outcomes, corrections | Configurable (default 90 days) |
| Org knowledge | Playbooks, policies, templates, indexed docs | Per admin, permission-aware |

Users can see, edit and delete memory. Memory never stores secrets or content from restricted sources. Retrieval filters by the requester's access at query time.

### 9.9 Triggers and scheduling

Sources: time schedules, connector webhooks (new mail, new event, form submitted), manual runs, and rules based on conditions. Each trigger records its owner, runs as that owner, supports dry run, and has rate limits and a kill switch. Back pressure and per-tenant fair queuing protect shared capacity.

### 9.10 Model routing and cost control

- Router picks a model per step: small fast model for classification and extraction, stronger model for planning, long-context model for documents.
- Fallback chain on error or timeout; deterministic code for anything that does not need a model (date math, formatting, calculations).
- Budgets: per-run token and tool-call caps; per-tenant spend limits with alerts.
- Caching of repeated reads and prompts where safe.

### 9.11 Reliability

- Idempotency keys on every write; at-least-once delivery with deduplication.
- Retries with exponential backoff and jitter; circuit breakers per connector.
- Saga pattern: if a later step fails, run inverses for reversible earlier steps or ask the user.
- Long waits (approvals) are durable timers, not open connections.
- Rate-limit awareness for each vendor API.

### 9.12 Observability and evaluation

- Trace for every run: plan, prompts (redacted), tool calls, policy decisions, timings, cost.
- Dashboards: success rate, correction rate, latency, cost per run, approval acceptance, incidents.
- Eval suite: golden tasks per skill (inbox, calendar, docs, reports, meetings, approvals) with graded outcomes; adversarial set for prompt injection and permission escapes; regression gate before any prompt, model or tool change ships.
- Online evals: sampled runs reviewed by humans; user thumbs and edits feed the quality set.

### 9.13 Multi-agent design

One orchestrator agent owns the run and delegates to skill agents. Skill agents have narrow tool access and cannot call each other directly; hand-offs go through the orchestrator, which keeps one audit trail and one policy decision point.

### 9.14 Sandboxed execution

File processing, spreadsheet calculations and document generation run in isolated, ephemeral sandboxes with no network access by default, resource limits, and no access to secrets. Outputs are scanned before being written back.

## 10. Data model (core entities)

| Entity | Key fields |
| --- | --- |
| Workspace | id, name, plan, region, policy\_set\_id |
| User | id, workspace\_id, role, autonomy\_ceiling, preferences |
| Connector | id, workspace\_id, provider, scopes, status, token\_ref |
| Task | id, owner\_id, source (command, trigger), instruction, created\_at |
| Run | id, task\_id, state, plan, started\_at, ended\_at, cost, outcome |
| Step | id, run\_id, skill, tool, input\_ref, output\_ref, risk, status, inverse\_ref |
| Approval | id, run\_id, step\_id, requested\_from, decision, decided\_at, channel |
| Policy | id, scope, rule, effect, version, effective\_at |
| Trigger | id, owner\_id, source, condition, skill, params, enabled |
| MemoryItem | id, layer, subject, content\_ref, source\_run, expires\_at |
| AuditEvent | id, actor, action, target, result, timestamp, hash\_chain |

## 11. API and events

REST (all tenant-scoped, OAuth2 bearer):

- POST /v1/tasks (create a task from an instruction)
- GET /v1/runs/{id} and GET /v1/runs/{id}/steps
- POST /v1/approvals/{id}/decision (approve, reject, edit)
- POST /v1/runs/{id}/undo
- GET and POST /v1/triggers
- GET and PUT /v1/policies
- GET /v1/audit-events (filters: actor, action, date)
- GET /v1/connectors and POST /v1/connectors/{provider}/authorize

Webhook events: run.started, run.step.completed, run.awaiting\_approval, run.completed, run.failed, approval.decided, policy.updated, connector.health\_changed. Events are signed, retried and replayable.

## 12. Security, privacy and compliance

- Authentication: SSO (SAML, OIDC), MFA, SCIM provisioning.
- Authorization: role-based plus scope-based; least privilege per connector; admin consent flows.
- Data protection: encryption in transit and at rest; per-tenant keys (enterprise); secrets in a vault, never in prompts or logs.
- Isolation: tenant-scoped storage, queues and vector indexes; no cross-tenant training or retrieval.
- Model data: customer content is not used to train shared models; zero-retention options with model providers where available.
- Audit: append-only, hash-chained log; export to customer SIEM.
- Privacy: data minimization, regional hosting, retention controls, user data export and deletion, consent for recordings.
- Compliance roadmap: SOC 2 Type II, ISO 27001, GDPR readiness, DPA and subprocessor list; HIPAA as an option later.
- Abuse and safety: output filters, rate limits, anomaly detection on unusual action patterns.

## 13. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Availability | 99.9% monthly for core API (target) |
| Latency | p50 under 20 s and p95 under 60 s for simple runs; first progress event under 2 s |
| Scale | 10,000 concurrent runs per region at launch design (target) |
| Durability | No lost approvals or audit events; recovery point under 1 minute |
| Accessibility | WCAG 2.2 AA for all UI; full keyboard control of the command bar |
| Localization | English at launch; multi-language drafts and UI later |
| Browser support | Current and previous major versions of Chrome, Edge, Safari, Firefox |

## 14. UX principles

1. Plan first, act second: show intent before changes.
2. Progress you can read: named steps, not spinners.
3. Always a way back: Undo and Activity are one click away.
4. Ask rarely, ask well: at most one question, with choices.
5. Quiet by default: summarize into a daily brief instead of notifying on every step.
6. Same interface everywhere: the command bar is the one consistent control; results appear in context.

## 15. Packaging and pricing (proposal, to validate)

| Plan | For | Includes |
| --- | --- | --- |
| Starter | Individuals and small teams | Command bar, inbox, calendar, document summaries, L0 to L1, monthly action allowance |
| Team | Departments | All skills, triggers, shared policies, Slack or Teams, higher allowance |
| Enterprise | Organizations | SSO and SCIM, custom policies, audit export, regional hosting, dedicated support, custom connectors |

Usage is measured in agent actions with transparent per-run cost shown in Activity.

## 16. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Agent takes a wrong external action | Trust loss | Approval at L1, dry run, undo, policy limits, verification step |
| Prompt injection through mail or files | Data leak or misuse | Untrusted-data handling, no tool or policy changes from content, adversarial evals |
| Connector API limits or changes | Failures | Circuit breakers, health checks, versioned adapters, fallbacks |
| Model quality drift | Lower success rate | Regression gates, model routing with fallbacks, online evals |
| Cost overruns | Margin pressure | Budgets per run and tenant, caching, small-model routing |
| Admin distrust | Slow sales | Strong audit, scope transparency, ceilings, SOC 2 roadmap |
| Low adoption | Weak retention | First-value read-only pass, daily brief, templates per role |

## 17. Milestones

| Phase | Window (target) | Outcome |
| --- | --- | --- |
| Discovery and design | Weeks 1 to 4 | Personas validated, flows prototyped, policy model agreed |
| Platform foundation | Weeks 3 to 10 | Orchestrator, tool gateway, connectors (Google, Microsoft), audit log |
| MVP skills | Weeks 8 to 16 | Inbox, calendar, documents, approvals; command bar; L0 to L2 |
| Private beta | Weeks 16 to 24 | 20 to 50 teams, eval suite, security review |
| v1 launch | Weeks 24 to 36 | Reports, meetings, triggers, admin console, SSO, Slack or Teams |
| v2 | After launch | Skills builder, CRM and ticketing, org knowledge, mobile |

## 18. Open questions

1. Which suite leads at launch: Google Workspace or Microsoft 365?
2. What is the default autonomy level for enterprise tenants, L0 or L1?
3. Do we host models ourselves for any regulated customers, or rely on provider zero-retention terms?
4. Pricing unit: per seat, per action, or hybrid?
5. Which approval channels ship first: email, Slack, Teams, mobile push?
6. How much of the style profile should be shared at team level versus kept private?
7. What counts as a billable action when a run is retried or undone?

## 19. Glossary

Agent loop: repeated cycle of understand, plan, act, verify. Connector: authorized link to an external app. Idempotency key: identifier that makes a repeated request safe. MCP: Model Context Protocol, an open pattern for exposing tools to agents. Saga: a sequence of steps with compensating actions if a later step fails. Skill: reusable agent capability for a domain task.
