# Butler PMS API Documentation

This document describes the API endpoints available for testing via Postman.
Base URL: `http://localhost:3000`

## External Integrations (Slack & Email)

Butler PMS supports real-time notifications via Slack and Email. These integrations are **disabled by default** and must be configured in `.env`.

### Slack Integration Setup

1. **Create a Slack App**: https://api.slack.com/apps
2. **Enable Incoming Webhooks**:
   - Navigate to "Incoming Webhooks" in your app settings
   - Activate Incoming Webhooks
   - Click "Add New Webhook to Workspace"
   - Select the channel where notifications should be posted
   - Copy the Webhook URL
3. **Configure `.env`**:
   ```
   SLACK_ENABLED=true
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

**Slack Notifications Include**:
- 🎫 Ticket assigned (with priority color coding)
- 📝 Iteration submitted (with iteration number)
- 🎉 Iteration approved (with FTR status)
- ✍️ Revision required (with rejection reason)
- 🚀 Project created (with team details)

### Email Integration Setup

**Option 1: Gmail**
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Configure `.env`:
   ```
   EMAIL_ENABLED=true
   EMAIL_PROVIDER=gmail
   EMAIL_FROM=your-email@gmail.com
   EMAIL_FROM_NAME=Butler PMS
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   ```

**Option 2: SendGrid**
1. Sign up for SendGrid: https://sendgrid.com/
2. Create an API Key with "Mail Send" permissions
3. Configure `.env`:
   ```
   EMAIL_ENABLED=true
   EMAIL_PROVIDER=sendgrid
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=Butler PMS
   SENDGRID_API_KEY=SG.your_api_key_here
   ```

**Option 3: Generic SMTP**
1. Get SMTP credentials from your email provider
2. Configure `.env`:
   ```
   EMAIL_ENABLED=true
   EMAIL_PROVIDER=smtp
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=Butler PMS
   SMTP_HOST=smtp.yourdomain.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-smtp-username
   SMTP_PASSWORD=your-smtp-password
   ```

**Email Notifications Include**:
- Professional HTML templates with responsive design
- Ticket assignment notifications
- Iteration submission confirmations
- Approval notifications (with FTR badges)
- Revision requests (with detailed feedback)
- Project kickoff announcements (bulk to team)

### Testing Integrations

Run the integration test suite:
```bash
# Start API and Worker
npm run dev:api      # Terminal 1
npm run dev:worker   # Terminal 2

# Test integrations
npx ts-node -r tsconfig-paths/register tests/integration/test-integrations.ts
```

**Note**: If integrations are disabled, notifications will show as "Skipped (disabled)" in logs.

## Red Alerts (Alerting & Governance)

Butler PMS includes an automated Red Alert system that detects structural failures and quality issues.

### Alert Types

**1. Excessive Iterations (🔄)**
- **Trigger**: Ticket has > 2 iterations
- **Meaning**: Multiple revisions indicate quality issues
- **Action Required**: Review process, provide better requirements, improve quality control

**2. SLA Breach (⏰)**
- **Trigger**: Delivery date crossed but ticket not completed
- **Meaning**: Deadline missed, client expectations not met
- **Action Required**: Communicate with client, reassess timeline, expedite delivery

**3. Idle Ticket (💤)**
- **Trigger**: No updates for > 48 hours
- **Meaning**: Ticket stuck, possible blocker or abandonment
- **Action Required**: Check with assignee, remove blockers, reassign if needed

### Automated Detection

- **Scan Frequency**: Every 30 minutes (cron job in worker)
- **Scope**: All active tickets (status NOT IN CLOSED/CANCELLED/DELIVERED)
- **Deduplication**: Automatic (won't create duplicate alerts)
- **Resolution**: Automatic when condition fixed, or manual via API

### Notifications

When alerts are triggered:
- **Slack**: Rich card with alert details sent to team channel
- **Email**: HTML email sent to Admin, PM, and ticket assignee
- **In-App**: Visible in dashboards (Admin and PM only)

---

## Red Alerts API

### Get All Alerts
- **Method:** `GET`
- **URL:** `/alerts`
- **Query Parameters** (all optional):
  - `reason`: `EXCESSIVE_ITERATIONS` | `SLA_BREACH` | `IDLE_TICKET`
  - `project_id`: UUID
  - `ticket_id`: UUID
  - `from_date`: ISO date string
  - `to_date`: ISO date string
- **Response (200):**
```json
[
  {
    "id": "uuid",
    "ticket_id": "uuid",
    "reason": "EXCESSIVE_ITERATIONS",
    "triggered_at": "2026-01-13T12:00:00.000Z",
    "ticket_title": "Implement user authentication",
    "ticket_status": "IN_PROGRESS",
    "ticket_priority": "HIGH",
    "project_id": "uuid",
    "project_name": "Q1 Campaign",
    "assigned_to": "uuid",
    "assignee_name": "John Doe",
    "assignee_email": "john@example.com",
    "iteration_count": 3,
    "delivery_datetime": null,
    "last_updated": "2026-01-13T10:00:00.000Z"
  }
]
```

### Get Alert Statistics
- **Method:** `GET`
- **URL:** `/alerts/statistics`
- **Response (200):**
```json
{
  "total_alerts": 25,
  "active_alerts": 15,
  "by_reason": {
    "excessive_iterations": 8,
    "sla_breach": 5,
    "idle_ticket": 2
  },
  "by_project": [
    {
      "project_id": "uuid",
      "project_name": "Q1 Campaign",
      "alert_count": 7
    }
  ]
}
```

### Get Recent Alerts
- **Method:** `GET`
- **URL:** `/alerts/recent?hours=24`
- **Query Parameters**:
  - `hours`: number (default 24)
- **Response (200):** Array of alerts (same format as `/alerts`)

### Get Active Alerts Count
- **Method:** `GET`
- **URL:** `/alerts/count`
- **Response (200):**
```json
{
  "count": 15
}
```
- **Usage**: For dashboard badges/notifications

### Get Alerts for Ticket
- **Method:** `GET`
- **URL:** `/tickets/:id/alerts`
- **Response (200):**
```json
[
  {
    "id": "uuid",
    "ticket_id": "uuid",
    "reason": "EXCESSIVE_ITERATIONS",
    "triggered_at": "2026-01-13T12:00:00.000Z"
  }
]
```

### Get Alerts for Project
- **Method:** `GET`
- **URL:** `/projects/:id/alerts`
- **Response (200):** Array of alerts with full details (same format as `/alerts`)

### Manual Alert Scan (Admin Only)
- **Method:** `POST`
- **URL:** `/alerts/scan`
- **Description**: Manually trigger alert scan (useful for testing or immediate check)
- **Response (200):**
```json
{
  "message": "Alert scan completed",
  "new_alerts": {
    "excessive_iterations": 2,
    "sla_breach": 1,
    "idle_ticket": 0
  }
}
```

### Resolve Alerts for Ticket (Admin Only)
- **Method:** `POST`
- **URL:** `/tickets/:id/alerts/resolve`
- **Description**: Manually resolve all alerts for a ticket
- **Response (200):**
```json
{
  "message": "Alerts resolved successfully"
}
```

---

## Dashboard Integration

**Red Alerts are designed for dashboards:**
- Use `/alerts/statistics` for KPI cards
- Use `/alerts/count` for notification badges
- Use `/alerts/recent` for "Recent Activity" widgets
- Use `/alerts?project_id=...` for project-specific views
- Filter by `reason` for alert-type-specific views

**Color Coding Recommendations:**
- Excessive Iterations: 🟠 Orange (#FF9800)
- SLA Breach: 🔴 Red (#F44336)
- Idle Ticket: 🟡 Yellow (#FFC107)

**Visibility:**
- **Admin**: Can see all alerts across all projects
- **PM**: Can see alerts for their projects only
- **Employee**: Cannot see red alerts (dashboard permissions)

## Auth
| Method | Endpoint | Description | Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Login user | `{"email": "admin@butler.com", "password": "password"}` |

## Users (Lifecycle & CRUD)

### Create User
- **Method:** `POST`
- **URL:** `/users`
- **Body:**
```json
{
  "name": "New Employee",
  "email": "employee@butler.com",
  "password": "password123",
  "role": "EMPLOYEE"
}
```

### List All Users
- **Method:** `GET`
- **URL:** `/users`

### Get User Profile
- **Method:** `GET`
- **URL:** `/users/:id`

### Update User Profile
- **Method:** `PATCH`
- **URL:** `/users/:id`
- **Body:**
```json
{
  "name": "Updated Name"
}
```

### Initiate Exit (Employee Resignation)
- **Method:** `POST`
- **URL:** `/users/:id/exit`
- **Description:** Sets status to `EXIT_INITIATED`, sets exit request timestamp.

### List Exiting Users
- **Method:** `GET`
- **URL:** `/users/exits`
- **Description:** Returns all users with status `EXIT_INITIATED`.

### Offboard User (Admin Action)
- **Method:** `POST`
- **URL:** `/users/:id/offboard`
- **Description:** 
    - Sets status to `OFFBOARDED`, sets effective exit timestamp.
    - **Fails** (400) if the user has active ticket assignments.

## Master Data (Departments)

### List Departments
- **Method:** `GET`
- **URL:** `/departments`

### Create Department
- **Method:** `POST`
- **URL:** `/departments`
- **Body:** `{"name": "Tech"}`

### List Sub-Departments
- **Method:** `GET`
- **URL:** `/sub-departments`

### Create Sub-Department
- **Method:** `POST`
- **URL:** `/sub-departments`
- **Body:** `{"department_id": "uuid", "name": "Frontend"}`

## Clients

### Create Client
- **Method:** `POST`
- **URL:** `/clients`
- **Body:**
```json
{
  "name": "Acme Corporation"
}
```
- **Response (201):**
```json
{
  "id": "uuid",
  "name": "Acme Corporation"
}
```
- **Validation Errors:**
  - `400`: Client name is required
  - `409`: Client with this name already exists

### List All Clients
- **Method:** `GET`
- **URL:** `/clients`
- **Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Acme Corporation"
  }
]
```

## Projects

### Create Project (Simple)
- **Method:** `POST`
- **URL:** `/projects`
- **Body:**
```json
{
  "client_id": "uuid",
  "name": "Q1 Marketing Campaign"
}
```
- **Response (201):**
```json
{
  "project": {
    "id": "uuid",
    "client_id": "uuid",
    "name": "Q1 Marketing Campaign",
    "status": "ACTIVE",
    "created_at": "2026-01-13T00:00:00.000Z"
  },
  "pocs": [],
  "members": []
}
```

### Create Project (with POCs and Members)
- **Method:** `POST`
- **URL:** `/projects`
- **Body:**
```json
{
  "client_id": "uuid",
  "name": "Q1 Marketing Campaign",
  "pocs": [
    {
      "name": "John Doe",
      "email": "john@client.com",
      "phone": "555-1234"
    }
  ],
  "member_ids": ["user-uuid-1", "user-uuid-2"]
}
```
- **Response (201):**
```json
{
  "project": { ... },
  "pocs": [ ... ],
  "members": [ ... ]
}
```
- **Note:** Creates project, POCs, and member assignments atomically (transactional)
- **Triggers:** `PROJECT_CREATED` event for async Slack channel creation
- **Validation Errors:**
  - `400`: client_id and name are required

### List All Projects
- **Method:** `GET`
- **URL:** `/projects`
- **Response (200):**
```json
[
  {
    "id": "uuid",
    "client_id": "uuid",
    "name": "Q1 Marketing Campaign",
    "status": "ACTIVE",
    "created_at": "2026-01-13T00:00:00.000Z"
  }
]
```

### Get Project by ID
- **Method:** `GET`
- **URL:** `/projects/:id`
- **Response (200):**
```json
{
  "id": "uuid",
  "client_id": "uuid",
  "name": "Q1 Marketing Campaign",
  "status": "ACTIVE",
  "created_at": "2026-01-13T00:00:00.000Z"
}
```
- **Errors:**
  - `404`: Project not found

### Update Project
- **Method:** `PATCH`
- **URL:** `/projects/:id`
- **Body:**
```json
{
  "name": "Updated Project Name",
  "status": "ACTIVE"
}
```
- **Response (200):**
```json
{
  "id": "uuid",
  "client_id": "uuid",
  "name": "Updated Project Name",
  "status": "ACTIVE",
  "created_at": "2026-01-13T00:00:00.000Z"
}
```
- **Errors:**
  - `404`: Project not found

## Project POCs

### Add POC to Project
- **Method:** `POST`
- **URL:** `/projects/:id/pocs`
- **Body:**
```json
{
  "name": "Alice Cooper",
  "email": "alice@client.com",
  "phone": "555-5678"
}
```
- **Response (201):**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "name": "Alice Cooper",
  "email": "alice@client.com",
  "phone": "555-5678"
}
```
- **Validation Errors:**
  - `400`: POC name is required

### List POCs for Project
- **Method:** `GET`
- **URL:** `/projects/:id/pocs`
- **Response (200):**
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "name": "Alice Cooper",
    "email": "alice@client.com",
    "phone": "555-5678"
  }
]
```

## Project Members

### Assign Member to Project
- **Method:** `POST`
- **URL:** `/projects/:id/members`
- **Body:**
```json
{
  "user_id": "uuid"
}
```
- **Response (201):**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "user_id": "uuid",
  "assigned_from": "2026-01-13T00:00:00.000Z",
  "assigned_to": null,
  "is_current": true
}
```
- **Validation Errors:**
  - `400`: user_id is required
  - `409`: User is already assigned to this project

### List Members for Project
- **Method:** `GET`
- **URL:** `/projects/:id/members`
- **Description:** Returns current members only (is_current = TRUE) with user details
- **Response (200):**
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "user_id": "uuid",
    "assigned_from": "2026-01-13T00:00:00.000Z",
    "assigned_to": null,
    "is_current": true,
    "user_name": "John Employee",
    "user_email": "john@butler.com"
  }
]
```

### Remove Member from Project
- **Method:** `DELETE`
- **URL:** `/projects/:id/members/:userId`
- **Description:** Sets `is_current = FALSE` and `assigned_to = CURRENT_TIMESTAMP` (historical tracking)
- **Response:** `204 No Content`
- **Errors:**
  - `404`: Member not found or already unassigned

## Comments

**Note:** Comments are used for collaboration on tickets. They are NOT attached to specific iterations.

### Create Comment on Ticket
- **Method:** `POST`
- **URL:** `/tickets/:id/comments`
- **Body:**
```json
{
  "user_id": "uuid",
  "content": "This is a comment on the ticket"
}
```
- **Response (201):**
```json
{
  "id": "uuid",
  "ticket_id": "uuid",
  "user_id": "uuid",
  "content": "This is a comment on the ticket",
  "created_at": "2026-01-13T00:00:00.000Z"
}
```
- **Validation Errors:**
  - `400`: user_id is required
  - `400`: content is required and cannot be empty
- **Errors:**
  - `404`: Ticket not found

### Get All Comments for Ticket
- **Method:** `GET`
- **URL:** `/tickets/:id/comments`
- **Response (200):**
```json
[
  {
    "id": "uuid",
    "ticket_id": "uuid",
    "user_id": "uuid",
    "content": "This is a comment",
    "created_at": "2026-01-13T00:00:00.000Z",
    "user_name": "John Employee",
    "user_email": "john@butler.com"
  }
]
```
- **Note:** Returns comments ordered by `created_at DESC` (newest first) with user details
- **Errors:**
  - `404`: Ticket not found

## File Attachments

**Critical Business Rule:** Files are ALWAYS linked to an iteration. The `iteration_id` field is mandatory.

**Note:** This API stores file METADATA only. Actual blob storage (S3, etc.) is abstracted and handled separately.

### Upload File (Metadata)
- **Method:** `POST`
- **URL:** `/files/upload`
- **Body:**
```json
{
  "ticket_id": "uuid",
  "iteration_id": "uuid",
  "file_url": "https://s3.amazonaws.com/bucket/design-v1.png",
  "file_type": "image/png",
  "uploaded_by": "uuid"
}
```
- **Response (201):**
```json
{
  "id": "uuid",
  "ticket_id": "uuid",
  "iteration_id": "uuid",
  "file_url": "https://s3.amazonaws.com/bucket/design-v1.png",
  "file_type": "image/png",
  "uploaded_by": "uuid",
  "uploaded_at": "2026-01-13T00:00:00.000Z"
}
```
- **Validation Errors:**
  - `400`: ticket_id is required
  - `400`: iteration_id is required - files must be linked to an iteration
  - `400`: file_url is required and cannot be empty
  - `400`: uploaded_by (user_id) is required
- **Errors:**
  - `404`: Ticket not found
- **Future Enhancement:** Will emit Slack update event on upload

### Get All Files for Ticket
- **Method:** `GET`
- **URL:** `/tickets/:id/files`
- **Description:** Returns all file attachments for a ticket with uploader details
- **Response (200):**
```json
[
  {
    "id": "uuid",
    "ticket_id": "uuid",
    "iteration_id": "uuid",
    "file_url": "https://s3.amazonaws.com/bucket/design-v1.png",
    "file_type": "image/png",
    "uploaded_by": "uuid",
    "uploaded_at": "2026-01-13T00:00:00.000Z",
    "uploader_name": "John Employee",
    "uploader_email": "john@butler.com"
  }
]
```
- **Note:** Returns files ordered by `uploaded_at DESC` (newest first)
- **Errors:**
  - `404`: Ticket not found



## Sprints

**Note:** Sprints are for **analytics and grouping only**. They do NOT control ticket state or implement locking logic. Tickets can be created and modified regardless of sprint dates.

### Create Sprint
- **Method:** `POST`
- **URL:** `/sprints`
- **Body:**
```json
{
  "name": "Sprint 1",
  "start_date": "2026-01-20",
  "end_date": "2026-02-03"
}
```
- **Date Formats Accepted:**
  - ISO Date String: `"2026-01-20"`
  - ISO DateTime String: `"2026-01-20T00:00:00Z"`
- **Response (201):**
```json
{
  "id": "uuid",
  "name": "Sprint 1",
  "start_date": "2026-01-19T18:30:00.000Z",
  "end_date": "2026-02-02T18:30:00.000Z"
}
```
- **Validation Errors:**
  - `400`: Missing required fields (name, start_date, end_date)
  - `400`: Empty sprint name
  - `400`: Invalid date format
  - `400`: end_date must be after start_date
  - `409`: Sprint with this name already exists

### List All Sprints
- **Method:** `GET`
- **URL:** `/sprints`
- **Description:** Returns sprints ordered by `start_date DESC` (most recent first)
- **Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Sprint 2",
    "start_date": "2026-02-05T00:00:00.000Z",
    "end_date": "2026-02-19T00:00:00.000Z"
  },
  {
    "id": "uuid",
    "name": "Sprint 1",
    "start_date": "2026-01-20T00:00:00.000Z",
    "end_date": "2026-02-03T00:00:00.000Z"
  }
]
```

### Get Sprint by ID
- **Method:** `GET`
- **URL:** `/sprints/:id`
- **Response (200):**
```json
{
  "id": "uuid",
  "name": "Sprint 1",
  "start_date": "2026-01-20T00:00:00.000Z",
  "end_date": "2026-02-03T00:00:00.000Z"
}
```
- **Errors:**
  - `404`: Sprint not found

## Tickets (HEART OF PMS)

**Note:** Tickets are the core work units. They follow a strict state machine and enforce **exactly ONE active owner** per ticket.

### Create Ticket
- **Method:** `POST`
- **URL:** `/tickets`
- **Body (Minimal):**
```json
{
  "project_id": "uuid",
  "title": "Implement user authentication",
  "priority": "HIGH"
}
```
- **Body (Full):**
```json
{
  "project_id": "uuid",
  "sprint_id": "uuid",
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication with role-based access control",
  "priority": "HIGH",
  "delivery_datetime": "2026-02-01T10:00:00Z",
  "delivery_slot": "Morning",
  "ad_name": "Campaign Ad Name",
  "creative_count": 5
}
```
- **Priority Values:** `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- **Response (201):**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "sprint_id": null,
  "title": "Implement user authentication",
  "description": null,
  "priority": "HIGH",
  "delivery_datetime": null,
  "delivery_slot": null,
  "ad_name": null,
  "creative_count": null,
  "status": "CREATED",
  "created_at": "2026-01-13T00:00:00.000Z"
}
```
- **Validation Errors:**
  - `400`: project_id, title, and priority are required
  - `400`: Title cannot be empty
  - `400`: Invalid priority value

### List All Tickets
- **Method:** `GET`
- **URL:** `/tickets`
- **Description:** Returns tickets ordered by `created_at DESC`
- **Response (200):**
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "sprint_id": "uuid",
    "title": "Implement user authentication",
    "description": "...",
    "priority": "HIGH",
    "delivery_datetime": "2026-02-01T10:00:00.000Z",
    "delivery_slot": "Morning",
    "ad_name": "Campaign Ad",
    "creative_count": 5,
    "status": "ASSIGNED",
    "created_at": "2026-01-13T00:00:00.000Z"
  }
]
```

### Get Ticket by ID
- **Method:** `GET`
- **URL:** `/tickets/:id`
- **Response (200):**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "sprint_id": "uuid",
  "title": "Implement user authentication",
  "description": "...",
  "priority": "HIGH",
  "status": "ASSIGNED",
  "created_at": "2026-01-13T00:00:00.000Z"
}
```
- **Errors:**
  - `404`: Ticket not found

### Update Ticket
- **Method:** `PATCH`
- **URL:** `/tickets/:id`
- **Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "URGENT",
  "delivery_datetime": "2026-02-05T14:00:00Z",
  "delivery_slot": "Afternoon",
  "ad_name": "New Ad Name",
  "creative_count": 10,
  "sprint_id": "uuid"
}
```
- **Note:** All fields are optional. Only provided fields will be updated.
- **Response (200):**
```json
{
  "id": "uuid",
  "title": "Updated title",
  "description": "Updated description",
  "priority": "URGENT",
  "..."
}
```
- **Validation Errors:**
  - `400`: Title cannot be empty
  - `400`: Invalid priority value
- **Errors:**
  - `404`: Ticket not found

  - `404`: Ticket not found

## Notifications (In-App)

**Note:** Notifications are generated automatically by the event system (e.g., when a ticket is assigned).

### Get Current User Notifications
- **Method:** `GET`
- **URL:** `/notifications?user_id=uuid`
- **Description:** Returns the last 50 notifications for the user.
- **Response (200):**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "New Ticket Assigned",
    "message": "You have been assigned to ticket: \"Implement Auth\"",
    "event_type": "TICKET_ASSIGNED",
    "entity_id": "ticket-uuid",
    "is_read": false,
    "created_at": "2026-01-13T00:00:00.000Z"
  }
]
```

### Get Unread Count
- **Method:** `GET`
- **URL:** `/notifications/unread/count?user_id=uuid`
- **Response (200):**
```json
{
  "count": 5
}
```

### Mark Notification as Read
- **Method:** `PATCH`
- **URL:** `/notifications/:id/read`
- **Response (200):**
```json
{
  "status": "success",
  "message": "Notification marked as read"
}
```

## Ticket Assignment


**Critical Business Rule:** Exactly **ONE active owner** per ticket. Reassignment automatically deactivates previous assignment.

### Assign Ticket to User
- **Method:** `POST`
- **URL:** `/tickets/:id/assign`
- **Body:**
```json
{
  "user_id": "uuid"
}
```
- **State Transition:** `CREATED` → `ASSIGNED` (on first assignment)
- **Triggers:** `TICKET_ASSIGNED` event → Slack + Email notifications
- **Response (200):**
```json
{
  "message": "Ticket assigned successfully",
  "assignment": {
    "id": "uuid",
    "ticket_id": "uuid",
    "user_id": "uuid",
    "assigned_at": "2026-01-13T00:00:00.000Z",
    "unassigned_at": null,
    "assignment_status": "ACTIVE"
  }
}
```
- **Validation Errors:**
  - `400`: user_id is required
  - `400`: Ticket is already assigned to this user
- **Errors:**
  - `404`: Ticket not found

### Unassign Ticket (Exit Flow Only)
- **Method:** `POST`
- **URL:** `/tickets/:id/unassign`
- **Description:** Deactivates active assignment and updates ticket status to `REASSIGNED`. Used when employee exits.
- **State Transition:** `*` → `REASSIGNED`
- **Response (200):**
```json
{
  "message": "Ticket unassigned successfully"
}
```
- **Validation Errors:**
  - `400`: Ticket has no active assignment to unassign
- **Errors:**
  - `404`: Ticket not found

---

## Iterations & Approvals

**Critical Business Logic:**
- **Iterations**: Track revision cycles. A ticket starts at Iteration 1. Each rejection creates a new iteration.
- **FTR (First Time Right)**: TRUE only if ticket is approved in Iteration 1. Once rejected, FTR is permanently FALSE.
- **State Machine**: Iterations have outcomes: PENDING → APPROVED or REVISION_REQUIRED
- **Transactional**: Approval/rejection operations are atomic (updates iteration, creates FTR metric, updates ticket status, creates approval record)

### Create Iteration (Manual)
- **Method:** `POST`
- **URL:** `/tickets/:id/iterations`
- **Description:** Manually create a new iteration for a ticket. Usually iterations are auto-created on rejection.
- **Response (201):**
```json
{
  "id": "uuid",
  "ticket_id": "uuid",
  "iteration_number": 2,
  "outcome": "PENDING",
  "created_at": "2026-01-13T00:00:00.000Z"
}
```
- **Errors:**
  - `404`: Ticket not found

### Get All Iterations for Ticket
- **Method:** `GET`
- **URL:** `/tickets/:id/iterations`
- **Description:** Returns all iterations for a ticket ordered by iteration_number ASC
- **Response (200):**
```json
[
  {
    "id": "uuid",
    "ticket_id": "uuid",
    "iteration_number": 1,
    "outcome": "REVISION_REQUIRED",
    "created_at": "2026-01-13T10:00:00.000Z"
  },
  {
    "id": "uuid",
    "ticket_id": "uuid",
    "iteration_number": 2,
    "outcome": "PENDING",
    "created_at": "2026-01-13T12:00:00.000Z"
  }
]
```

### Approve Ticket
- **Method:** `POST`
- **URL:** `/tickets/:id/approve`
- **Description:** Approve the current iteration and mark ticket as approved
- **Body:**
```json
{
  "approved_by": "uuid"
}
```
- **Response (200):**
```json
{
  "message": "Ticket approved successfully",
  "iteration": {
    "id": "uuid",
    "ticket_id": "uuid",
    "iteration_number": 1,
    "outcome": "APPROVED",
    "created_at": "2026-01-13T10:00:00.000Z"
  },
  "approval": {
    "id": "uuid",
    "ticket_id": "uuid",
    "approved_by": "uuid",
    "status": "APPROVED",
    "approved_at": "2026-01-13T14:00:00.000Z"
  },
  "ftr": {
    "id": "uuid",
    "ticket_id": "uuid",
    "first_time_right": true,
    "score": 100
  }
}
```
- **Side Effects:**
  - Current iteration outcome → APPROVED
  - FTR calculated (TRUE if iteration 1, FALSE otherwise)
  - Ticket status → APPROVED
  - Creates approval record with status APPROVED
  - Emits ITERATION_APPROVED event (triggers Slack/Email notifications)
- **Validation Errors:**
  - `400`: approved_by is required
  - `400`: No iteration found for this ticket. Create an iteration first.
  - `400`: Current iteration is not pending. Cannot approve.
- **Errors:**
  - `404`: Ticket not found

### Reject Ticket / Request Revision
- **Method:** `POST`
- **URL:** `/tickets/:id/reject`
- **Description:** Reject the current iteration and create a new iteration for revision
- **Body:**
```json
{
  "approved_by": "uuid",
  "reason": "Missing authentication logic"
}
```
- **Response (200):**
```json
{
  "message": "Ticket rejected. Revision required. New iteration created.",
  "old_iteration": {
    "id": "uuid",
    "ticket_id": "uuid",
    "iteration_number": 1,
    "outcome": "REVISION_REQUIRED",
    "created_at": "2026-01-13T10:00:00.000Z"
  },
  "new_iteration": {
    "id": "uuid",
    "ticket_id": "uuid",
    "iteration_number": 2,
    "outcome": "PENDING",
    "created_at": "2026-01-13T14:00:00.000Z"
  },
  "approval": {
    "id": "uuid",
    "ticket_id": "uuid",
    "approved_by": "uuid",
    "status": "REJECTED",
    "approved_at": "2026-01-13T14:00:00.000Z"
  },
  "ftr": {
    "id": "uuid",
    "ticket_id": "uuid",
    "first_time_right": false,
    "score": 0
  }
}
```
- **Side Effects:**
  - Current iteration outcome → REVISION_REQUIRED
  - Creates NEW iteration with iteration_number + 1
  - FTR locked to FALSE permanently
  - Ticket status → REVISION_REQUIRED
  - Creates approval record with status REJECTED
  - Emits ITERATION_REJECTED event (triggers Slack/Email notifications with reason)
- **Validation Errors:**
  - `400`: approved_by is required
  - `400`: No iteration found for this ticket. Create an iteration first.
  - `400`: Current iteration is not pending. Cannot reject.
- **Errors:**
  - `404`: Ticket not found

---

## Analytics

**Note:** All analytics are computed server-side. Frontend just renders the data. Queries are optimized for performance.

### Get Overview Analytics
- **Method:** `GET`
- **URL:** `/analytics/overview`
- **Description:** System-wide KPIs for dashboard
- **Response (200):**
```json
{
  "summary": {
    "total_tickets": 150,
    "total_completed": 100,
    "total_in_progress": 30,
    "total_pending": 20,
    "completion_rate": 66.67
  },
  "ftr_metrics": {
    "total_ftr": 80,
    "total_non_ftr": 20,
    "ftr_percentage": 80.0
  },
  "resolution_metrics": {
    "avg_resolution_hours": 48.5,
    "median_resolution_hours": 36.0,
    "fastest_resolution_hours": 4.0,
    "slowest_resolution_hours": 120.0
  },
  "iterations_metrics": {
    "avg_iterations_per_ticket": 1.3
  },
  "status_distribution": [
    { "status": "CREATED", "count": 10 },
    { "status": "ASSIGNED", "count": 15 },
    { "status": "IN_PROGRESS", "count": 30 },
    { "status": "APPROVED", "count": 50 },
    { "status": "DELIVERED", "count": 45 }
  ],
  "priority_distribution": [
    { "priority": "LOW", "count": 30 },
    { "priority": "MEDIUM", "count": 60 },
    { "priority": "HIGH", "count": 40 },
    { "priority": "URGENT", "count": 20 }
  ],
  "recent_activity": {
    "tickets_created_today": 5,
    "tickets_completed_today": 8
  }
}
```
- **Use Cases:**
  - Dashboard KPI cards
  - Status/priority pie charts
  - FTR gauge visualization

### Get Sprint Analytics
- **Method:** `GET`
- **URL:** `/analytics/sprints/:sprintId`
- **Description:** Sprint-specific metrics with burndown data
- **Response (200):**
```json
{
  "sprint": {
    "id": "uuid",
    "name": "Sprint 5",
    "start_date": "2026-01-01T00:00:00.000Z",
    "end_date": "2026-01-15T00:00:00.000Z"
  },
  "total_tickets": 25,
  "completed_tickets": 18,
  "in_progress_tickets": 5,
  "pending_tickets": 2,
  "completion_rate": 72.0,
  "avg_iterations": 1.4,
  "ftr_count": 15,
  "ftr_percentage": 83.33,
  "timeline": [
    { "date": "2026-01-01", "completed_count": 0, "cumulative_count": 0 },
    { "date": "2026-01-02", "completed_count": 2, "cumulative_count": 2 },
    { "date": "2026-01-03", "completed_count": 3, "cumulative_count": 5 },
    { "date": "2026-01-04", "completed_count": 1, "cumulative_count": 6 }
  ],
  "velocity": {
    "tickets_per_day": 1.2,
    "estimated_completion_date": "2026-01-12T00:00:00.000Z",
    "on_track": true
  }
}
```
- **Use Cases:**
  - Sprint burndown charts (use timeline data)
  - Velocity tracking
  - Sprint completion prediction

### Get All Users Performance (Leaderboard)
- **Method:** `GET`
- **URL:** `/analytics/users`
- **Description:** Performance metrics for all users with ranking
- **Response (200):**
```json
{
  "users": [
    {
      "user_id": "uuid",
      "user_name": "John Doe",
      "user_email": "john@butler.com",
      "total_tickets": 45,
      "completed_tickets": 40,
      "in_progress_tickets": 3,
      "pending_tickets": 2,
      "avg_iterations": 1.2,
      "ftr_count": 35,
      "ftr_percentage": 87.5,
      "avg_resolution_hours": 32.5,
      "rank": 1,
      "active_streak_days": 15
    }
  ],
  "leaderboard": [
    {
      "user_id": "uuid",
      "user_name": "John Doe",
      "ftr_percentage": 87.5,
      "avg_resolution_hours": 32.5,
      "rank": 1
    }
  ]
}
```
- **Use Cases:**
  - Team leaderboard
  - Performance comparison
  - Gamification

### Get User Performance
- **Method:** `GET`
- **URL:** `/analytics/users/:userId`
- **Description:** Individual user performance metrics
- **Response (200):**
```json
{
  "user_id": "uuid",
  "user_name": "John Doe",
  "user_email": "john@butler.com",
  "total_tickets": 45,
  "completed_tickets": 40,
  "in_progress_tickets": 3,
  "pending_tickets": 2,
  "avg_iterations": 1.2,
  "ftr_count": 35,
  "ftr_percentage": 87.5,
  "avg_resolution_hours": 32.5,
  "rank": 1,
  "active_streak_days": 15
}
```
- **Use Cases:**
  - User profile dashboard
  - Performance reviews

---

## Response Sheets (Client Reporting)

**Critical Business Rule:** Response sheets are **SNAPSHOTS**. Once generated, the data is immutable and stored in JSONB. Historical sheets never recompute.

### Generate Response Sheet
- **Method:** `POST`
- **URL:** `/response-sheets`
- **Body:**
```json
{
  "project_id": "uuid"
}
```
- **Response (201):**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "snapshot_data": {
    "project": { "id": "uuid", "name": "Q1 Campaign", "status": "ACTIVE", "created_at": "..." },
    "client": { "id": "uuid", "name": "Acme Corp" },
    "pocs": [...],
    "team": [...],
    "tickets": [...],
    "summary": {
      "total_tickets": 50,
      "completed_tickets": 45,
      "in_progress_tickets": 3,
      "pending_tickets": 2,
      "ftr_percentage": 85.0,
      "avg_resolution_hours": 36.5,
      "avg_iterations": 1.3
    }
  },
  "generated_at": "2026-01-13T14:00:00.000Z",
  "sent_at": null,
  "sent_to": [],
  "avg_resolution_time": 36.5
}
```
- **Use Cases:**
  - Monthly client reports
  - Historical project auditing
  - Compliance documentation

### Send Response Sheet
- **Method:** `POST`
- **URL:** `/response-sheets/:id/send`
- **Body:**
```json
{
  "email_addresses": ["client@example.com", "pm@butler.com"]
}
```
- **Response (200):**
```json
{
  "message": "Response sheet sent successfully"
}
```
- **Note:** Updates `sent_at` and `sent_to` fields

### Get Response Sheet by ID
- **Method:** `GET`
- **URL:** `/response-sheets/:id`
- **Response (200):**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "snapshot_data": { ... },
  "generated_at": "2026-01-13T14:00:00.000Z",
  "sent_at": "2026-01-13T15:00:00.000Z",
  "sent_to": ["client@example.com"],
  "avg_resolution_time": 36.5
}
```

### List Response Sheets
- **Method:** `GET`
- **URL:** `/response-sheets?project_id=uuid`
- **Query Parameters:**
  - `project_id` (optional): Filter by project
- **Response (200):**
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "generated_at": "2026-01-13T14:00:00.000Z",
    "sent_at": "2026-01-13T15:00:00.000Z",
    "project_name": "Q1 Campaign",
    "client_name": "Acme Corp",
    "total_tickets": 50,
    "ftr_percentage": 85.0
  }
]
```
- **Note:** List view returns summary fields extracted from snapshot_data for performance

---

**End of API Documentation**


