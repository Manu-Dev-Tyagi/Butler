# Response Sheets API Documentation

## Overview

Response Sheets provide snapshot-based client reporting for Butler PMS. Each sheet captures a complete point-in-time state of a project and is **never recomputed**, ensuring historical accuracy.

## Key Concepts

- **Snapshot Data**: Complete project state captured at generation time
- **Immutability**: Historical sheets are never recalculated
- **JSONB Storage**: Full snapshot persisted in database for querying and preservation

## Base URL

```
http://localhost:3000
```

## Authentication

All endpoints require Bearer token authentication.

---

## Endpoints

### 1. POST /response-sheets

**Description**: Generates a new response sheet for a project by capturing a complete snapshot of its current state.

**Authentication**: Required

**Request Body**:
```json
{
    "project_id": "uuid-here"
}
```

**Response** (201 Created):
```json
{
    "status": "success",
    "message": "Response sheet generated successfully",
    "data": {
        "id": "sheet-uuid",
        "project_id": "project-uuid",
        "generated_at": "2026-01-13T10:30:00.000Z",
        "snapshot_data": {
            "project": {
                "id": "project-uuid",
                "name": "Client Website Redesign",
                "status": "ACTIVE",
                "created_at": "2026-01-01T00:00:00.000Z"
            },
            "client": {
                "id": "client-uuid",
                "name": "Acme Corporation"
            },
            "pocs": [
                {
                    "name": "John Doe",
                    "email": "john@acme.com",
                    "phone": "+1234567890"
                }
            ],
            "team_members": [
                {
                    "user_id": "user-uuid",
                    "name": "Jane Smith",
                    "email": "jane@company.com",
                    "role": "EMPLOYEE",
                    "assigned_from": "2026-01-01T00:00:00.000Z"
                }
            ],
            "tickets": [
                {
                    "id": "ticket-uuid",
                    "title": "Homepage Design",
                    "description": "Design new homepage layout",
                    "priority": "HIGH",
                    "status": "APPROVED",
                    "delivery_datetime": "2026-01-15T12:00:00.000Z",
                    "created_at": "2026-01-05T08:00:00.000Z",
                    "assigned_to": "user-uuid",
                    "assignee_name": "Jane Smith",
                    "iteration_count": 1,
                    "first_time_right": true,
                    "resolution_hours": 24.5
                }
            ],
            "summary": {
                "total_tickets": 10,
                "completed_tickets": 7,
                "in_progress_tickets": 2,
                "pending_tickets": 1,
                "ftr_percentage": 85.71,
                "avg_resolution_hours": 28.3,
                "total_iterations": 12,
                "avg_iterations_per_ticket": 1.2
            },
            "generated_at": "2026-01-13T10:30:00.000Z"
        }
    }
}
```

**Use Cases**:
- Generate monthly project reports
- Create milestone documentation
- Capture project state before major changes

---

### 2. POST /response-sheets/:id/send

**Description**: Sends a response sheet via email to specified recipients.

**Authentication**: Required

**Request Body**:
```json
{
    "recipients": ["client@example.com", "manager@example.com"],
    "subject": "Project Progress Report - January 2026",
    "message": "Please find attached your project progress report."
}
```

**Response** (200 OK):
```json
{
    "status": "success",
    "message": "Response sheet sent successfully to 2 recipient(s)",
    "data": {
        "sheet_id": "sheet-uuid",
        "sent_to": ["client@example.com", "manager@example.com"],
        "sent_at": "2026-01-13T10:35:00.000Z"
    }
}
```

**Validation**:
- Recipients array must not be empty
- Email addresses must be valid format

**Use Cases**:
- Email monthly reports to clients
- Share progress with stakeholders
- Distribute archived snapshots

---

### 3. GET /response-sheets/:id

**Description**: Retrieves a specific response sheet by ID, including full snapshot data.

**Authentication**: Required

**Response** (200 OK):
```json
{
    "status": "success",
    "data": {
        "id": "sheet-uuid",
        "project_id": "project-uuid",
        "snapshot_data": { /* Full snapshot object */ },
        "generated_at": "2026-01-13T10:30:00.000Z",
        "sent_at": "2026-01-13T10:35:00.000Z",
        "sent_to": ["client@example.com"],
        "avg_resolution_time": 28.3
    }
}
```

**Use Cases**:
- View historical project snapshots
- Review previously sent reports
- Audit project progress over time

---

### 4. GET /response-sheets

**Description**: Lists all response sheets, optionally filtered by project.

**Authentication**: Required

**Query Parameters**:
- `project_id` (optional): Filter sheets by project UUID

**Response** (200 OK):
```json
{
    "status": "success",
    "data": [
        {
            "id": "sheet-uuid-1",
            "project_id": "project-uuid",
            "project_name": "Client Website Redesign",
            "generated_at": "2026-01-13T10:30:00.000Z",
            "sent_at": "2026-01-13T10:35:00.000Z",
            "sent_to": ["client@example.com"],
            "total_tickets": 10,
            "completed_tickets": 7,
            "ftr_percentage": 85.71
        },
        {
            "id": "sheet-uuid-2",
            "project_id": "project-uuid",
            "project_name": "Client Website Redesign",
            "generated_at": "2026-01-01T09:00:00.000Z",
            "sent_at": null,
            "sent_to": null,
            "total_tickets": 10,
            "completed_tickets": 5,
            "ftr_percentage": 80.0
        }
    ]
}
```

**Use Cases**:
- View all project reports
- Track report history
- Find previously generated sheets

---

## Error Responses

### 400 Bad Request
```json
{
    "status": "error",
    "message": "project_id is required"
}
```

### 404 Not Found
```json
{
    "status": "error",
    "message": "Response sheet with ID {id} not found"
}
```

### 500 Internal Server Error
```json
{
    "status": "error",
    "message": "Failed to generate response sheet"
}
```

---

## Snapshot Data Structure

Each response sheet captures a complete snapshot including:

| Section | Description | Example Fields |
|---------|-------------|----------------|
| **Project** | Basic project information | id, name, status, created_at |
| **Client** | Client details | id, name |
| **POCs** | All project POCs | name, email, phone |
| **Team Members** | Current team assignments | user_id, name, role, assigned_from |
| **Tickets** | ALL project tickets | id, title, status, priority, FTR, iterations, resolution time |
| **Summary** | Calculated KPIs | total/completed tickets, FTR%, avg resolution, avg iterations |

---

## Business Rules

### 1. Snapshot Immutability
- Snapshots are generated **once** at POST time
- Historical sheets are **NEVER recomputed**
- Data represents exact state at `generated_at` timestamp

### 2. Data Completeness
- Snapshot includes ALL tickets (not just active)
- Team members include only current assignments
- Metrics calculated from snapshot data

### 3. Email Tracking
- `sent_at`: Timestamp when sheet was emailed
- `sent_to`: Array of recipient email addresses
- Sheets can be sent multiple times (updates tracking)

---

## Frontend Integration Examples

### Generate and Display Sheet
```typescript
const generateSheet = async (projectId: string) => {
    const response = await fetch('/response-sheets', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_id: projectId })
    });

    const { data } = await response.json();
    const snapshot = data.snapshot_data;

    console.log(`Generated sheet for ${snapshot.project.name}`);
    console.log(`Total Tickets: ${snapshot.summary.total_tickets}`);
    console.log(`FTR: ${snapshot.summary.ftr_percentage}%`);

    return data;
};
```

### Send Sheet to Client
```typescript
const sendSheetToClient = async (sheetId: string, clientEmail: string) => {
    const response = await fetch(`/response-sheets/${sheetId}/send`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            recipients: [clientEmail],
            subject: 'Monthly Project Report',
            message: 'Please review the attached progress report.'
        })
    });

    const { data } = await response.json();
    console.log(`Sheet sent to ${data.sent_to.join(', ')}`);
};
```

### List Project History
```typescript
const getProjectReportHistory = async (projectId: string) => {
    const response = await fetch(`/response-sheets?project_id=${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const { data } = await response.json();

    return data.map(sheet => ({
        id: sheet.id,
        generated: new Date(sheet.generated_at).toLocaleDateString(),
        completed: `${sheet.completed_tickets}/${sheet.total_tickets}`,
        ftr: `${sheet.ftr_percentage}%`,
        sent: sheet.sent_at ? 'Yes' : 'No'
    }));
};
```

---

## Performance Notes

- Snapshot generation: ~200-500ms for typical projects (< 100 tickets)
- List queries optimized with JSONB field extraction (no full snapshot load)
- Indexes on `project_id` and `generated_at` for fast filtering
- Email sending is asynchronous (non-blocking)

---

## Email Integration

The service includes a placeholder for email integration. To enable actual email sending:

1. Install email provider SDK (SendGrid, AWS SES, etc.)
2. Configure environment variables (API keys, from address)
3. Replace placeholder in `response-sheets.service.ts`

Example (SendGrid):
```typescript
import sgMail from '@sendgrid/mail';

private async sendEmail(sheet, recipients, subject?, message?) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
        to: recipients,
        from: process.env.FROM_EMAIL,
        subject: subject || `Project Report - ${sheet.snapshot_data.project.name}`,
        html: this.generateEmailHTML(sheet, message),
    };

    await sgMail.send(msg);
}
```

---

## Changelog

### 2026-01-13 - Initial Release
- POST /response-sheets - Generate snapshot
- POST /response-sheets/:id/send - Email to recipients
- GET /response-sheets/:id - Retrieve by ID
- GET /response-sheets - List all or filter by project
- JSONB snapshot storage for immutability
- Email placeholder ready for integration
