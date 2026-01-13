# Butler PMS - API Documentation

Base URL: `http://localhost:3000`

---

## Authentication

*Authentication endpoints (login, register, token refresh) will be documented separately.*

---

## 1. Clients API

### 1.1 Create Client
**Endpoint**: `POST /clients`

**Request Body**:
```json
{
  "name": "Acme Corporation"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "Acme Corporation"
}
```

**Errors**:
- `400` - Missing or invalid name

---

### 1.2 Get All Clients
**Endpoint**: `GET /clients`

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "name": "Acme Corporation"
  },
  {
    "id": "uuid",
    "name": "Tech Startup Inc"
  }
]
```

---

### 1.3 Get Client by ID
**Endpoint**: `GET /clients/:id`

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Acme Corporation"
}
```

**Errors**:
- `404` - Client not found

---

## 2. Projects API

### 2.1 Create Project (Transactional)
**Endpoint**: `POST /projects`

**Request Body**:
```json
{
  "client_id": "uuid",
  "name": "Website Redesign 2024",
  "status": "ACTIVE",
  "pocs": [
    {
      "name": "John Doe",
      "email": "john@acme.com",
      "phone": "+1234567890"
    }
  ],
  "member_ids": ["user-uuid-1", "user-uuid-2"]
}
```

**Notes**:
- `status` is optional (defaults to "ACTIVE")
- `pocs` is optional (defaults to empty array)
- `member_ids` is optional (defaults to empty array)
- **Transactional**: All records created atomically or rolled back on error

**Response** (201 Created):
```json
{
  "project": {
    "id": "uuid",
    "client_id": "uuid",
    "name": "Website Redesign 2024",
    "status": "ACTIVE",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "pocs": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "name": "John Doe",
      "email": "john@acme.com",
      "phone": "+1234567890"
    }
  ],
  "members": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "user_id": "user-uuid-1",
      "assigned_from": "2024-01-15T10:30:00Z",
      "assigned_to": null,
      "is_current": true
    }
  ]
}
```

**Events Emitted**:
- `PROJECT_CREATED` - Triggers Slack channel creation (simulated)

**Errors**:
- `400` - Missing required fields or invalid client_id
- `500` - Transaction failed (all changes rolled back)

---

### 2.2 Get All Projects
**Endpoint**: `GET /projects`

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "client_id": "uuid",
    "name": "Website Redesign 2024",
    "status": "ACTIVE",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### 2.3 Get Project by ID
**Endpoint**: `GET /projects/:id`

**Response** (200 OK):
```json
{
  "id": "uuid",
  "client_id": "uuid",
  "name": "Website Redesign 2024",
  "status": "ACTIVE",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Errors**:
- `404` - Project not found

---

### 2.4 Get Project POCs
**Endpoint**: `GET /projects/:id/pocs`

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "name": "John Doe",
    "email": "john@acme.com",
    "phone": "+1234567890"
  }
]
```

---

### 2.5 Get Project Members
**Endpoint**: `GET /projects/:id/members`

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "user_id": "uuid",
    "assigned_from": "2024-01-15T10:30:00Z",
    "assigned_to": null,
    "is_current": true
  }
]
```

---

## 3. Sprints API

**Note**: Sprints are for analytics only - no locking or workflow enforcement.

### 3.1 Create Sprint
**Endpoint**: `POST /sprints`

**Request Body**:
```json
{
  "name": "Sprint 24-Q1-W1",
  "start_date": "2024-01-01",
  "end_date": "2024-01-07"
}
```

**Validation**:
- `end_date` must be after `start_date`
- Sprint name must be unique

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "Sprint 24-Q1-W1",
  "start_date": "2024-01-01",
  "end_date": "2024-01-07"
}
```

**Errors**:
- `400` - Invalid dates or missing fields
- `409` - Duplicate sprint name

---

### 3.2 Get All Sprints
**Endpoint**: `GET /sprints`

**Notes**: Results are ordered by `start_date DESC`

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "name": "Sprint 24-Q1-W2",
    "start_date": "2024-01-08",
    "end_date": "2024-01-14"
  },
  {
    "id": "uuid",
    "name": "Sprint 24-Q1-W1",
    "start_date": "2024-01-01",
    "end_date": "2024-01-07"
  }
]
```

---

### 3.3 Get Sprint by ID
**Endpoint**: `GET /sprints/:id`

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Sprint 24-Q1-W1",
  "start_date": "2024-01-01",
  "end_date": "2024-01-07"
}
```

**Errors**:
- `404` - Sprint not found

---

### 3.4 Update Sprint
**Endpoint**: `PATCH /sprints/:id`

**Request Body** (all fields optional):
```json
{
  "name": "Sprint 24-Q1-W1-Updated",
  "start_date": "2024-01-01",
  "end_date": "2024-01-08"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Sprint 24-Q1-W1-Updated",
  "start_date": "2024-01-01",
  "end_date": "2024-01-08"
}
```

**Errors**:
- `400` - Invalid dates
- `404` - Sprint not found

---

### 3.5 Delete Sprint
**Endpoint**: `DELETE /sprints/:id`

**Response** (200 OK):
```json
{
  "message": "Sprint deleted successfully"
}
```

**Errors**:
- `404` - Sprint not found

---

## 4. Tickets API

### 4.1 Create Ticket
**Endpoint**: `POST /tickets`

**Request Body**:
```json
{
  "project_id": "uuid",
  "sprint_id": "uuid",
  "title": "Create homepage hero section",
  "description": "Design and implement the hero section with CTA",
  "priority": "HIGH",
  "delivery_datetime": "2024-01-20T18:00:00Z",
  "delivery_slot": "Evening",
  "ad_name": "Hero Banner Ad",
  "creative_count": 3
}
```

**Required Fields**:
- `project_id`
- `title`
- `priority` (LOW, MEDIUM, HIGH, URGENT)

**Optional Fields**:
- `sprint_id`, `description`, `delivery_datetime`, `delivery_slot`, `ad_name`, `creative_count`

**Response** (201 Created):
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "sprint_id": "uuid",
  "title": "Create homepage hero section",
  "description": "Design and implement the hero section with CTA",
  "priority": "HIGH",
  "delivery_datetime": "2024-01-20T18:00:00Z",
  "delivery_slot": "Evening",
  "ad_name": "Hero Banner Ad",
  "creative_count": 3,
  "status": "CREATED",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Errors**:
- `400` - Missing required fields or invalid priority

---

### 4.2 Get All Tickets
**Endpoint**: `GET /tickets`

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "sprint_id": "uuid",
    "title": "Create homepage hero section",
    "description": "Design and implement the hero section with CTA",
    "priority": "HIGH",
    "delivery_datetime": "2024-01-20T18:00:00Z",
    "delivery_slot": "Evening",
    "ad_name": "Hero Banner Ad",
    "creative_count": 3,
    "status": "ASSIGNED",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### 4.3 Get Ticket by ID
**Endpoint**: `GET /tickets/:id`

**Response** (200 OK):
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "sprint_id": "uuid",
  "title": "Create homepage hero section",
  "description": "Design and implement the hero section with CTA",
  "priority": "HIGH",
  "delivery_datetime": "2024-01-20T18:00:00Z",
  "delivery_slot": "Evening",
  "ad_name": "Hero Banner Ad",
  "creative_count": 3,
  "status": "IN_PROGRESS",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Errors**:
- `404` - Ticket not found

---

### 4.4 Update Ticket
**Endpoint**: `PATCH /tickets/:id`

**Request Body** (all fields optional):
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "URGENT",
  "delivery_datetime": "2024-01-21T18:00:00Z",
  "status": "IN_PROGRESS"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "title": "Updated title",
  "description": "Updated description",
  "priority": "URGENT",
  "status": "IN_PROGRESS",
  ...
}
```

**Errors**:
- `400` - Invalid field values
- `404` - Ticket not found

---

### 4.5 Assign Ticket (Transactional)
**Endpoint**: `POST /tickets/:id/assign`

**Request Body**:
```json
{
  "user_id": "uuid"
}
```

**Business Rule**: **ONE Active Owner Rule** - Only one user can be actively assigned to a ticket at a time.

**Transaction Flow**:
1. Deactivate all existing active assignments (set `assignment_status = 'INACTIVE'`)
2. Create new assignment (set `assignment_status = 'ACTIVE'`)
3. Update ticket status to `ASSIGNED`
4. Emit `TICKET_ASSIGNED` event (triggers Slack + Email notifications)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "ticket_id": "uuid",
  "user_id": "uuid",
  "assigned_at": "2024-01-15T10:30:00Z",
  "unassigned_at": null,
  "assignment_status": "ACTIVE"
}
```

**Events Emitted**:
- `TICKET_ASSIGNED` - Triggers Slack + Email notifications (simulated)

**Errors**:
- `400` - Missing user_id or ticket already assigned to this user
- `404` - Ticket not found
- `500` - Transaction failed

---

### 4.6 Unassign Ticket
**Endpoint**: `POST /tickets/:id/unassign`

**Request Body**: None

**Response** (200 OK):
```json
{
  "message": "Ticket unassigned successfully"
}
```

**Errors**:
- `400` - Ticket has no active assignment
- `404` - Ticket not found

---

## 5. Iterations API

**Core Concepts**:
- **Iteration ≠ Ticket**: A ticket can have multiple iterations
- **Iteration**: Represents a submission attempt
- **Outcome**: PENDING, APPROVED, REVISION_REQUIRED

### 5.1 Create Iteration (Manual)
**Endpoint**: `POST /tickets/:id/iterations`

**Request Body**: None

**Notes**:
- Creates a new iteration with auto-incremented `iteration_number`
- Initial outcome is `PENDING`
- Typically used for manual iteration tracking

**Response** (201 Created):
```json
{
  "id": "uuid",
  "ticket_id": "uuid",
  "iteration_number": 1,
  "outcome": "PENDING",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Errors**:
- `404` - Ticket not found
- `409` - Iteration already exists (only for first iteration)

---

### 5.2 Get All Iterations for Ticket
**Endpoint**: `GET /tickets/:id/iterations`

**Notes**: Results ordered by `iteration_number ASC`

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "ticket_id": "uuid",
    "iteration_number": 1,
    "outcome": "REVISION_REQUIRED",
    "created_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": "uuid",
    "ticket_id": "uuid",
    "iteration_number": 2,
    "outcome": "APPROVED",
    "created_at": "2024-01-16T14:20:00Z"
  }
]
```

---

## 6. Approvals API

**Core Business Rules**:
1. **FTR = TRUE** only if approved at iteration 1
2. **FTR = FALSE** if rejected at any iteration (PERMANENT, LOCKED)
3. Rejection automatically creates a new iteration

### 6.1 Approve Ticket (Transactional)
**Endpoint**: `POST /tickets/:id/approve`

**Request Body**:
```json
{
  "approved_by": "user-uuid"
}
```

**Transaction Flow**:
1. Verify current iteration exists and outcome = `PENDING`
2. Update iteration outcome to `APPROVED`
3. Calculate FTR:
   - If `iteration_number === 1`: `first_time_right = TRUE`, `score = 100`
   - Else: `first_time_right = FALSE`, `score = 0`
4. Upsert FTR metric (with ON CONFLICT to prevent overwrite)
5. Update ticket status to `APPROVED`
6. Create approval record with status `APPROVED`

**Response** (200 OK):
```json
{
  "message": "Ticket approved successfully",
  "iteration": {
    "id": "uuid",
    "ticket_id": "uuid",
    "iteration_number": 1,
    "outcome": "APPROVED",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "approval": {
    "id": "uuid",
    "ticket_id": "uuid",
    "approved_by": "user-uuid",
    "status": "APPROVED",
    "approved_at": "2024-01-15T11:00:00Z"
  },
  "ftr": {
    "id": "uuid",
    "ticket_id": "uuid",
    "first_time_right": true,
    "score": "100.00"
  }
}
```

**FTR Scoring**:
- **Iteration 1 Approval**: FTR = TRUE, Score = 100
- **Iteration 2+ Approval**: FTR = FALSE, Score = 0 (locked from previous rejection)

**Errors**:
- `400` - Missing `approved_by`, no iteration exists, or iteration not pending
- `404` - Ticket not found
- `500` - Transaction failed

---

### 6.2 Reject Ticket / Request Revision (Transactional)
**Endpoint**: `POST /tickets/:id/reject`

**Request Body**:
```json
{
  "approved_by": "user-uuid",
  "reason": "Design doesn't match brand guidelines" // optional
}
```

**Transaction Flow**:
1. Verify current iteration exists and outcome = `PENDING`
2. Update current iteration outcome to `REVISION_REQUIRED`
3. **Create NEW iteration** with `iteration_number + 1`, outcome = `PENDING`
4. Set FTR = FALSE (score = 0) - **PERMANENT LOCK**
5. Update ticket status to `REVISION_REQUIRED`
6. Create approval record with status `REJECTED`

**Response** (200 OK):
```json
{
  "message": "Ticket rejected. Revision required. New iteration created.",
  "old_iteration": {
    "id": "uuid",
    "ticket_id": "uuid",
    "iteration_number": 1,
    "outcome": "REVISION_REQUIRED",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "new_iteration": {
    "id": "uuid",
    "ticket_id": "uuid",
    "iteration_number": 2,
    "outcome": "PENDING",
    "created_at": "2024-01-15T11:00:00Z"
  },
  "approval": {
    "id": "uuid",
    "ticket_id": "uuid",
    "approved_by": "user-uuid",
    "status": "REJECTED",
    "approved_at": "2024-01-15T11:00:00Z"
  },
  "ftr": {
    "id": "uuid",
    "ticket_id": "uuid",
    "first_time_right": false,
    "score": "0.00"
  }
}
```

**Critical**: Once FTR is set to FALSE, it can **NEVER** be changed to TRUE, even if iteration 2 is approved later.

**Errors**:
- `400` - Missing `approved_by`, no iteration exists, or iteration not pending
- `404` - Ticket not found
- `500` - Transaction failed

---

## Data Types

### TicketStatus Enum
- `CREATED` - Initial state
- `ASSIGNED` - Assigned to a user
- `IN_PROGRESS` - Work started
- `SUBMITTED` - Submitted for approval
- `APPROVED` - Approved by PM/client
- `REVISION_REQUIRED` - Needs rework
- `REASSIGNED` - Reassigned to another user
- `DELIVERED` - Final delivery
- `CLOSED` - Completed and closed
- `CANCELLED` - Cancelled

### TicketPriority Enum
- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

### IterationOutcome Enum
- `PENDING` - Awaiting approval
- `APPROVED` - Approved
- `REVISION_REQUIRED` - Rejected, needs rework

### ApprovalStatus Enum
- `APPROVED` - Approved
- `REJECTED` - Rejected

### AssignmentStatus Enum
- `ACTIVE` - Currently assigned
- `INACTIVE` - Previously assigned (historical)

---

## Error Responses

### General Error Format
```json
{
  "error": "Error message description"
}
```

### Common Status Codes
- `200 OK` - Successful GET/PATCH/POST/DELETE
- `201 Created` - Successful POST (resource created)
- `400 Bad Request` - Validation error, missing fields, business rule violation
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate entry (e.g., duplicate sprint name)
- `500 Internal Server Error` - Server error, transaction failure

---

## Transactional Endpoints

The following endpoints use PostgreSQL transactions (BEGIN/COMMIT/ROLLBACK):
- `POST /projects` - Project + POCs + Members created atomically
- `POST /tickets/:id/assign` - Assignment + Status update atomic
- `POST /tickets/:id/approve` - Iteration + FTR + Ticket + Approval atomic
- `POST /tickets/:id/reject` - Iteration update + New iteration + FTR + Ticket + Approval atomic

**Guarantee**: Either ALL operations succeed, or ALL are rolled back (no partial updates).

---

## Event-Driven Notifications

### PROJECT_CREATED Event
**Triggered By**: `POST /projects`
**Actions**:
- Simulated Slack channel creation: `#project-<project-name>`

### TICKET_ASSIGNED Event
**Triggered By**: `POST /tickets/:id/assign`
**Actions**:
- Simulated Slack notification to team channel
- Simulated email notification to assigned user

**Notes**: All notifications are simulated (console logs) in current implementation. Production would use real Slack/Email integrations.

---

## Testing

### Integration Tests Available
- `tests/integration/clients_projects.test.ts` - 20 tests
- `tests/integration/sprints.test.ts` - 14 tests
- `tests/integration/tickets.test.ts` - 18 tests
- `tests/integration/iterations_approvals.test.ts` - 17 tests

**Total: 69 integration tests, 100% passing**

### Running Tests
```bash
# Start server
npm run dev

# Run specific test
npx ts-node tests/integration/<test-file>.test.ts
```

---

## Database Schema

### Key Tables
- `users` - User/employee records
- `clients` - Client organizations
- `projects` - Projects
- `project_pocs` - Project points of contact
- `project_members` - Project team members (historical)
- `sprints` - Sprint definitions
- `tickets` - Work items
- `ticket_assignments` - Assignment history
- `ticket_iterations` - Iteration tracking
- `approvals` - Approval/rejection records
- `ftr_metrics` - First Time Right quality metrics (unique per ticket)

### Important Constraints
- `ftr_metrics.ticket_id` - UNIQUE (enables ON CONFLICT for FTR locking)
- Foreign keys with appropriate CASCADE/RESTRICT behavior

---

Last Updated: 2026-01-13 (STEP 7: Iterations & Approvals Complete)
