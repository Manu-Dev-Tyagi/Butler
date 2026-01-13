# Butler PMS - AI Context Documentation

## Project Overview
Butler is an Enterprise-grade Project Management System with an analytics-driven execution framework designed for content production and creative agencies.

### Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js 5.2.1
- **Language**: TypeScript 5.9.3
- **Database**: PostgreSQL 15+
- **Authentication**: JWT
- **Testing**: Integration tests with axios

---

## Architecture Patterns

### 1. Modular Structure
- Domain-driven design with feature modules
- Each module contains: types, repository, service, controller
- Located in `modules/` directory

### 2. Repository Pattern
- All repositories extend `BaseRepository<T>`
- Database abstraction layer
- Type-safe query execution

### 3. Service Layer
- Business logic implementation
- Transactional operations using PostgreSQL `pool.connect()`
- ACID compliance for critical operations

### 4. Controller Layer
- HTTP request/response handling
- Input validation
- Error handling with appropriate status codes

### 5. Event-Driven Architecture
- EventEmitter pattern for async operations
- Event publishers in `events/publishers/`
- Event subscribers in `events/subscribers/`
- Non-blocking notifications (Slack, Email)

---

## Database Design

### Schema Characteristics
- **3NF Normalized**: No redundant data
- **Exit-Safe Design**: Employee departure doesn't break data integrity
- **Historical Preservation**: Soft deletes, assignment/iteration history maintained
- **Referential Integrity**: Foreign keys with CASCADE behavior where appropriate

### Key Tables
1. **users** - Employee records (never deleted)
2. **clients** - Client organizations
3. **projects** - Projects with client relationships
4. **tickets** - Work items with state machine
5. **ticket_assignments** - Historical assignment tracking
6. **ticket_iterations** - Revision tracking for quality control
7. **ftr_metrics** - First Time Right quality metrics
8. **approvals** - Approval/rejection records

---

## Implemented Features

### STEP 4: Client & Project Management

#### Modules
- `modules/clients/` - Client CRUD operations
- `modules/projects/` - Project management with transactional creation

#### Key Features
- **Transactional Project Creation**: Atomic creation of project + POCs + members
- **PROJECT_CREATED Event**: Triggers Slack channel creation (simulated)
- **Project POCs**: Multiple points of contact per project
- **Project Members**: Historical tracking with `is_current` flag

#### Repository Pattern
```typescript
// Example: ProjectsRepository.createWithRelations()
async createWithRelations(
    projectData: { client_id, name, status },
    pocs: Array<{ name, email?, phone? }>,
    memberIds: string[]
): Promise<{ project, pocs, members }>
```

#### Files
- `modules/clients/clients.repository.ts`
- `modules/clients/clients.service.ts`
- `modules/clients/clients.controller.ts`
- `modules/projects/projects.repository.ts`
- `modules/projects/projects.service.ts`
- `modules/projects/projects.controller.ts`
- `events/publishers/project.publisher.ts`
- `events/subscribers/project.subscriber.ts`

#### Tests
- `tests/integration/clients_projects.test.ts` - 20 tests, ALL PASSING

---

### STEP 5: Sprints (Analytics Only)

#### Purpose
Sprints are for analytics and reporting ONLY. No locking logic or workflow enforcement.

#### Key Features
- CRUD operations for sprint management
- Date validation (end_date > start_date)
- Duplicate name prevention
- Ordered retrieval (by start_date DESC)

#### Files
- `modules/sprints/sprints.repository.ts`
- `modules/sprints/sprints.service.ts`
- `modules/sprints/sprints.controller.ts`

#### Tests
- `tests/integration/sprints.test.ts` - 14 tests, ALL PASSING

---

### STEP 6: Tickets (Heart of PMS)

#### State Machine
**TicketStatus Enum** (10 states):
- CREATED → ASSIGNED → IN_PROGRESS → SUBMITTED → APPROVED
- APPROVED → DELIVERED → CLOSED
- Alternative: SUBMITTED → REVISION_REQUIRED → back to IN_PROGRESS
- Special: CANCELLED, REASSIGNED

#### ONE Active Owner Rule
**Critical Business Rule**: A ticket can have ONLY ONE active owner at any time.

**Implementation**:
```typescript
// TicketsRepository.assignTicket() - Transactional
1. BEGIN
2. Deactivate all existing active assignments (SET assignment_status = 'INACTIVE')
3. Create new assignment (assignment_status = 'ACTIVE')
4. Update ticket status to 'ASSIGNED'
5. COMMIT (or ROLLBACK on error)
6. Emit TICKET_ASSIGNED event
```

#### Key Features
- **Ticket Priorities**: LOW, MEDIUM, HIGH, URGENT
- **Historical Assignment Tracking**: All assignments preserved with timestamps
- **Transactional Assignment**: Prevents race conditions
- **Event-Driven Notifications**: TICKET_ASSIGNED triggers Slack + Email

#### Files
- `modules/tickets/tickets.types.ts`
- `modules/tickets/tickets.repository.ts`
- `modules/tickets/tickets.service.ts`
- `modules/tickets/tickets.controller.ts`
- `events/publishers/ticket.publisher.ts`
- `events/subscribers/ticket.subscriber.ts`

#### Tests
- `tests/integration/tickets.test.ts` - 18 tests, ALL PASSING
- Event emission verified

---

### STEP 7: Iterations & Approvals (Quality Control)

#### Core Business Rules

**1. Iteration ≠ Ticket**
- A ticket can have multiple iterations
- Each iteration represents a submission attempt

**2. FTR (First Time Right) Calculation**
- **FTR = TRUE** ONLY if approved at iteration 1
- **FTR = FALSE** if rejected at any iteration (PERMANENT, LOCKED)
- Once FTR is FALSE, it can NEVER become TRUE

**3. Rejection Creates New Iteration**
- Rejecting a ticket automatically creates the next iteration
- Old iteration marked as REVISION_REQUIRED
- New iteration created with status PENDING

#### Data Model

**IterationOutcome Enum**:
- PENDING - Awaiting approval
- APPROVED - Approved by PM/client
- REVISION_REQUIRED - Rejected, needs rework

**ApprovalStatus Enum**:
- APPROVED - Ticket approved
- REJECTED - Ticket rejected

#### FTR Locking Mechanism
```sql
-- ftr_metrics table has UNIQUE constraint on ticket_id
ALTER TABLE ftr_metrics ADD CONSTRAINT ftr_metrics_ticket_id_unique UNIQUE (ticket_id);

-- ON CONFLICT ensures FTR can't be changed once set
INSERT INTO ftr_metrics (ticket_id, first_time_right, score)
VALUES ($1, $2, $3)
ON CONFLICT (ticket_id)
DO UPDATE SET first_time_right = EXCLUDED.first_time_right, score = EXCLUDED.score
```

#### Approval Flow (Transactional)
```typescript
// IterationsService.approveTicket()
1. BEGIN
2. Verify current iteration exists and outcome = PENDING
3. Update iteration outcome to APPROVED
4. Calculate FTR:
   - If iteration_number === 1: FTR = TRUE, score = 100
   - Else: FTR = FALSE, score = 0
5. Upsert FTR metric (with ON CONFLICT)
6. Update ticket status to APPROVED
7. Create approval record (status = APPROVED)
8. COMMIT
```

#### Rejection Flow (Transactional)
```typescript
// IterationsService.rejectTicket()
1. BEGIN
2. Verify current iteration exists and outcome = PENDING
3. Update current iteration outcome to REVISION_REQUIRED
4. Create NEW iteration with iteration_number + 1, outcome = PENDING
5. Set FTR = FALSE (score = 0) - PERMANENT LOCK
6. Update ticket status to REVISION_REQUIRED
7. Create approval record (status = REJECTED)
8. COMMIT
```

#### Key Features
- **Manual Iteration Creation**: POST /tickets/:id/iterations
- **Automatic Iteration Creation**: On rejection
- **FTR Calculation Logic**: Based on iteration number
- **FTR Immutability**: Once FALSE, always FALSE
- **Transactional Integrity**: All operations atomic

#### Files
- `modules/iterations/iterations.types.ts`
- `modules/iterations/iterations.repository.ts` (3 repositories)
  - IterationsRepository
  - ApprovalsRepository
  - FTRMetricsRepository
- `modules/iterations/iterations.service.ts`
- `modules/iterations/iterations.controller.ts`

#### Tests
- `tests/integration/iterations_approvals.test.ts` - 17 tests, ALL PASSING

**Test Coverage**:
1. Create first iteration
2. Get all iterations
3. Approve at iteration 1 (FTR = TRUE)
4. Reject ticket (creates iteration 2, FTR = FALSE)
5. Verify iteration count after rejection
6. Approve iteration 2 (FTR remains FALSE - locked)
7. Validation: approve without approved_by
8. Validation: reject without approved_by
9. Try to approve already approved ticket
10. Try to approve ticket without iteration
11. Try to reject ticket without iteration
12. Create multiple iterations manually
13. Reject with optional reason
14. Approve non-existent ticket
15. Reject already approved ticket
16. Multiple rejections (FTR remains FALSE)

---

## API Routes

### Clients
- `POST /clients` - Create client
- `GET /clients` - List all clients
- `GET /clients/:id` - Get client by ID

### Projects
- `POST /projects` - Create project (with POCs & members)
- `GET /projects` - List all projects
- `GET /projects/:id` - Get project by ID
- `GET /projects/:id/pocs` - Get project POCs
- `GET /projects/:id/members` - Get project members

### Sprints
- `POST /sprints` - Create sprint
- `GET /sprints` - List all sprints (ordered by start_date DESC)
- `GET /sprints/:id` - Get sprint by ID
- `PATCH /sprints/:id` - Update sprint
- `DELETE /sprints/:id` - Delete sprint

### Tickets
- `POST /tickets` - Create ticket
- `GET /tickets` - List all tickets
- `GET /tickets/:id` - Get ticket by ID
- `PATCH /tickets/:id` - Update ticket
- `POST /tickets/:id/assign` - Assign ticket to user (transactional)
- `POST /tickets/:id/unassign` - Unassign ticket

### Iterations & Approvals
- `POST /tickets/:id/iterations` - Create iteration manually
- `GET /tickets/:id/iterations` - Get all iterations for ticket
- `POST /tickets/:id/approve` - Approve ticket (FTR calculation)
- `POST /tickets/:id/reject` - Reject ticket (creates new iteration, locks FTR)

---

## Critical Implementation Details

### 1. Path Aliases (tsconfig.json)
```json
{
  "compilerOptions": {
    "paths": {
      "@modules/*": ["modules/*"],
      "@common/*": ["common/*"],
      "@database/*": ["database/*"],
      "@events/*": ["events/*"],
      "@integrations/*": ["integrations/*"]
    }
  }
}
```

### 2. Database Connection Export
```typescript
// database/connection.ts
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
```

### 3. Transaction Pattern
```typescript
const client: PoolClient = await pool.connect();
try {
    await client.query('BEGIN');
    // ... operations
    await client.query('COMMIT');
} catch (error) {
    await client.query('ROLLBACK');
    throw error;
} finally {
    client.release();
}
```

### 4. Event Pattern
```typescript
// Publisher
import { eventEmitter } from '@events/emitter';
eventEmitter.emit('PROJECT_CREATED', projectId);

// Subscriber
eventEmitter.on('PROJECT_CREATED', async (projectId) => {
    // Async operations (Slack, Email)
});
```

### 5. Type Safety
- All DTOs defined in `*.types.ts` files
- Enums for all fixed-value fields
- Interface definitions for all entities

---

## Testing Strategy

### Integration Tests
- Full HTTP request/response cycle
- Database operations included
- Event emission verification
- Axios for HTTP calls
- Pattern: Setup → Execute → Verify → Cleanup

### Test Execution
```bash
npm run dev  # Start server
npx ts-node tests/integration/<test-file>.test.ts
```

### Test Results (All Passing)
- clients_projects.test.ts: 20 tests ✅
- sprints.test.ts: 14 tests ✅
- tickets.test.ts: 18 tests ✅
- iterations_approvals.test.ts: 17 tests ✅

**Total: 69 integration tests, 100% passing**

---

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate entries)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": "Error message"
}
```

---

## Future Considerations

### Pending Features
- Comments module
- File attachments
- Red alerts
- Notifications (database-backed)
- Response sheets
- Analytics dashboard

### Optimization Opportunities
- Database indexes (already defined in schema for common queries)
- Caching layer for frequently accessed data
- Pagination for large result sets
- Bulk operations

---

## Development Guidelines

### Code Organization
1. **Types First**: Define all types/interfaces before implementation
2. **Repository Layer**: Pure database operations
3. **Service Layer**: Business logic + transactions
4. **Controller Layer**: HTTP handling + validation
5. **Events**: Async, non-blocking side effects

### Naming Conventions
- Files: kebab-case (e.g., `iterations.service.ts`)
- Classes: PascalCase (e.g., `IterationsService`)
- Functions: camelCase (e.g., `approveTicket`)
- Constants/Enums: UPPER_SNAKE_CASE (e.g., `REVISION_REQUIRED`)

### Commit Standards
- Feature implementation → Integration tests → Documentation
- All tests must pass before considering feature complete
- Update AI_CONTEXT.md and API_DOCUMENTATION.md for each feature

---

## Environment Variables

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user@localhost:5432/butler_pms
JWT_SECRET=<your-secret>
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Setup database
psql -U manu -d butler_pms -f database/schema.sql

# Start development server
npm run dev

# Run integration tests
npx ts-node tests/integration/<test-name>.test.ts
```

---

Last Updated: 2026-01-13 (STEP 7: Iterations & Approvals Complete)
