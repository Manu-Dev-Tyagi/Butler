# Butler Project: Context & Understanding

**Repository**: [https://github.com/Manu-Dev-Tyagi/Butler](https://github.com/Manu-Dev-Tyagi/Butler)

This document summarizes the core logic, architecture, and business rules of the **Butler** Project Management System (PMS) to ensure consistent understanding and prevent hallucinations. It is derived from the project overview, database schema, wireframes, and directory structure documentation.

## 1. System Overview
**Butler** is a structured, analytics-driven PMS designed detailed execution control, accountability, and "First Time Right" (FTR) delivery. It is not just for task management but for managing the *quality* and *lifecycle* of execution, particularly suitable for creative and technical operations.

## 2. Core Entities & Roles
*   **Admin/PMO**: Full visibility, project creation, offboarding management, sprint analysis.
*   **Project Manager (PM)**: Project-level control, ticket creation, client communication, approvals.
*   **Employee/Member**: Execution only using a "My Tickets" view. Can request leave via "Leave Portal".
*   **Project**: The execution boundary. Contains Members, Tickets, Sprints, Client POCs, and a dedicated Slack channel.
*   **Ticket**: The unit of work. Belongs to a Project and a Sprint.
*   **Iteration**: A child of a Ticket. A ticket has multiple iterations if revisions are required. **Iterations are not new tickets.**
*   **Sprint**: Used for analysis and grouping (reporting), but does *not* control ticket state or locking.

## 3. Critical Business Logic

### A. Ticket Lifecycle (State Machine)
The ticket state machine is the single source of truth.
*   **Flow**: `CREATED` -> `ASSIGNED` -> `IN_PROGRESS` -> `SUBMITTED`
*   **Approval Path (YES)**: `SUBMITTED` -> `APPROVED` -> `DELIVERED` -> `CLOSED`. (FTR = True if Iteration #1).
*   **Rejection Path (NO)**: `SUBMITTED` -> `REVISION_REQUIRED` -> `IN_PROGRESS`. (Creates new Iteration, FTR = False permanently).
*   **Exit Handling**: `IN_PROGRESS` -> `REASSIGNED` -> `IN_PROGRESS`. (Does not reset iterations/history).

### B. Iterations & FTR
*   **First Time Right (FTR)**: A critical metric. `TRUE` only if the ticket is approved in **Iteration 1**.
*   **Iteration Logic**: A ticket starts at Iteration 1. "Revision Required" triggers a new iteration.
*   **Red Alerts**: Triggered by structural failures, not just delays (e.g., Iterations > Threshold, SLA breach, Idle time).

### C. Employee Exit (The "Bus Factor" Fix)
*   **Leave Portal**: Employees trigger this to signal exit.
*   **Logic**:
    *   If no active tickets -> Status `EXITED`.
    *   If active tickets -> Status `EXIT_INITIATED`, Tickets move to `REASSIGNED` state.
*   **Result**: History is preserved; tickets are handed over without data loss.

## 4. Architecture & Data Model

### Database (Normalized Schema)
*   **Users**: Never deleted (soft state: Active, Exit Initiated, Offboarded).
*   **Projects**: Link Clients and Members.
*   **Tickets**: Link to Project and Sprint.
*   **Ticket_Iterations**: 1:N relationship with Tickets. Stores outcome of each attempt.
*   **Ticket_Assignment**: Tracks active owner history.
*   **Response_Sheets**: Auto-generated reports for clients.

### Backend Structure (Node.js/NestJS aligned)
*   **Modular**: Split by domain (`modules/auth`, `modules/tickets`, `modules/iterations`).
*   **Separation of Concerns**:
    *   `Controller`: HTTP processing.
    *   `Service`: Business logic.
    *   `Repository`: DB access.
    *   `State Machine`: Explicit logic for ticket transitions.
*   **Event-Driven**: Uses `events/` (publishers/subscribers) to decouple actions (e.g., "Ticket Submitted" -> "Notify Slack").

## 5. UI/UX Mapping
*   **Dashboard**: Role-specific (Admin vs. PM vs. Employee).
*   **Create Project**: Auto-creates Slack channels.
*   **Ticket Detail**: Shows Iteration Timeline (not just standard comments).
*   **Offboarding Screen**: Admin view to reassign tickets from exiting users.

## 6. Development Guidelines
*   **No Magic**: Logic must be explicit (e.g., State Machines).
*   **Data Integrity**: use 3NF schema; no data duplication.


## 7. Active To-Do Checklist (from to-do.md)
### Phase 1: Minimal Running Server
*   [x] Create `apps/api/server.ts` (Express, Error Handler, Logger).
*   [x] Add `GET /health` endpoint.
*   [x] Verify `npm run dev` works.

### Phase 2: Database Connection
*   [x] Create `database/connection.ts`.
*   [x] Create `database/base.repository.ts`.
*   [x] Implement Connection Pool & Transaction Helper.
*   [x] Test with `SELECT 1` (via Migration & Health Check).

### Phase 3: Auth Foundation (Complete)
*   [x] Install `jsonwebtoken`, `bcrypt`.
*   [x] Create Seed Script (Admin User) for testing.
*   [x] Implement `modules/auth/auth.service.ts` (Login, Sign Token).
*   [x] Implement `modules/auth/auth.controller.ts` (POST /login).
*   [x] Implement `common/guards/auth.guard.ts` & `role.guard.ts`.
*   [x] Verify with API Test.

### Phase 4: User Lifecycle (Complete)
*   [x] Implement `modules/users/users.repository.ts`.
*   [x] Implement `modules/users/users.service.ts` (State Machine).
*   [x] Implement `modules/users/users.controller.ts`.
*   [x] Verify with Integration Test (`tests/integration/users_lifecycle.test.ts`).

### Phase 5: Master Data (Departments) (Complete)
*   [x] Implement `modules/departments/departments.repository.ts`.
*   [x] Implement `modules/departments/departments.service.ts` (Core Logic).
*   [x] Implement `modules/departments/departments.controller.ts` (CRUD).
*   [x] Register Routes in `server.ts`.
*   [x] Verify with Test (`tests/integration/master_data.test.ts`).

## 8. Progress Log
*   **[DATE] Project Initialization**:
    *   Created `pms-backend` directory.
    *   Initialized Node.js project (`package.json`).
    *   Installed TypeScript environment (`typescript`, `ts-node`, `nodemon`).
    *   Scaffolded comprehensive directory structure (apps, modules, database, events, etc.).
*   **[DATE] Database Setup**:
    *   Created `database/schema.sql` with full 3NF PostgreSQL schema.
    *   Installed `pg` driver and `dotenv`.
    *   Configured `tsconfig.json` with path aliases.
    *   **FIX**: Enabled `esModuleInterop` to resolve Express import issues.
*   **[DATE] Phase 1 & 2 Execution**:
    *   Implemented `apps/api/server.ts` (Express server).
    *   Verified `/health` endpoint.
    *   Implemented `database/connection.ts` with PG Pool.
*   **[DATE] User Lifecycle Implementation**:
    *   Implemented full User CRUD (`modules/users`).
    *   Implemented State Machine (`ACTIVE` -> `EXIT_INITIATED` -> `OFFBOARDED`).
    *   Added logic to block offboarding if active tickets exist.
    *   Created `API_DOCUMENTATION.md` for Postman.
*   **[DATE] Master Data (Departments)**:
    *   Implemented Departments & Sub-Departments Logic.
    *   Added endpoints: `GET/POST /departments` and `GET/POST /sub-departments`.
    *   Added Tags: Frontend, Backend, Data Eng, QA, DevOps, etc.
*   **[2026-01-13] Comments & Files (STEP 7 - COLLABORATION & ATTACHMENTS)**:
    *   **Implemented Comments Module** (Already existed, now registered):
        *   `modules/comments/comments.repository.ts` - Database layer with user details join
        *   `modules/comments/comments.service.ts` - Business logic with ticket validation
        *   `modules/comments/comments.controller.ts` - REST API endpoints
        *   Endpoints: `POST /tickets/:id/comments`, `GET /tickets/:id/comments`
    *   **Implemented Files Module** (Completed partial implementation):
        *   `modules/files/files.repository.ts` - Database layer with uploader details
        *   `modules/files/files.service.ts` - Business logic enforcing iteration linkage
        *   `modules/files/files.controller.ts` - Upload and retrieval endpoints
        *   Endpoints: `POST /files/upload`, `GET /tickets/:id/files`
    *   **Critical Business Rules Enforced**:
        *   Files MUST be linked to iterations (`iteration_id` is mandatory)
        *   File uploads store metadata only (blob storage abstracted per requirements)
        *   Comments include user details (name, email) in responses
    *   **Testing**:
        *   Created `tests/integration/comments_files.test.ts` - 16 comprehensive test cases
        *   All tests passed: CRUD, validations, iteration linkage enforcement
    *   **Key Decisions**:
        *   Files cannot be uploaded without iteration (enforces versioning/audit trail)
        *   Comments are NOT iteration-specific (general ticket collaboration)
        *   Future enhancement: Slack update event on file upload (placeholder in code)

*   **[2026-01-13] Ticket Management (STEP 6 - HEART OF PMS)**:
    *   **Implemented Tickets Module** (Complete CRUD + Assignment):
        *   `modules/tickets/tickets.types.ts` - Enums (TicketStatus, TicketPriority, AssignmentStatus) + DTOs
        *   `modules/tickets/tickets.repository.ts` - Database layer with transactional assignment logic
        *   `modules/tickets/tickets.service.ts` - Business logic with state machine enforcement
        *   `modules/tickets/tickets.controller.ts` - Full REST API (6 endpoints)
        *   Endpoints implemented:
            *   `POST /tickets` - Create ticket (status: CREATED)
            *   `GET /tickets` - List all tickets
            *   `GET /tickets/:id` - Get ticket by ID
            *   `PATCH /tickets/:id` - Update ticket fields
            *   `POST /tickets/:id/assign` - Assign to user (ONE active owner enforced)
            *   `POST /tickets/:id/unassign` - Unassign (exit flow only)
    *   **State Machine Integration**:
        *   Ticket lifecycle: CREATED → ASSIGNED (on first assignment) → IN_PROGRESS → SUBMITTED → APPROVED/REVISION_REQUIRED → DELIVERED → CLOSED
        *   Assignment updates status: CREATED → ASSIGNED
        *   Unassignment updates status: * → REASSIGNED
    *   **Assignment Logic** (Critical Business Rule):
        *   Exactly ONE active owner per ticket (enforced transactionally)
        *   Reassignment automatically deactivates previous assignment
        *   Historical assignments preserved with timestamps
    *   **Event-Driven Notifications**:
        *   `events/publishers/ticket.publisher.ts` - TICKET_ASSIGNED event emitter
        *   `events/subscribers/ticket.subscriber.ts` - Slack + Email notification handlers (placeholder)
        *   Events triggered on every assignment/reassignment
    *   **Testing**:
        *   Created `tests/integration/tickets.test.ts` - 18 comprehensive test cases
        *   All tests passed: CRUD, assignment, reassignment, unassignment, state transitions, validations
    *   **Key Decisions**:
        *   Transactional assignment ensures ONE active owner rule (no race conditions)
        *   State machine enforced at repository level for data integrity
        *   Events decoupled from API response (non-blocking notifications)
        *   Unassign only for exit flow (preserves assignment history)
        *   Priority enum validation at service layer
*   **[2026-01-13] Sprint Management (STEP 5)**:
    *   **Implemented Sprints Module**:
        *   `modules/sprints/sprints.repository.ts` - Database layer with ordered queries
        *   `modules/sprints/sprints.service.ts` - Business logic with comprehensive validation
        *   `modules/sprints/sprints.controller.ts` - HTTP routes (POST/GET `/sprints`, GET `/sprints/:id`)
        *   Validation: Name required, dates required, end_date > start_date, duplicate names rejected (409)
        *   Sprints ordered by start_date DESC for listing
    *   **Critical Business Rule**: Sprints are for **analytics and grouping only** - NO locking logic, NO state control
    *   **Testing**:
        *   Created `tests/integration/sprints.test.ts` - 14 comprehensive test cases
        *   All tests passed: CRUD operations, all validation scenarios, date handling, ordering
    *   **Key Decisions**:
        *   Sprints do NOT control ticket state (tickets can be created/modified regardless of sprint dates)
        *   Duplicate sprint names rejected to ensure clear identification in reports
        *   Date validation ensures logical sprint periods (end_date must be after start_date)
        *   Ordered listing (DESC) shows most recent sprints first for better UX
*   **[2026-01-13] Client & Project Management (STEP 4)**:
    *   **Implemented Clients Module**:
        *   `modules/clients/clients.repository.ts` - Database layer with duplicate name check
        *   `modules/clients/clients.service.ts` - Business logic
        *   `modules/clients/clients.controller.ts` - HTTP routes (POST/GET `/clients`)
        *   Validation: Client name required, duplicate names rejected (409)
    *   **Implemented Projects Module**:
        *   `modules/projects/projects.types.ts` - DTOs for Project, ProjectPOC, ProjectMember, CreateProjectDTO
        *   `modules/projects/projects.repository.ts` - Transactional project creation with POCs and Members
        *   `modules/projects/projects.service.ts` - Business logic with event emission
        *   `modules/projects/projects.controller.ts` - Full CRUD + POC/Member sub-routes
        *   Endpoints implemented:
            *   `POST /projects` - Create project with optional POCs and members (transactional)
            *   `GET /projects` - List all projects
            *   `GET /projects/:id` - Get project by ID
            *   `PATCH /projects/:id` - Update project (name, status)
            *   `POST /projects/:id/pocs` - Add POC to project
            *   `GET /projects/:id/pocs` - List POCs for project
            *   `POST /projects/:id/members` - Assign member to project
            *   `GET /projects/:id/members` - List members for project (current only)
            *   `DELETE /projects/:id/members/:userId` - Remove member from project
    *   **Implemented Event-Driven Architecture**:
        *   `events/publishers/project.publisher.ts` - PROJECT_CREATED event emitter
        *   `events/subscribers/project.subscriber.ts` - Async Slack channel creation (placeholder)
        *   EventEmitter pattern for decoupled async operations
    *   **Database Changes**:
        *   Exported `pool` from `database/connection.ts` for transactional operations
    *   **TypeScript Configuration**:
        *   Added `@events/*` and `@integrations/*` path aliases to `tsconfig.json`
    *   **Testing**:
        *   Created `tests/integration/clients_projects.test.ts` - 20 test cases
        *   All tests passed: CRUD operations, validations, POC/Member management
    *   **Key Decisions**:
        *   Transactional project creation ensures atomicity (project + POCs + members)
        *   PROJECT_CREATED event enables async Slack channel creation without blocking API response
        *   Project members tracked with `is_current` flag for historical visibility
        *   All validation enforced at service layer (duplicate checks, required fields)

*   **[2026-01-13] Cron-Based Event Processing System (STEP 8 - ASYNC & NOTIFICATIONS)**:
    *   **Architecture**: Migrated from in-memory `EventEmitter` to durable DB-backed event queue (`events` table).
    *   **Implemented Events Module**:
        *   `modules/events/events.repository.ts` - Queue management (PENDING, PROCESSING, DONE, FAILED)
        *   `modules/events/events.service.ts` - Bridge for publishers and cron job
    *   **Migrated Publishers**:
        *   `events/publishers/ticket.publisher.ts` - Now inserts `TICKET_ASSIGNED` events into DB
        *   `events/publishers/project.publisher.ts` - Now inserts `PROJECT_CREATED` events into DB
    *   **Cron Infrastructure**:
        *   `jobs/cron.ts` - Schedules processing cycle every 1 minute using `node-cron`
        *   `jobs/event-processor.ts` - Logic for fetching and processing pending events with retry logic (max 3 retries)
        *   `jobs/handlers/` - Individual handlers for ticket assignment and project creation
    *   **In-App Notifications**:
        *   Created `notifications` module with repository and controller
        *   Endpoints: `GET /notifications`, `GET /notifications/unread/count`, `PATCH /notifications/:id/read`
    *   **Integrations**: Added placeholders for Slack and Email within handlers
    *   **Key Decisions**:
        *   Async processing ensures API speed and reliability
        *   DB-backed queue provides durability across server restarts
        *   System is fully ready for future SQS/Kafka swap (consumer swap only)
258: 
259: *   **[2026-01-13] Architectural Split & Route Registration**:
260:     *   **API & Worker Split**: Separated the monolithic runtime into two processes:
261:         *   `apps/api/server.ts` - Handles HTTP requests and event publishing.
262:         *   `apps/worker/worker.ts` - Background process for event consumption (Slack, Email).
263:     *   **Route Registration Fix**:
264:         *   Registered `Comments`, `Files`, and `Notifications` routes in `server.ts`.
265:         *   Resolved "Cannot find name 'filesRoutes'" error by adding missing controller imports.
266:     *   **Process Management**:
267:         *   Added `npm run dev:api` and `npm run dev:worker` for local development.
268:         *   Worker process now handles all long-running event processing independently.

*   **[2026-01-13] Analytics & Reporting (STEP 9 - FINAL FEATURE)**:
    *   **Implemented Analytics Module** (Frontend-Optimized KPI System):
        *   `modules/analytics/analytics.types.ts` - TypeScript interfaces for all analytics endpoints
            *   `OverviewAnalytics` - System-wide metrics with 7 nested sections
            *   `SprintAnalytics` - Sprint-specific metrics with timeline data for burndown charts
            *   `UserPerformance` & `UsersAnalytics` - Individual and team performance with leaderboard
        *   `modules/analytics/analytics.repository.ts` - Optimized read-only SQL queries
            *   **Overview**: 7 separate aggregate queries (summary, FTR, resolution, iterations, status/priority distributions, recent activity)
            *   **Sprint**: Timeline generation with daily completion tracking, velocity calculation
            *   **User**: Individual performance tracking, leaderboard with ranking, active streak calculation
        *   `modules/analytics/analytics.service.ts` - Business logic with error handling
        *   `modules/analytics/analytics.controller.ts` - REST API endpoints (4 routes)
            *   `GET /analytics/overview` - System-wide analytics
            *   `GET /analytics/sprints/:sprintId` - Sprint-specific analytics
            *   `GET /analytics/users` - All users with leaderboard
            *   `GET /analytics/users/:userId` - Individual user performance
    *   **Key Performance Indicators (KPIs)**:
        *   **FTR (First Time Right) %** - Percentage of tickets approved in first iteration
        *   **Average Resolution Time** - Mean hours from creation to approval (with median, fastest, slowest)
        *   **Iterations per Ticket** - Average number of iterations required
        *   **Status/Priority Distributions** - Breakdown by ticket status and priority
        *   **Velocity Tracking** - Tickets per day, estimated completion dates, on-track indicators
        *   **Recent Activity** - Today's ticket creation/completion metrics
    *   **Frontend-Optimized Design Decisions**:
        *   Nested objects match React component hierarchy (easy prop drilling)
        *   Pre-calculated percentages and rates (no frontend math required)
        *   Distribution arrays ready for chart libraries (D3.js, Chart.js, Recharts)
        *   Timeline data with cumulative values for burndown/line charts
        *   Leaderboard with explicit rank field for sorting/gamification
    *   **Database Optimization**:
        *   Read-only queries with aggregate functions (COUNT, AVG, SUM, PERCENTILE_CONT)
        *   Minimal JOIN operations to reduce query load
        *   Common Table Expressions (CTEs) for complex calculations
        *   Date-based grouping using generate_series for timeline data
    *   **Testing**:
        *   Created `tests/integration/analytics.test.ts` - 16 comprehensive test cases
        *   Coverage: All endpoints, authentication, validation, error handling
    *   **Key Technical Achievements**:
        *   All analytics computed server-side (frontend just renders)
        *   Zero N+1 query problems (optimized with aggregations)
        *   Supports real-time dashboard updates (queries are fast)
        *   Scalable to large datasets (indexed columns, efficient JOINs)

*   **[2026-01-13] Response Sheets (CLIENT REPORTING FEATURE)**:
    *   **Implemented Response Sheets Module** (Snapshot-Based Client Reports):
        *   `modules/response-sheets/response-sheets.types.ts` - Comprehensive snapshot data structure
            *   `ResponseSheetSnapshot` - Complete project state (project, client, POCs, team, tickets, summary metrics)
            *   Snapshot includes: all tickets with iterations/FTR status, team assignments, resolution times, summary KPIs
        *   `modules/response-sheets/response-sheets.repository.ts` - Snapshot generation and persistence
            *   `generateSnapshot()` - Single-point-in-time data capture (NEVER recomputed)
            *   Queries: Project details, POCs, team members, all tickets with full history, calculated metrics
            *   JSONB storage for complete snapshot preservation
        *   `modules/response-sheets/response-sheets.service.ts` - Business logic with email placeholder
            *   Email sending ready for integration (SendGrid/AWS SES)
            *   Email validation and recipient management
        *   `modules/response-sheets/response-sheets.controller.ts` - 4 REST endpoints
            *   `POST /response-sheets` - Generate new sheet for project
            *   `POST /response-sheets/:id/send` - Email sheet to recipients
            *   `GET /response-sheets/:id` - Retrieve sheet by ID
            *   `GET /response-sheets?project_id=...` - List all or filter by project
    *   **Critical Business Rule**: **SNAPSHOT DATA**
        *   Sheet generated = permanent snapshot stored in `snapshot_data` JSONB column
        *   Historical sheets NEVER recomputed (data immutability)
        *   Sent tracking: `sent_at` timestamp and `sent_to` email array
    *   **Snapshot Data Structure**:
        *   **Project Info**: ID, name, status, creation date
        *   **Client Info**: ID, name
        *   **POCs**: Name, email, phone for all project POCs
        *   **Team Members**: Current assignees with roles and assignment dates
        *   **Tickets**: ALL project tickets with status, priority, iterations, FTR, resolution times, assignees
        *   **Summary Metrics**: Total/completed/in-progress/pending counts, FTR%, avg resolution, avg iterations
    *   **Database Updates**:
        *   Updated `response_sheets` table schema with JSONB column
        *   Created migration `003_update_response_sheets.sql`
        *   Indexes on project_id and generated_at for performance
    *   **Key Technical Decisions**:
        *   JSONB for flexible snapshot storage (queryable + full data preservation)
        *   Email service abstracted (placeholder for SendGrid/SES/etc.)
        *   Snapshot generation happens at POST time (never lazy-loaded)
        *   List view optimized with JSONB field extraction (no full snapshot load)
    *   **Use Cases**:
        *   Client progress reports (monthly/weekly)
        *   Historical project auditing
        *   Performance review documentation
        *   Compliance and record-keeping

*   **[2026-01-13] External Integrations (SLACK & EMAIL NOTIFICATIONS)**:
    *   **Implemented Slack Integration** (`integrations/slack.service.ts`):
        *   Uses Slack Incoming Webhooks for sending notifications
        *   **Configuration**: `SLACK_ENABLED=true`, `SLACK_WEBHOOK_URL` in `.env`
        *   **Methods**:
            *   `notifyTicketAssigned()` - Rich card with ticket details, priority, assignee
            *   `notifyIterationSubmitted()` - Draft submitted notification with iteration number
            *   `notifyIterationApproved()` - Approval with FTR status badge
            *   `notifyIterationRejected()` - Revision required with rejection reason
            *   `notifyProjectCreated()` - New project announcement with team size
        *   **Features**: Priority color coding, emoji indicators, rich attachments
        *   **Error Handling**: Non-blocking (failures logged but don't break business logic)
    *   **Implemented Email Integration** (`integrations/email.service.ts`):
        *   Uses Nodemailer (supports SMTP, Gmail, SendGrid, AWS SES)
        *   **Configuration**: `EMAIL_ENABLED=true`, provider-specific variables in `.env`
        *   **Providers Supported**:
            *   Generic SMTP (configurable host/port/auth)
            *   Gmail (with App Password)
            *   SendGrid (API key authentication)
        *   **Methods**:
            *   `sendTicketAssignedEmail()` - HTML email with ticket details
            *   `sendIterationSubmittedEmail()` - Submission confirmation
            *   `sendIterationApprovedEmail()` - Approval notification with FTR badge
            *   `sendIterationRejectedEmail()` - Revision request with reason
            *   `sendProjectCreatedEmail()` - Project kickoff notification (bulk)
        *   **Features**: Professional HTML templates, responsive design, plain text fallback
        *   **Error Handling**: Non-blocking (failures logged but don't break business logic)
    *   **Updated Event Handlers** (All handlers in `jobs/handlers/*`):
        *   **`iteration.handler.ts`**: Fetches ticket/user/approver details from DB, sends Slack + Email
        *   **`ticket.handler.ts`**: Fetches user/project details, sends Slack + Email on assignment
        *   **`project.handler.ts`**: Fetches client/members, sends Slack + bulk Email to team
        *   **Database Queries**: Optimized joins to fetch all necessary data (names, emails) in single queries
        *   **Graceful Degradation**: If users/tickets not found, logs warning and skips notifications
    *   **Testing**:
        *   Created `tests/integration/test-integrations.ts` - Standalone service test
        *   All 17 iterations tests passed with real integrations enabled
        *   Worker processes events asynchronously without blocking API
    *   **Key Design Decisions**:
        *   Integrations are **disabled by default** (opt-in via `.env`)
        *   Failures in Slack/Email **never break business logic** (try-catch with logging)
        *   Worker fetches additional context (names, emails) before calling integrations
        *   All notification methods return `Promise<void>` (fire-and-forget)
        *   Configuration documented in `.env.example` with setup instructions
    *   **Setup Instructions** (in `.env.example`):
        *   Slack: Create app → Enable Incoming Webhooks → Add to workspace
        *   Email (Gmail): Enable 2FA → Generate App Password
        *   Email (SendGrid): Create API key with Mail Send permissions
        *   Email (SMTP): Generic SMTP server credentials

*   **[2026-01-13] Red Alerts System (ALERTING & GOVERNANCE)**:
    *   **Implemented Red Alerts Module** (`modules/red-alerts/*`):
        *   `red-alerts.types.ts` - Enums (`AlertReason`), interfaces, DTOs, statistics types
        *   `red-alerts.repository.ts` - Database layer with filtering, statistics, and deduplication
        *   `red-alerts.service.ts` - Business logic with automated alert detection
        *   `red-alerts.controller.ts` - REST API (8 endpoints)
    *   **Alert Triggers** (Automated Detection):
        *   **EXCESSIVE_ITERATIONS**: Ticket has > 2 iterations (multiple revisions = quality issue)
        *   **SLA_BREACH**: `delivery_datetime` crossed but ticket not completed (APPROVED/DELIVERED/CLOSED)
        *   **IDLE_TICKET**: No iteration updates for > 48 hours (ticket stuck)
    *   **Alert Thresholds** (Configurable in service):
        *   Iteration threshold: 2 (trigger if > 2)
        *   Idle threshold: 48 hours
    *   **API Endpoints Implemented**:
        *   `GET /alerts` - Get all alerts with filtering (reason, project_id, ticket_id, date range)
        *   `GET /alerts/statistics` - Dashboard KPIs (total, active, by_reason, by_project)
        *   `GET /alerts/recent?hours=24` - Recent alerts (default last 24 hours)
        *   `GET /alerts/count` - Active alerts count (for dashboard badges)
        *   `GET /tickets/:id/alerts` - Alerts for specific ticket
        *   `GET /projects/:id/alerts` - Alerts for specific project
        *   `POST /alerts/scan` - Manual alert scan (Admin only)
        *   `POST /tickets/:id/alerts/resolve` - Manually resolve alerts (Admin only)
    *   **Automated Alert Scanning** (Cron Job):
        *   `jobs/handlers/red-alert.handler.ts` - Alert detection and notification logic
        *   Runs every 30 minutes (configurable in `jobs/cron.ts`)
        *   Scans all active tickets (status NOT IN CLOSED/CANCELLED/DELIVERED)
        *   Prevents duplicate alerts (checks `EXISTS` before creating)
        *   Auto-resolves alerts when conditions fixed
    *   **Alert Notifications**:
        *   **Slack**: Rich card with reason, ticket details, priority, assignee
        *   **Email**: HTML email to Admin and PM with alert summary
        *   **Recipients**: Admins, PMs, and ticket assignees
        *   **Summary Notification**: Sent after each scan with total alerts by reason
    *   **Alert Resolution Logic**:
        *   EXCESSIVE_ITERATIONS resolved when ticket CLOSED/CANCELLED/DELIVERED
        *   SLA_BREACH resolved when ticket APPROVED/DELIVERED/CLOSED
        *   IDLE_TICKET resolved when ticket updated (iteration created)
    *   **Database Features**:
        *   Deduplication: `EXISTS` check prevents duplicate alerts for same ticket+reason
        *   Historical tracking: All alerts preserved even after resolution
        *   Optimized queries: Uses CTEs and JOINs for efficient filtering
        *   Statistics aggregation: Pre-calculated counts by reason and project
    *   **Testing**:
        *   Created `tests/integration/red-alerts.test.ts` - 13 comprehensive test cases
        *   Coverage: Alert creation, scanning, filtering, statistics, resolution, deduplication
    *   **Key Design Decisions**:
        *   Alerts are **additive** (never automatically deleted, only manual resolution)
        *   Scan runs every 30 minutes (not real-time to reduce DB load)
        *   Alerts visible to **Admin and PM only** (not regular employees per requirements)
        *   Alert reasons are **enum** (extensible for future alert types)
        *   Statistics cached in query results (no separate caching layer needed yet)
        *   Worker handles both detection and notification (keeps API fast)
