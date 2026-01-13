# Butler PMS API Documentation

This document describes the API endpoints available for testing via Postman.
Base URL: `http://localhost:3000`

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


