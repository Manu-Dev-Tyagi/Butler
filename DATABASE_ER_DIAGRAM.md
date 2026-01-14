# Butler PMS - Entity Relationship Diagram (Text Format)

## 📐 Visual Schema Overview

```
┌─────────────────┐
│     USERS       │
│─────────────────│
│ id (PK)         │
│ name            │
│ email (UNIQUE)  │
│ role            │
│ employment_status│
└────────┬────────┘
         │
         ├─────────────────────────────────────────────┐
         │                                             │
         │                                             │
    ┌────▼──────────┐                          ┌──────▼──────────┐
    │USER_DEPARTMENTS│                          │TICKET_ASSIGNMENTS│
    │────────────────│                          │──────────────────│
    │ user_id (FK)   │                          │ ticket_id (FK)   │
    │ sub_dept_id(FK)│                          │ user_id (FK)     │
    └────┬───────────┘                          └──────┬───────────┘
         │                                             │
         │                                             │
    ┌────▼──────────┐                          ┌──────▼───────────┐
    │SUB_DEPARTMENTS│                          │     TICKETS       │
    │────────────────│                          │───────────────────│
    │ id (PK)        │                          │ id (PK)           │
    │ department_id  │                          │ project_id (FK)   │
    │ name           │                          │ sprint_id (FK)    │
    └────┬───────────┘                          │ title             │
         │                                       │ status            │
         │                                       │ priority          │
    ┌────▼──────────┐                          │ delivery_datetime │
    │  DEPARTMENTS  │                          └──────┬──────────────┘
    │────────────────│                                 │
    │ id (PK)        │                                 │
    │ name           │                                 │
    └────────────────┘                                 │
                                                        │
                                                        │
         ┌─────────────────────────────────────────────┼──────────────────────┐
         │                                             │                      │
         │                                             │                      │
    ┌────▼──────────┐                          ┌──────▼───────────┐   ┌─────▼──────────┐
    │   PROJECTS    │                          │TICKET_ITERATIONS │   │   APPROVALS   │
    │───────────────│                          │──────────────────│   │────────────────│
    │ id (PK)       │                          │ ticket_id (FK)   │   │ ticket_id (FK) │
    │ client_id(FK) │                          │ iteration_number │   │ approved_by(FK)│
    │ name          │                          │ outcome          │   │ status         │
    │ status        │                          └──────────────────┘   └────────────────┘
    └────┬──────────┘
         │
         ├─────────────────────────────────────────────────────────────┐
         │                                                             │
    ┌────▼──────────┐                          ┌──────▼───────────┐   │
    │ PROJECT_POCS  │                          │PROJECT_MEMBERS   │   │
    │───────────────│                          │──────────────────│   │
    │ project_id(FK)│                          │ project_id (FK)  │   │
    │ name          │                          │ user_id (FK)     │   │
    │ email         │                          │ is_current       │   │
    │ phone         │                          └──────────────────┘   │
    └───────────────┘                                                  │
                                                                        │
    ┌──────────────────────────────────────────────────────────────────┘
    │
    │
┌───▼────────────┐
│    CLIENTS     │
│────────────────│
│ id (PK)        │
│ name           │
└────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                         TICKETS (Central Entity)                    │
└─────────────────────────────────────────────────────────────────────┘
         │
         ├───► COMMENTS (ticket_id)
         │     └─── user_id → USERS
         │
         ├───► FILE_ATTACHMENTS (ticket_id)
         │     └─── uploaded_by → USERS
         │     └─── iteration_id → TICKET_ITERATIONS
         │
         ├───► FTR_METRICS (ticket_id, UNIQUE)
         │
         └───► RED_ALERTS (ticket_id)


┌─────────────────────────────────────────────────────────────────────┐
│                         SYSTEM TABLES                                │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   EVENTS     │         │NOTIFICATIONS │         │RESPONSE_SHEETS│
│──────────────│         │──────────────│         │──────────────│
│ event_type   │         │ user_id (FK) │         │ project_id(FK)│
│ entity_type  │         │ ticket_id(FK)│         │ snapshot_data │
│ entity_id    │         │ is_read      │         │ sent_to       │
│ status       │         │ created_at   │         │ generated_at  │
│ payload(JSONB)│        └──────────────┘         └──────────────┘
└──────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                         SPRINTS                                      │
│─────────────────────────────────────────────────────────────────────│
│ id (PK)                                                              │
│ name                                                                 │
│ start_date                                                           │
│ end_date                                                             │
│                                                                      │
│ └───► TICKETS (sprint_id)                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Relationships

### **One-to-Many:**
- `CLIENTS` → `PROJECTS` (1 client has many projects)
- `PROJECTS` → `TICKETS` (1 project has many tickets)
- `PROJECTS` → `PROJECT_POCS` (1 project has many POCs)
- `PROJECTS` → `PROJECT_MEMBERS` (1 project has many members)
- `TICKETS` → `TICKET_ITERATIONS` (1 ticket has many iterations)
- `TICKETS` → `COMMENTS` (1 ticket has many comments)
- `TICKETS` → `FILE_ATTACHMENTS` (1 ticket has many files)
- `USERS` → `TICKET_ASSIGNMENTS` (1 user has many assignments)
- `USERS` → `NOTIFICATIONS` (1 user has many notifications)
- `SPRINTS` → `TICKETS` (1 sprint has many tickets)

### **Many-to-Many:**
- `USERS` ↔ `SUB_DEPARTMENTS` (via `USER_DEPARTMENTS`)
- `USERS` ↔ `PROJECTS` (via `PROJECT_MEMBERS`)
- `USERS` ↔ `TICKETS` (via `TICKET_ASSIGNMENTS`)

### **One-to-One:**
- `TICKETS` → `FTR_METRICS` (1 ticket has 1 FTR metric)

---

## 📊 Data Flow Patterns

### **Ticket Lifecycle:**
```
CREATED → ASSIGNED → IN_PROGRESS → SUBMITTED → APPROVED/REVISION_REQUIRED → DELIVERED → CLOSED
```

### **Project Workflow:**
```
Project Created → Members Assigned → Tickets Created → Tickets Assigned → Work Done → Response Sheet Generated
```

### **User Assignment Flow:**
```
User → Assigned to Project → Assigned to Tickets → Work on Tickets → Submit for Approval
```

---

## 🎯 Frontend View Mapping

| Database Entity | Frontend Views | Status |
|----------------|----------------|--------|
| **USERS** | User List, User Profile, User Directory | ⚠️ Partial |
| **PROJECTS** | Project List, Project Detail | ✅ Complete |
| **TICKETS** | Ticket List, Ticket Detail, Create Ticket | ✅ Complete |
| **CLIENTS** | Client List, Client Management | ⚠️ Partial |
| **SPRINTS** | Sprint List, Sprint Analytics | ⚠️ Partial |
| **COMMENTS** | Comments List (in Ticket Detail) | ✅ Complete |
| **FILE_ATTACHMENTS** | File Upload (in Ticket Detail) | ✅ Complete |
| **NOTIFICATIONS** | Notification Panel | ✅ Complete |
| **RED_ALERTS** | Red Alerts Widget | ✅ Complete |
| **RESPONSE_SHEETS** | Response Sheet List (in Project Detail) | ✅ Complete |
| **TICKET_ITERATIONS** | Iteration Timeline (in Ticket Detail) | ✅ Complete |
| **APPROVALS** | Approval Panel (in Ticket Detail) | ✅ Complete |
| **FTR_METRICS** | Analytics Dashboard | ⚠️ Partial |
| **DEPARTMENTS** | Department List | ❌ Missing |
| **PROJECT_MEMBERS** | Project Members (in Project Detail) | ✅ Complete |
| **PROJECT_POCS** | POC List (in Project Detail) | ✅ Complete |

**Legend:**
- ✅ Complete - Fully implemented
- ⚠️ Partial - Partially implemented
- ❌ Missing - Not yet implemented

---

## 🚀 Next Steps for Frontend Development

Based on the schema, prioritize these views:

1. **User Management** - Complete user CRUD operations
2. **Department Management** - Department/sub-department hierarchy
3. **Kanban Board** - Visual ticket status board
4. **Analytics Dashboard** - FTR metrics, performance charts
5. **Calendar View** - Sprint and delivery date calendar
6. **Advanced Search** - Global search across entities
7. **Activity Feed** - Real-time activity stream
8. **Admin Panel** - System monitoring and configuration

---

**Status:** ✅ **Complete ER Diagram Documentation**
