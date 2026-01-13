# Butler Project: Context & Understanding

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
