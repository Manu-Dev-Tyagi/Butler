# Tickets Lifecycle API Documentation

## Overview

This document describes the API endpoints involved in the ticket lifecycle and the automatic behaviors triggered by state transitions.

**Lifecycle Flow:**
```
CREATED → ASSIGNED → IN_PROGRESS → SUBMITTED → APPROVED → DELIVERED → CLOSED
```

---

## API Endpoints

### 1. Create Ticket

**Endpoint:** `POST /tickets`

**Description:** Creates a new ticket with status `CREATED`.

**Request Body:**
```json
{
  "project_id": "uuid",
  "title": "string (required)",
  "description": "string (optional)",
  "priority": "LOW | MEDIUM | HIGH | URGENT (required)",
  "delivery_datetime": "ISO 8601 datetime (optional)",
  "delivery_slot": "string (optional)",
  "sprint_id": "uuid (optional)",
  "ad_name": "string (optional)",
  "creative_count": "number (optional)"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "title": "string",
  "status": "CREATED",
  "priority": "HIGH",
  "created_at": "timestamp",
  ...
}
```

**Initial Status:** `CREATED`

---

### 2. Assign Ticket

**Endpoint:** `POST /tickets/:id/assign`

**Description:** Assigns a ticket to a user. Automatically updates ticket status from `CREATED` to `ASSIGNED`.

**Request Body:**
```json
{
  "user_id": "uuid (required)"
}
```

**Response:** `200 OK`
```json
{
  "message": "Ticket assigned successfully",
  "assignment": {
    "id": "uuid",
    "ticket_id": "uuid",
    "user_id": "uuid",
    "assigned_at": "timestamp",
    "assignment_status": "ACTIVE"
  }
}
```

**Status Transition:** `CREATED` → `ASSIGNED`

**Automatic Behavior:**
- Creates an assignment record in `ticket_assignments` table
- Deactivates any previous assignment (if exists)
- Updates ticket status to `ASSIGNED`
- **Event Emitted:** `TICKET_ASSIGNED` (for Slack/Email notifications)

---

### 3. Start Work (Update to IN_PROGRESS)

**Endpoint:** `PATCH /tickets/:id/status`

**Description:** Updates ticket status to indicate work has started.

**Request Body:**
```json
{
  "status": "IN_PROGRESS"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "IN_PROGRESS",
  ...
}
```

**Status Transition:** `ASSIGNED` → `IN_PROGRESS`

---

### 4. Submit Work

**Endpoint:** `PATCH /tickets/:id/status`

**Description:** Submits the ticket for review. **Automatically creates iteration 1** if it doesn't exist.

**Request Body:**
```json
{
  "status": "SUBMITTED"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "SUBMITTED",
  ...
}
```

**Status Transition:** `IN_PROGRESS` → `SUBMITTED`

**Automatic Behavior:**
- **Automatically creates iteration 1** with outcome `PENDING`
- If iteration already exists, status is updated without creating a new iteration
- **Event Emitted:** `ITERATION_SUBMITTED`

**Implementation:**
```typescript
// File: modules/tickets/tickets.service.ts:updateTicketStatus()
if (status === TicketStatus.SUBMITTED && currentTicket.status !== TicketStatus.SUBMITTED) {
    const existingIterations = await this.iterationsService.getIterations(id);
    if (existingIterations.length === 0) {
        await this.iterationsService.createFirstIteration(id);
    }
}
```

**Important:** Files can only be uploaded AFTER iteration is created. Use `GET /tickets/:id/iterations` to get the iteration ID, then upload files with that `iteration_id`.

---

### 5. Approve Ticket

**Endpoint:** `POST /tickets/:id/approve`

**Description:** Approves the current iteration. Sets FTR (First Time Right) based on iteration number.

**Request Body:**
```json
{
  "approved_by": "uuid (required, user_id of approver)"
}
```

**Response:** `200 OK`
```json
{
  "message": "Ticket approved successfully",
  "iteration": {
    "id": "uuid",
    "ticket_id": "uuid",
    "iteration_number": 1,
    "outcome": "APPROVED",
    ...
  },
  "approval": {
    "id": "uuid",
    "ticket_id": "uuid",
    "approved_by": "uuid",
    "status": "APPROVED",
    ...
  },
  "ftr": {
    "id": "uuid",
    "ticket_id": "uuid",
    "first_time_right": true,
    "score": 100,
    ...
  }
}
```

**Status Transition:** `SUBMITTED` → `APPROVED`

**Automatic Behavior:**
- Updates current iteration outcome to `APPROVED`
- **Calculates FTR:**
  - If iteration_number === 1: `first_time_right = TRUE`, `score = 100`
  - If iteration_number > 1: `first_time_right = FALSE`, `score = 0`
- Creates/updates FTR metric in `ftr_metrics` table
- Updates ticket status to `APPROVED`
- Creates approval record in `approvals` table
- **Event Emitted:** `ITERATION_APPROVED`

**Transaction:** This operation is atomic (uses database transaction).

---

### 6. Reject Ticket (Request Revision)

**Endpoint:** `POST /tickets/:id/reject`

**Description:** Rejects the current iteration and creates a new iteration for revision.

**Request Body:**
```json
{
  "approved_by": "uuid (required, user_id of reviewer)",
  "reason": "string (optional)"
}
```

**Response:** `200 OK`
```json
{
  "message": "Ticket rejected. Revision required. New iteration created.",
  "old_iteration": {
    "id": "uuid",
    "iteration_number": 1,
    "outcome": "REJECTED",
    ...
  },
  "new_iteration": {
    "id": "uuid",
    "iteration_number": 2,
    "outcome": "PENDING",
    ...
  },
  "approval": {
    "status": "REJECTED",
    ...
  },
  "ftr": {
    "first_time_right": false,
    "score": 0
  }
}
```

**Status Transition:** `SUBMITTED` → `REVISION_REQUIRED`

**Automatic Behavior:**
- Updates current iteration outcome to `REJECTED`
- Creates next iteration with outcome `PENDING`
- Sets FTR to `FALSE` (since revision was required)
- Updates ticket status to `REVISION_REQUIRED`
- **Event Emitted:** `ITERATION_REJECTED`

---

### 7. Mark as Delivered

**Endpoint:** `PATCH /tickets/:id/status`

**Description:** Marks the ticket as delivered to the client.

**Request Body:**
```json
{
  "status": "DELIVERED"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "DELIVERED",
  ...
}
```

**Status Transition:** `APPROVED` → `DELIVERED`

---

### 8. Close Ticket

**Endpoint:** `PATCH /tickets/:id/status`

**Description:** Closes the ticket. This is the final state.

**Request Body:**
```json
{
  "status": "CLOSED"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "CLOSED",
  ...
}
```

**Status Transition:** `DELIVERED` → `CLOSED`

---

## Supporting Endpoints

### Get Ticket Iterations

**Endpoint:** `GET /tickets/:id/iterations`

**Description:** Get all iterations for a ticket.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "ticket_id": "uuid",
    "iteration_number": 1,
    "outcome": "APPROVED",
    "created_at": "timestamp"
  }
]
```

---

### Get Ticket Details

**Endpoint:** `GET /tickets/:id`

**Description:** Get full ticket details including current status.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "title": "string",
  "description": "string",
  "priority": "HIGH",
  "status": "APPROVED",
  "delivery_datetime": "timestamp",
  "created_at": "timestamp",
  ...
}
```

---

## Automatic Behaviors Summary

| Trigger | Automatic Action | Implementation |
|---------|-----------------|----------------|
| Assign ticket | Status: `CREATED` → `ASSIGNED` | `tickets.repository.ts:assignTicket()` |
| Update to `SUBMITTED` | Create iteration 1 (if doesn't exist) | `tickets.service.ts:updateTicketStatus()` |
| Approve ticket | Update iteration outcome, set FTR, create approval | `iterations.service.ts:approveTicket()` |
| Reject ticket | Mark iteration rejected, create next iteration, set FTR=FALSE | `iterations.service.ts:rejectTicket()` |

---

## FTR (First Time Right) Logic

FTR is calculated when a ticket is approved:

- **Iteration 1 approved:** `first_time_right = TRUE`, `score = 100`
- **Iteration 2+ approved:** `first_time_right = FALSE`, `score = 0`

**Implementation:**
```typescript
// File: modules/iterations/iterations.service.ts:approveTicket()
const firstTimeRight = currentIteration.iteration_number === 1;
const ftrScore = firstTimeRight ? 100 : 0;
```

---

## File Upload Requirements

Files must be uploaded AFTER an iteration is created:

**Endpoint:** `POST /files/upload`

**Request Body:**
```json
{
  "ticket_id": "uuid (required)",
  "iteration_id": "uuid (required)",  // Must not be null
  "file_url": "string (required)",
  "file_type": "string (optional)",
  "uploaded_by": "uuid (required)"
}
```

**Workflow:**
1. Update ticket status to `SUBMITTED` (creates iteration 1)
2. Get iteration ID via `GET /tickets/:id/iterations`
3. Upload file(s) with the `iteration_id`

---

## SLA Validation

SLA success is determined by comparing the approval timestamp with `delivery_datetime`:

- **SLA Success:** Ticket approved before `delivery_datetime`
- **SLA Breach:** Ticket approved after `delivery_datetime`

The system does not automatically track SLA status in a dedicated field. This can be calculated by comparing:
- `approvals.created_at` (approval timestamp)
- `tickets.delivery_datetime` (deadline)

---

## Happy Path Integration Test

A comprehensive integration test validates the entire happy path:

**Test Location:** `tests/integration/ticket_lifecycle_happy_path.test.ts`

**Test Coverage:**
- ✅ Ticket creation with `CREATED` status
- ✅ Assignment → `ASSIGNED` status
- ✅ Start work → `IN_PROGRESS` status
- ✅ Submission → `SUBMITTED` status + iteration 1 auto-creation
- ✅ Approval → `APPROVED` status + FTR=TRUE + iteration outcome=APPROVED
- ✅ Delivery → `DELIVERED` status
- ✅ Closure → `CLOSED` status
- ✅ SLA validation

**Run Test:**
```bash
npx ts-node -r tsconfig-paths/register tests/integration/ticket_lifecycle_happy_path.test.ts
```

---

## Error Handling

### Common Errors

| Error | Status Code | Cause |
|-------|-------------|-------|
| `Ticket not found` | 404 | Invalid ticket ID |
| `No iteration found for this ticket` | 400 | Trying to approve before submission |
| `Current iteration is not pending` | 400 | Trying to approve already approved/rejected iteration |
| `iteration_id is required` | 400 | Trying to upload file without iteration |
| `user_id is required` | 400 | Missing user_id in assignment |

---

## State Machine Rules

The system allows flexible status updates via `PATCH /tickets/:id/status`, but the recommended flow is:

1. `CREATED` (on ticket creation)
2. `ASSIGNED` (via assignment endpoint)
3. `IN_PROGRESS` (manual status update)
4. `SUBMITTED` (manual status update, auto-creates iteration)
5. `APPROVED` (via approval endpoint)
6. `DELIVERED` (manual status update)
7. `CLOSED` (manual status update)

**Alternative Paths:**
- `SUBMITTED` → `REVISION_REQUIRED` (via reject endpoint)
- `REVISION_REQUIRED` → `IN_PROGRESS` (developer fixes issues)
- `IN_PROGRESS` → `SUBMITTED` (resubmit)
- Any status → `CANCELLED` (cancellation)
- Any status → `REASSIGNED` (via unassignment)

---

## Events Emitted

The following events are emitted during the lifecycle:

| Event | Trigger | Purpose |
|-------|---------|---------|
| `TICKET_ASSIGNED` | Ticket assignment | Slack/Email notifications |
| `ITERATION_SUBMITTED` | Iteration creation | Event tracking |
| `ITERATION_APPROVED` | Iteration approval | Event tracking |
| `ITERATION_REJECTED` | Iteration rejection | Event tracking |

Events are processed by the Worker service (background cron jobs).

---

## Related Documentation

- `AI_CONTEXT.md` - Validation results and implementation notes
- `ANALYTICS_API.md` - Analytics endpoints
- `RESPONSE_SHEETS_API.md` - Response sheets functionality

---

## Version

**Last Updated:** 2026-01-14
**Backend Version:** 1.0.0
**Validation Status:** ✅ PASS
