# Butler PMS - Complete Database Schema

## 📊 Overview

**Database Type:** PostgreSQL  
**Schema Type:** 3NF Normalized  
**Total Tables:** 20  
**Primary Keys:** UUID (using uuid-ossp extension)

---

## 🗂️ Table Structure

### 1. **USERS** 👥
**Purpose:** Stores all employees. Users are never deleted (soft delete via employment_status).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(150) | NOT NULL | Full name |
| `email` | VARCHAR(150) | NOT NULL, UNIQUE | Email address |
| `password_hash` | VARCHAR(255) | | Encrypted password |
| `role` | VARCHAR(50) | NOT NULL, CHECK | 'ADMIN', 'PM', 'EMPLOYEE' |
| `employment_status` | VARCHAR(50) | NOT NULL, DEFAULT 'ACTIVE', CHECK | 'ACTIVE', 'EXIT_INITIATED', 'OFFBOARDED' |
| `is_assignable` | BOOLEAN | DEFAULT TRUE | Can be assigned to tickets |
| `exit_requested_at` | TIMESTAMP | | When exit was requested |
| `exit_effective_at` | TIMESTAMP | | When exit becomes effective |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation date |

**Indexes:**
- `idx_users_employment_status` on `employment_status`

**Frontend Views:**
- User Management (Admin)
- User Profile
- Employee Directory
- Offboarding Portal
- User Leaderboard

---

### 2. **DEPARTMENTS** 🏢
**Purpose:** Organizational departments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(100) | NOT NULL | Department name |

**Frontend Views:**
- Department List
- Department Management (Admin)

---

### 3. **SUB_DEPARTMENTS** 🏛️
**Purpose:** Sub-departments within departments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `department_id` | UUID | NOT NULL, FK → departments(id) | Parent department |
| `name` | VARCHAR(100) | NOT NULL | Sub-department name |

**Indexes:**
- `idx_sub_dept_department_id` on `department_id`

**Frontend Views:**
- Sub-Department List (filtered by department)
- Department Hierarchy View

---

### 4. **USER_DEPARTMENTS** 🔗
**Purpose:** Junction table - Users assigned to sub-departments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `user_id` | UUID | NOT NULL, FK → users(id) | User |
| `sub_department_id` | UUID | NOT NULL, FK → sub_departments(id) | Sub-department |

**Frontend Views:**
- User Department Assignment
- Department Members View

---

### 5. **CLIENTS** 🏢
**Purpose:** External clients/customers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(150) | NOT NULL | Client name |

**Frontend Views:**
- Client List
- Client Management
- Client Projects View

---

### 6. **PROJECTS** 📁
**Purpose:** Client projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `client_id` | UUID | NOT NULL, FK → clients(id) | Client |
| `name` | VARCHAR(150) | NOT NULL | Project name |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'ACTIVE' | Project status |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |

**Frontend Views:**
- Project List (with client info)
- Project Detail Page ✅
- Project Overview
- Project Status Management

---

### 7. **PROJECT_POCS** 📞
**Purpose:** Points of Contact for projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `project_id` | UUID | NOT NULL, FK → projects(id) | Project |
| `name` | VARCHAR(150) | NOT NULL | POC name |
| `email` | VARCHAR(150) | | Email address |
| `phone` | VARCHAR(20) | | Phone number |

**Indexes:**
- `idx_project_pocs_project_id` on `project_id`

**Frontend Views:**
- POC List (in Project Detail) ✅
- POC Management
- Contact Information Display

---

### 8. **PROJECT_MEMBERS** 👥
**Purpose:** Historical assignment of users to projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `project_id` | UUID | NOT NULL, FK → projects(id) | Project |
| `user_id` | UUID | NOT NULL, FK → users(id) | User |
| `assigned_from` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Assignment start |
| `assigned_to` | TIMESTAMP | | Assignment end (NULL = current) |
| `is_current` | BOOLEAN | DEFAULT TRUE | Currently assigned |

**Frontend Views:**
- Project Members List ✅
- Add/Remove Members
- Member History Timeline

---

### 9. **SPRINTS** 🏃
**Purpose:** Sprint/iteration periods.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(100) | NOT NULL | Sprint name |
| `start_date` | DATE | NOT NULL | Sprint start |
| `end_date` | DATE | NOT NULL | Sprint end |

**Frontend Views:**
- Sprint List
- Sprint Calendar
- Sprint Analytics ✅
- Active Sprint View

---

### 10. **TICKETS** 🎫
**Purpose:** Work items/tasks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `project_id` | UUID | NOT NULL, FK → projects(id) | Project |
| `sprint_id` | UUID | FK → sprints(id) | Sprint (optional) |
| `title` | VARCHAR(200) | NOT NULL | Ticket title |
| `description` | TEXT | | Detailed description |
| `priority` | VARCHAR(20) | NOT NULL, CHECK | 'LOW', 'MEDIUM', 'HIGH', 'URGENT' |
| `delivery_datetime` | TIMESTAMP | | Expected delivery |
| `delivery_slot` | VARCHAR(50) | | 'Morning', 'Afternoon', etc. |
| `ad_name` | VARCHAR(150) | | Ad campaign name |
| `creative_count` | INT | | Number of creatives |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'CREATED', CHECK | Status enum (see below) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |

**Status Values:**
- `CREATED` - Just created, not assigned
- `ASSIGNED` - Assigned to someone
- `IN_PROGRESS` - Work in progress
- `SUBMITTED` - Submitted for approval
- `APPROVED` - Approved by PM
- `REVISION_REQUIRED` - Needs revision
- `REASSIGNED` - Reassigned to someone else
- `DELIVERED` - Delivered to client
- `CLOSED` - Completed and closed
- `CANCELLED` - Cancelled

**Indexes:**
- `idx_tickets_project_id` on `project_id`
- `idx_tickets_status` on `status`
- `idx_tickets_delivery_datetime` on `delivery_datetime`

**Frontend Views:**
- Ticket List (with filters) ✅
- Ticket Detail Page ✅
- Ticket Creation Form ✅
- Ticket Status Board (Kanban)
- Ticket Timeline ✅
- Ticket Search

---

### 11. **TICKET_ASSIGNMENTS** 👤
**Purpose:** Active owner history for tickets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `ticket_id` | UUID | NOT NULL, FK → tickets(id) | Ticket |
| `user_id` | UUID | NOT NULL, FK → users(id) | Assigned user |
| `assigned_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Assignment date |
| `unassigned_at` | TIMESTAMP | | Unassignment date (NULL = current) |
| `assignment_status` | VARCHAR(50) | DEFAULT 'ACTIVE' | Assignment status |

**Indexes:**
- `idx_ticket_assignments_ticket_id` on `ticket_id`
- `idx_ticket_assignments_user_id` on `user_id`

**Frontend Views:**
- Current Assignee Display ✅
- Assignment History
- Reassignment Interface
- My Assigned Tickets

---

### 12. **TICKET_ITERATIONS** 🔄
**Purpose:** Iteration history for tickets (revision cycles).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `ticket_id` | UUID | NOT NULL, FK → tickets(id) | Ticket |
| `iteration_number` | INT | NOT NULL | Iteration number (1, 2, 3...) |
| `outcome` | VARCHAR(50) | CHECK | 'PENDING', 'APPROVED', 'REVISION_REQUIRED' |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Iteration date |

**Frontend Views:**
- Iteration Timeline ✅
- Iteration History
- Revision Tracking

---

### 13. **APPROVALS** ✅
**Purpose:** Approval records for tickets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `ticket_id` | UUID | NOT NULL, FK → tickets(id) | Ticket |
| `approved_by` | UUID | NOT NULL, FK → users(id) | Approver |
| `status` | VARCHAR(50) | NOT NULL, CHECK | 'APPROVED', 'REJECTED' |
| `approved_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Approval date |

**Frontend Views:**
- Approval Panel ✅
- Approval History
- Pending Approvals List

---

### 14. **COMMENTS** 💬
**Purpose:** Comments on tickets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `ticket_id` | UUID | NOT NULL, FK → tickets(id) | Ticket |
| `user_id` | UUID | NOT NULL, FK → users(id) | Commenter |
| `content` | TEXT | NOT NULL | Comment text |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Comment date |

**Frontend Views:**
- Comments List ✅
- Comment Thread
- Add Comment Form

---

### 15. **FILE_ATTACHMENTS** 📎
**Purpose:** Files attached to tickets/iterations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `ticket_id` | UUID | NOT NULL, FK → tickets(id) | Ticket |
| `iteration_id` | UUID | FK → ticket_iterations(id) | Iteration (optional) |
| `file_url` | TEXT | NOT NULL | File storage URL |
| `file_type` | VARCHAR(50) | | File MIME type |
| `uploaded_by` | UUID | NOT NULL, FK → users(id) | Uploader |
| `uploaded_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Upload date |

**Frontend Views:**
- File Upload Component ✅
- File List
- File Preview
- File Download

---

### 16. **FTR_METRICS** 📊
**Purpose:** First Time Right metrics for tickets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `ticket_id` | UUID | NOT NULL, UNIQUE, FK → tickets(id) | Ticket |
| `first_time_right` | BOOLEAN | DEFAULT FALSE | Was approved on first iteration? |
| `score` | DECIMAL(5,2) | | FTR score (0-100) |

**Frontend Views:**
- FTR Metrics Dashboard
- FTR Score Display
- Analytics Charts

---

### 17. **RED_ALERTS** 🚨
**Purpose:** Alert system for problematic tickets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `ticket_id` | UUID | NOT NULL, FK → tickets(id) | Ticket |
| `reason` | TEXT | NOT NULL | Alert reason |
| `triggered_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Alert date |

**Alert Types:**
- Excessive Iterations (>3)
- SLA Breach (delivery date passed)
- Idle Tickets (no activity for 48h)

**Frontend Views:**
- Red Alerts Widget ✅
- Alerts List
- Alert Details
- Alert Resolution

---

### 18. **EVENTS** 📨
**Purpose:** Event queue for cron-based processing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `event_type` | VARCHAR(100) | NOT NULL | Event type |
| `entity_type` | VARCHAR(50) | NOT NULL | Entity type ('TICKET', 'PROJECT') |
| `entity_id` | UUID | NOT NULL | Entity ID |
| `payload` | JSONB | NOT NULL | Event data |
| `status` | VARCHAR(20) | DEFAULT 'PENDING', CHECK | 'PENDING', 'PROCESSING', 'DONE', 'FAILED' |
| `retry_count` | INT | DEFAULT 0 | Retry attempts |
| `error_message` | TEXT | | Error details |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |
| `processed_at` | TIMESTAMP | | Processing date |

**Indexes:**
- `idx_events_status` on `status`
- `idx_events_entity` on `(entity_type, entity_id)`
- `idx_events_created_at` on `created_at`

**Frontend Views:**
- Event Queue Monitor (Admin)
- Event Processing Status

---

### 19. **NOTIFICATIONS** 🔔
**Purpose:** In-app notifications for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `user_id` | UUID | FK → users(id) | Recipient |
| `ticket_id` | UUID | FK → tickets(id) | Related ticket |
| `title` | VARCHAR(255) | | Notification title |
| `message` | TEXT | | Notification message |
| `event_type` | VARCHAR(100) | | Event type |
| `entity_id` | UUID | | Related entity ID |
| `is_read` | BOOLEAN | DEFAULT FALSE | Read status |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |

**Indexes:**
- `idx_notifications_user_read` on `(user_id, is_read)`
- `idx_notifications_created` on `created_at`

**Frontend Views:**
- Notification Panel ✅
- Notification Bell (unread count)
- Notification List
- Mark as Read

---

### 20. **RESPONSE_SHEETS** 📋
**Purpose:** Project response sheets (snapshots).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `project_id` | UUID | NOT NULL, FK → projects(id) | Project |
| `snapshot_data` | JSONB | NOT NULL | Complete project snapshot |
| `generated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Generation date |
| `sent_at` | TIMESTAMP | | Email sent date |
| `sent_to` | TEXT[] | | Email recipients array |
| `avg_resolution_time` | DECIMAL(6,2) | | Average resolution time |

**Indexes:**
- `idx_response_sheets_project_id` on `project_id`
- `idx_response_sheets_generated_at` on `generated_at`

**Frontend Views:**
- Response Sheet List ✅
- Generate Response Sheet
- Response Sheet Detail
- Send Response Sheet

---

## 🔗 Entity Relationships

```
USERS
  ├── USER_DEPARTMENTS → SUB_DEPARTMENTS → DEPARTMENTS
  ├── TICKET_ASSIGNMENTS → TICKETS
  ├── APPROVALS → TICKETS
  ├── COMMENTS → TICKETS
  ├── FILE_ATTACHMENTS → TICKETS
  └── NOTIFICATIONS

CLIENTS
  └── PROJECTS
      ├── PROJECT_POCS
      ├── PROJECT_MEMBERS → USERS
      ├── TICKETS
      └── RESPONSE_SHEETS

TICKETS
  ├── TICKET_ASSIGNMENTS → USERS
  ├── TICKET_ITERATIONS
  ├── APPROVALS → USERS
  ├── COMMENTS → USERS
  ├── FILE_ATTACHMENTS → USERS
  ├── FTR_METRICS
  └── RED_ALERTS

SPRINTS
  └── TICKETS

EVENTS
  └── (references TICKETS, PROJECTS via entity_type/entity_id)
```

---

## 📱 Recommended Frontend Views

### ✅ Already Implemented
1. **Project Detail Page** - Overview, Members, Tickets, Response Sheets
2. **Ticket Detail Page** - Timeline, Comments, Files, Approval Panel
3. **Dashboard Pages** - Admin, PM, Employee
4. **Project Table** - List all projects
5. **Ticket Table** - List tickets with filters
6. **Notification Panel** - In-app notifications

### 🎯 Recommended New Views

#### **1. User Management Views**
- **User List** - Table with filters (role, status, department)
- **User Profile** - Individual user details, assigned tickets, performance
- **User Directory** - Browse all users with search
- **Department Hierarchy** - Tree view of departments/sub-departments

#### **2. Ticket Management Views**
- **Kanban Board** - Drag-and-drop status board
- **Ticket Calendar** - Calendar view by delivery date
- **My Tickets** - Personal ticket dashboard
- **Ticket Search** - Advanced search with filters
- **Bulk Actions** - Select multiple tickets for actions

#### **3. Analytics & Reporting Views**
- **FTR Dashboard** - First Time Right metrics
- **Sprint Velocity** - Sprint completion rates
- **User Performance** - Individual metrics
- **Project Analytics** - Project-level KPIs
- **Time Tracking** - Resolution time analysis

#### **4. Alert & Monitoring Views**
- **Red Alerts Dashboard** - All active alerts
- **Alert Details** - Individual alert information
- **Alert History** - Resolved alerts
- **SLA Monitoring** - Upcoming deadlines

#### **5. Communication Views**
- **Activity Feed** - Recent activity across projects
- **Comment Threads** - Enhanced comment UI
- **Notification Center** - Full notification management
- **Mentions** - @mention functionality

#### **6. Administrative Views**
- **Event Queue Monitor** - System events status
- **System Health** - Database, API status
- **User Activity Log** - Audit trail
- **Settings** - System configuration

---

## 🎨 UI Component Recommendations

Based on the schema, here are recommended UI components:

1. **Data Tables** - For lists (users, tickets, projects, clients)
2. **Kanban Boards** - For ticket status management
3. **Timeline Components** - For iterations, assignments, comments
4. **Calendar Views** - For sprints, delivery dates
5. **Charts/Graphs** - For analytics and metrics
6. **Forms** - For creating/editing entities
7. **Modals** - For quick actions
8. **Filters** - For advanced filtering
9. **Search Bars** - For global search
10. **Status Badges** - For status indicators

---

## 📊 Key Metrics to Display

Based on schema fields:

1. **Ticket Metrics:**
   - Total tickets by status
   - Tickets by priority
   - Average resolution time
   - FTR percentage
   - Iteration count distribution

2. **Project Metrics:**
   - Active projects count
   - Projects by status
   - Tickets per project
   - Average tickets per project

3. **User Metrics:**
   - Active users count
   - Users by role
   - Tickets assigned per user
   - User performance scores

4. **Time Metrics:**
   - SLA compliance rate
   - Average delivery time
   - Sprint completion rate
   - Response time

---

## 🔍 Query Patterns for Frontend

### Common Queries:

1. **Get user's assigned tickets:**
   ```sql
   SELECT t.* FROM tickets t
   JOIN ticket_assignments ta ON t.id = ta.ticket_id
   WHERE ta.user_id = ? AND ta.unassigned_at IS NULL
   ```

2. **Get project with all relations:**
   ```sql
   SELECT p.*, c.name as client_name,
          (SELECT json_agg(poc) FROM project_pocs poc WHERE poc.project_id = p.id) as pocs,
          (SELECT json_agg(pm) FROM project_members pm WHERE pm.project_id = p.id AND pm.is_current = true) as members
   FROM projects p
   JOIN clients c ON p.client_id = c.id
   WHERE p.id = ?
   ```

3. **Get ticket with full details:**
   ```sql
   SELECT t.*, 
          (SELECT u.name FROM users u JOIN ticket_assignments ta ON u.id = ta.user_id WHERE ta.ticket_id = t.id AND ta.unassigned_at IS NULL LIMIT 1) as assignee_name,
          (SELECT json_agg(iter) FROM ticket_iterations iter WHERE iter.ticket_id = t.id ORDER BY iter.iteration_number) as iterations
   FROM tickets t
   WHERE t.id = ?
   ```

---

**Status:** ✅ **Complete Database Schema Documentation**

Use this schema to plan and implement all frontend views and components!
