INDUSTRIAL-STANDARD PMS DIRECTORY STRUCTURE

(Backend-First, Debug-Friendly)

Assumption: Node.js (NestJS / Express style)
(Same structure works for Java Spring / Django / Go)

1. TOP-LEVEL STRUCTURE
pms-backend/
│
├── apps/
├── config/
├── database/
├── modules/
├── common/
├── events/
├── integrations/
├── jobs/
├── analytics/
├── scripts/
├── tests/
├── docs/
└── main.ts

Why this works

Horizontal separation (what kind of code)

Vertical separation (business domains inside modules)

Easy grep, easy ownership

2. APPS (ENTRY POINTS)
apps/
├── api/
│   ├── server.ts
│   ├── routes.ts
│   └── middleware.ts
│
├── worker/
│   └── worker.ts
│
└── scheduler/
    └── cron.ts

Debugging benefit

API issues? → apps/api

Notification delays? → worker

SLA breach jobs? → scheduler

No mixed responsibilities.

3. CONFIG (ENV & SYSTEM BEHAVIOR)
config/
├── env/
│   ├── dev.env
│   ├── staging.env
│   └── prod.env
│
├── database.ts
├── redis.ts
├── slack.ts
├── mail.ts
└── feature-flags.ts

Debugging benefit

No hardcoded values

Feature toggles isolated

Easy environment parity

4. DATABASE LAYER (VERY IMPORTANT)
database/
├── migrations/
├── seeds/
├── models/
│   ├── user.model.ts
│   ├── project.model.ts
│   ├── ticket.model.ts
│   ├── iteration.model.ts
│   └── sprint.model.ts
│
└── repositories/
    ├── user.repo.ts
    ├── project.repo.ts
    └── ticket.repo.ts

Golden rule

❌ Controllers never touch DB directly
✅ Controllers → Services → Repositories

Debugging benefit

DB bug? → repositories

Schema issue? → models/migrations

5. MODULES (CORE BUSINESS DOMAINS)

This is the heart of the system

modules/
├── auth/
├── users/
├── projects/
├── tickets/
├── sprints/
├── approvals/
├── iterations/
├── files/
├── comments/
├── offboarding/
└── response-sheets/


Each module follows the same predictable pattern 👇

6. STANDARD MODULE STRUCTURE (CRITICAL)

Example: tickets/

modules/tickets/
├── ticket.controller.ts
├── ticket.service.ts
├── ticket.validator.ts
├── ticket.state-machine.ts
├── ticket.events.ts
├── ticket.routes.ts
├── ticket.types.ts
└── ticket.constants.ts

Why this is powerful
File	Responsibility
controller	HTTP handling only
service	Business logic
validator	Guards & rules
state-machine	Ticket lifecycle
events	Emits domain events
routes	API mapping
types	DTOs
constants	Enums
Debugging speed

“Ticket stuck in REVISION_REQUIRED?”
→ ticket.state-machine.ts

7. COMMON (SHARED UTILITIES)
common/
├── logger/
├── errors/
├── guards/
├── middlewares/
├── utils/
└── base/

Examples

BaseController

ApiError

AuthGuard

RequestContext

Debugging benefit

Centralized error handling

Consistent logs

8. EVENTS (EVENT-DRIVEN BACKBONE)
events/
├── publishers/
│   ├── ticket.events.ts
│   ├── user.events.ts
│   └── project.events.ts
│
├── subscribers/
│   ├── notification.subscriber.ts
│   ├── analytics.subscriber.ts
│   └── audit.subscriber.ts

Why this matters

Ticket state changes → emit event

Notifications & analytics listen

Zero coupling

Debugging

Missing Slack msg? → subscriber

Event not fired? → publisher

9. INTEGRATIONS (EXTERNAL SYSTEMS)
integrations/
├── slack/
│   ├── slack.client.ts
│   └── slack.service.ts
│
├── email/
│   └── mail.service.ts
│
└── storage/
    └── s3.service.ts

Debugging

External failures isolated

Easy mocking

10. JOBS & AUTOMATION
jobs/
├── sla-monitor.job.ts
├── red-alert.job.ts
├── idle-ticket.job.ts
└── offboarding.job.ts

Examples

SLA breach detection

Red alerts

Exit cleanup

11. ANALYTICS (READ-ONLY ZONE)
analytics/
├── dashboards/
├── queries/
├── aggregations/
└── analytics.service.ts

Rule

❌ No write operations
✅ Only reads, aggregates, cache

12. TESTING (DEBUGGING GOLD)
tests/
├── unit/
├── integration/
├── e2e/
└── fixtures/


Unit → services, validators

Integration → DB + API

E2E → ticket lifecycle

13. DOCS (FOR HUMANS)
docs/
├── api-contracts.md
├── state-machine.md
├── architecture.md
├── onboarding.md
└── runbook.md

Debugging benefit

Runbook = production incidents solved faster

14. WHY THIS STRUCTURE IS EASY TO DEBUG
Scenario → Where to look
Problem	Folder
Ticket not closing	ticket.state-machine
Wrong FTR	analytics
Slack not sent	events + integrations
Exit broke ticket	offboarding
SLA alert spam	jobs