# Butler PMS - Frontend Integration Guide

**Version:** 1.0
**Last Updated:** 2026-01-13
**Base URL:** `http://localhost:3000` (Development)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Data Models & TypeScript Interfaces](#data-models--typescript-interfaces)
4. [Complete API Reference](#complete-api-reference)
5. [State Management Recommendations](#state-management-recommendations)
6. [Error Handling](#error-handling)
7. [Real-World Usage Examples](#real-world-usage-examples)
8. [Best Practices](#best-practices)
9. [Deployment Checklist](#deployment-checklist)

---

## Quick Start

### Prerequisites

- Node.js 18+ or 20+ recommended
- React/Vue/Angular/Svelte (framework agnostic)
- HTTP client (axios, fetch, etc.)
- State management library (Redux, Zustand, Pinia, etc.)

### Installation

```bash
npm install axios # or your preferred HTTP client
npm install @types/node # for TypeScript type definitions
```

### Basic Setup

```typescript
// api/client.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Authentication

### Login Flow

```typescript
// api/auth.ts
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'PM' | 'EMPLOYEE';
  };
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

  // Store token
  localStorage.setItem('auth_token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));

  return response.data;
}

export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}
```

**Default Admin Credentials (for development):**
- Email: `admin@butler.com`
- Password: `password`

---

## Data Models & TypeScript Interfaces

### User

```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  PM = 'PM',
  EMPLOYEE = 'EMPLOYEE',
}

enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  EXIT_INITIATED = 'EXIT_INITIATED',
  OFFBOARDED = 'OFFBOARDED',
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employment_status: EmploymentStatus;
  is_assignable: boolean;
  exit_requested_at?: string | null;
  exit_effective_at?: string | null;
  created_at: string;
}
```

### Client & Project

```typescript
interface Client {
  id: string;
  name: string;
}

enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
}

interface Project {
  id: string;
  client_id: string;
  name: string;
  status: ProjectStatus;
  created_at: string;
}

interface ProjectPOC {
  id: string;
  project_id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  assigned_from: string;
  assigned_to?: string | null;
  is_current: boolean;
  user_name?: string; // Populated in API response
  user_email?: string; // Populated in API response
}
```

### Sprint

```typescript
interface Sprint {
  id: string;
  name: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
}
```

### Ticket

```typescript
enum TicketStatus {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
  REASSIGNED = 'REASSIGNED',
  DELIVERED = 'DELIVERED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

interface Ticket {
  id: string;
  project_id: string;
  sprint_id?: string | null;
  title: string;
  description?: string | null;
  priority: TicketPriority;
  delivery_datetime?: string | null; // ISO datetime
  delivery_slot?: string | null;
  ad_name?: string | null;
  creative_count?: number | null;
  status: TicketStatus;
  created_at: string;
}
```

### Iteration & Approval

```typescript
enum IterationOutcome {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
}

interface TicketIteration {
  id: string;
  ticket_id: string;
  iteration_number: number;
  outcome: IterationOutcome;
  created_at: string;
}

enum ApprovalStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

interface Approval {
  id: string;
  ticket_id: string;
  approved_by: string;
  status: ApprovalStatus;
  approved_at: string;
  approver_name?: string; // Populated in API response
  approver_email?: string; // Populated in API response
}

interface FTRMetric {
  id: string;
  ticket_id: string;
  first_time_right: boolean; // TRUE only if approved in iteration 1
  score: number; // 100 or 0
}
```

### Comments & Files

```typescript
interface Comment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string; // Populated in API response
  user_email?: string; // Populated in API response
}

interface FileAttachment {
  id: string;
  ticket_id: string;
  iteration_id: string; // MANDATORY - files must be linked to iterations
  file_url: string; // URL from blob storage (S3, etc.)
  file_type?: string; // MIME type
  uploaded_by: string;
  uploaded_at: string;
  uploader_name?: string; // Populated in API response
  uploader_email?: string; // Populated in API response
}
```

### Analytics

```typescript
interface OverviewAnalytics {
  summary: {
    total_tickets: number;
    total_completed: number;
    total_in_progress: number;
    total_pending: number;
    completion_rate: number; // Percentage
  };
  ftr_metrics: {
    total_ftr: number;
    total_non_ftr: number;
    ftr_percentage: number;
  };
  resolution_metrics: {
    avg_resolution_hours: number;
    median_resolution_hours: number;
    fastest_resolution_hours: number;
    slowest_resolution_hours: number;
  };
  iterations_metrics: {
    avg_iterations_per_ticket: number;
  };
  status_distribution: Array<{
    status: TicketStatus;
    count: number;
  }>;
  priority_distribution: Array<{
    priority: TicketPriority;
    count: number;
  }>;
  recent_activity: {
    tickets_created_today: number;
    tickets_completed_today: number;
  };
}

interface SprintAnalytics {
  sprint: Sprint;
  total_tickets: number;
  completed_tickets: number;
  in_progress_tickets: number;
  pending_tickets: number;
  completion_rate: number;
  avg_iterations: number;
  ftr_count: number;
  ftr_percentage: number;
  timeline: Array<{
    date: string; // YYYY-MM-DD
    completed_count: number;
    cumulative_count: number;
  }>;
  velocity: {
    tickets_per_day: number;
    estimated_completion_date: string | null;
    on_track: boolean;
  };
}

interface UserPerformance {
  user_id: string;
  user_name: string;
  user_email: string;
  total_tickets: number;
  completed_tickets: number;
  in_progress_tickets: number;
  pending_tickets: number;
  avg_iterations: number;
  ftr_count: number;
  ftr_percentage: number;
  avg_resolution_hours: number;
  rank?: number; // Position in leaderboard
  active_streak_days?: number;
}
```

### Red Alerts

```typescript
enum AlertReason {
  EXCESSIVE_ITERATIONS = 'EXCESSIVE_ITERATIONS', // > 2 iterations
  SLA_BREACH = 'SLA_BREACH', // Delivery date crossed
  IDLE_TICKET = 'IDLE_TICKET', // No updates for > 48 hours
}

interface RedAlert {
  id: string;
  ticket_id: string;
  reason: AlertReason;
  triggered_at: string;
  // Populated fields:
  ticket_title?: string;
  ticket_status?: TicketStatus;
  ticket_priority?: TicketPriority;
  project_id?: string;
  project_name?: string;
  assigned_to?: string;
  assignee_name?: string;
  assignee_email?: string;
  iteration_count?: number;
  delivery_datetime?: string | null;
  last_updated?: string;
}

interface AlertStatistics {
  total_alerts: number;
  active_alerts: number;
  by_reason: {
    excessive_iterations: number;
    sla_breach: number;
    idle_ticket: number;
  };
  by_project: Array<{
    project_id: string;
    project_name: string;
    alert_count: number;
  }>;
}
```

### Response Sheets

```typescript
interface ResponseSheet {
  id: string;
  project_id: string;
  snapshot_data: {
    project: {
      id: string;
      name: string;
      status: string;
      created_at: string;
    };
    client: {
      id: string;
      name: string;
    };
    pocs: ProjectPOC[];
    team: Array<{
      user_id: string;
      user_name: string;
      role: string;
      assigned_from: string;
    }>;
    tickets: Array<{
      id: string;
      title: string;
      status: TicketStatus;
      priority: TicketPriority;
      iterations_count: number;
      ftr: boolean;
      resolution_hours?: number;
      assigned_to?: string;
      assignee_name?: string;
    }>;
    summary: {
      total_tickets: number;
      completed_tickets: number;
      in_progress_tickets: number;
      pending_tickets: number;
      ftr_percentage: number;
      avg_resolution_hours: number;
      avg_iterations: number;
    };
  };
  generated_at: string;
  sent_at?: string | null;
  sent_to?: string[]; // Email addresses
  avg_resolution_time?: number;
}
```

### Notifications

```typescript
interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  event_type: string; // e.g., 'TICKET_ASSIGNED', 'ITERATION_APPROVED'
  entity_id?: string; // Related entity (ticket_id, project_id, etc.)
  is_read: boolean;
  created_at: string;
}
```

---

## Complete API Reference

### Authentication

#### Login
- **POST** `/auth/login`
- **Body:** `{ email, password }`
- **Response:** `{ token, user: { id, name, email, role } }`

---

### Users

#### Create User
- **POST** `/users`
- **Body:** `{ name, email, password, role }`
- **Response:** `User`

#### List Users
- **GET** `/users`
- **Response:** `User[]`

#### Get User by ID
- **GET** `/users/:id`
- **Response:** `User`

#### Update User
- **PATCH** `/users/:id`
- **Body:** `{ name?, email? }`
- **Response:** `User`

#### Initiate User Exit
- **POST** `/users/:id/exit`
- **Response:** `User` (status → EXIT_INITIATED)

#### List Exiting Users
- **GET** `/users/exits`
- **Response:** `User[]` (users with EXIT_INITIATED status)

#### Offboard User (Admin Only)
- **POST** `/users/:id/offboard`
- **Response:** `User` (status → OFFBOARDED)
- **Note:** Fails if user has active tickets

---

### Departments

#### List Departments
- **GET** `/departments`
- **Response:** `{ id, name }[]`

#### Create Department
- **POST** `/departments`
- **Body:** `{ name }`
- **Response:** `{ id, name }`

#### List Sub-Departments
- **GET** `/sub-departments`
- **Response:** `{ id, department_id, name }[]`

#### Create Sub-Department
- **POST** `/sub-departments`
- **Body:** `{ department_id, name }`
- **Response:** `{ id, department_id, name }`

---

### Clients

#### Create Client
- **POST** `/clients`
- **Body:** `{ name }`
- **Response:** `Client`
- **Errors:** 409 if duplicate name

#### List Clients
- **GET** `/clients`
- **Response:** `Client[]`

---

### Projects

#### Create Project
- **POST** `/projects`
- **Body:** `{ client_id, name, pocs?: [], member_ids?: [] }`
- **Response:** `{ project, pocs, members }`
- **Note:** Transactional - creates project + POCs + members atomically

#### List Projects
- **GET** `/projects`
- **Response:** `Project[]`

#### Get Project by ID
- **GET** `/projects/:id`
- **Response:** `Project`

#### Update Project
- **PATCH** `/projects/:id`
- **Body:** `{ name?, status? }`
- **Response:** `Project`

#### Add POC to Project
- **POST** `/projects/:id/pocs`
- **Body:** `{ name, email?, phone? }`
- **Response:** `ProjectPOC`

#### List Project POCs
- **GET** `/projects/:id/pocs`
- **Response:** `ProjectPOC[]`

#### Assign Member to Project
- **POST** `/projects/:id/members`
- **Body:** `{ user_id }`
- **Response:** `ProjectMember`

#### List Project Members
- **GET** `/projects/:id/members`
- **Response:** `ProjectMember[]` (current members only)

#### Remove Member from Project
- **DELETE** `/projects/:id/members/:userId`
- **Response:** 204 No Content

---

### Sprints

#### Create Sprint
- **POST** `/sprints`
- **Body:** `{ name, start_date, end_date }`
- **Response:** `Sprint`
- **Validation:** end_date > start_date, unique name

#### List Sprints
- **GET** `/sprints`
- **Response:** `Sprint[]` (ordered by start_date DESC)

#### Get Sprint by ID
- **GET** `/sprints/:id`
- **Response:** `Sprint`

---

### Tickets

#### Create Ticket
- **POST** `/tickets`
- **Body:** `{ project_id, title, priority, sprint_id?, description?, delivery_datetime?, delivery_slot?, ad_name?, creative_count? }`
- **Response:** `Ticket` (status: CREATED)

#### List Tickets
- **GET** `/tickets`
- **Response:** `Ticket[]` (ordered by created_at DESC)

#### Get Ticket by ID
- **GET** `/tickets/:id`
- **Response:** `Ticket`

#### Update Ticket
- **PATCH** `/tickets/:id`
- **Body:** `{ title?, description?, priority?, delivery_datetime?, delivery_slot?, ad_name?, creative_count?, sprint_id? }`
- **Response:** `Ticket`

#### Assign Ticket
- **POST** `/tickets/:id/assign`
- **Body:** `{ user_id }`
- **Response:** `{ message, assignment }`
- **Side Effect:** Status → ASSIGNED (if CREATED)
- **Business Rule:** Exactly ONE active owner per ticket

#### Unassign Ticket
- **POST** `/tickets/:id/unassign`
- **Response:** `{ message }`
- **Side Effect:** Status → REASSIGNED
- **Note:** Used for exit flow only

---

### Iterations & Approvals

#### Create Iteration (Manual)
- **POST** `/tickets/:id/iterations`
- **Response:** `TicketIteration`
- **Note:** Creates next iteration manually

#### Get Iterations for Ticket
- **GET** `/tickets/:id/iterations`
- **Response:** `TicketIteration[]` (ordered by iteration_number ASC)

#### Approve Ticket
- **POST** `/tickets/:id/approve`
- **Body:** `{ approved_by }`
- **Response:** `{ message, iteration, approval, ftr }`
- **Side Effects:**
  - Iteration outcome → APPROVED
  - FTR calculated (TRUE if iteration 1)
  - Ticket status → APPROVED
  - Creates approval record
  - Emits ITERATION_APPROVED event

#### Reject Ticket / Request Revision
- **POST** `/tickets/:id/reject`
- **Body:** `{ approved_by, reason? }`
- **Response:** `{ message, old_iteration, new_iteration, approval, ftr }`
- **Side Effects:**
  - Current iteration outcome → REVISION_REQUIRED
  - Creates NEW iteration (iteration_number + 1)
  - FTR locked to FALSE permanently
  - Ticket status → REVISION_REQUIRED
  - Creates approval record (status: REJECTED)
  - Emits ITERATION_REJECTED event

---

### Comments

#### Add Comment to Ticket
- **POST** `/tickets/:id/comments`
- **Body:** `{ user_id, content }`
- **Response:** `Comment`

#### Get Comments for Ticket
- **GET** `/tickets/:id/comments`
- **Response:** `Comment[]` (ordered by created_at DESC, includes user details)

---

### Files

#### Upload File Metadata
- **POST** `/files/upload`
- **Body:** `{ ticket_id, iteration_id, file_url, file_type?, uploaded_by }`
- **Response:** `FileAttachment`
- **Note:** `iteration_id` is MANDATORY. Actual file upload to S3/blob storage is separate.

#### Get Files for Ticket
- **GET** `/tickets/:id/files`
- **Response:** `FileAttachment[]` (ordered by uploaded_at DESC, includes uploader details)

---

### Analytics

#### Get Overview Analytics
- **GET** `/analytics/overview`
- **Response:** `OverviewAnalytics`
- **Use Case:** Dashboard KPIs

#### Get Sprint Analytics
- **GET** `/analytics/sprints/:sprintId`
- **Response:** `SprintAnalytics`
- **Use Case:** Sprint burndown charts, velocity tracking

#### Get All Users Performance
- **GET** `/analytics/users`
- **Response:** `{ users: UserPerformance[], leaderboard: UserPerformance[] }`
- **Use Case:** Leaderboard, team performance

#### Get User Performance
- **GET** `/analytics/users/:userId`
- **Response:** `UserPerformance`
- **Use Case:** Individual performance dashboard

---

### Red Alerts

#### Get All Alerts
- **GET** `/alerts?reason=...&project_id=...&ticket_id=...&from_date=...&to_date=...`
- **Response:** `RedAlert[]` (with full ticket/project details)

#### Get Alert Statistics
- **GET** `/alerts/statistics`
- **Response:** `AlertStatistics`
- **Use Case:** Dashboard KPI cards

#### Get Recent Alerts
- **GET** `/alerts/recent?hours=24`
- **Response:** `RedAlert[]`

#### Get Active Alerts Count
- **GET** `/alerts/count`
- **Response:** `{ count }`
- **Use Case:** Notification badge

#### Get Alerts for Ticket
- **GET** `/tickets/:id/alerts`
- **Response:** `RedAlert[]`

#### Get Alerts for Project
- **GET** `/projects/:id/alerts`
- **Response:** `RedAlert[]`

#### Manual Alert Scan (Admin Only)
- **POST** `/alerts/scan`
- **Response:** `{ message, new_alerts: { ... } }`
- **Note:** Triggers immediate scan (automated scan runs every 30 minutes)

#### Resolve Alerts for Ticket (Admin Only)
- **POST** `/tickets/:id/alerts/resolve`
- **Response:** `{ message }`

---

### Response Sheets

#### Generate Response Sheet
- **POST** `/response-sheets`
- **Body:** `{ project_id }`
- **Response:** `ResponseSheet`
- **Note:** Creates snapshot of project state at that moment

#### Send Response Sheet
- **POST** `/response-sheets/:id/send`
- **Body:** `{ email_addresses: string[] }`
- **Response:** `{ message }`

#### Get Response Sheet by ID
- **GET** `/response-sheets/:id`
- **Response:** `ResponseSheet`

#### List Response Sheets
- **GET** `/response-sheets?project_id=...`
- **Response:** `ResponseSheet[]` (all or filtered by project)

---

### Notifications

#### Get User Notifications
- **GET** `/notifications?user_id=...`
- **Response:** `Notification[]` (last 50)

#### Get Unread Count
- **GET** `/notifications/unread/count?user_id=...`
- **Response:** `{ count }`

#### Mark Notification as Read
- **PATCH** `/notifications/:id/read`
- **Response:** `{ status, message }`

---

## State Management Recommendations

### Redux Toolkit Example

```typescript
// store/slices/ticketsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/api/client';
import { Ticket } from '@/types';

interface TicketsState {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  loading: boolean;
  error: string | null;
}

const initialState: TicketsState = {
  tickets: [],
  currentTicket: null,
  loading: false,
  error: null,
};

export const fetchTickets = createAsyncThunk('tickets/fetchAll', async () => {
  const response = await apiClient.get<Ticket[]>('/tickets');
  return response.data;
});

export const fetchTicketById = createAsyncThunk(
  'tickets/fetchById',
  async (ticketId: string) => {
    const response = await apiClient.get<Ticket>(`/tickets/${ticketId}`);
    return response.data;
  }
);

export const createTicket = createAsyncThunk(
  'tickets/create',
  async (ticket: CreateTicketDTO) => {
    const response = await apiClient.post<Ticket>('/tickets', ticket);
    return response.data;
  }
);

export const assignTicket = createAsyncThunk(
  'tickets/assign',
  async ({ ticketId, userId }: { ticketId: string; userId: string }) => {
    const response = await apiClient.post(`/tickets/${ticketId}/assign`, {
      user_id: userId,
    });
    return response.data;
  }
);

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action: PayloadAction<Ticket[]>) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tickets';
      })
      .addCase(fetchTicketById.fulfilled, (state, action: PayloadAction<Ticket>) => {
        state.currentTicket = action.payload;
      })
      .addCase(createTicket.fulfilled, (state, action: PayloadAction<Ticket>) => {
        state.tickets.push(action.payload);
      });
  },
});

export const { clearCurrentTicket } = ticketsSlice.actions;
export default ticketsSlice.reducer;
```

### Zustand Example (Simpler)

```typescript
// store/useTicketsStore.ts
import { create } from 'zustand';
import { apiClient } from '@/api/client';
import { Ticket } from '@/types';

interface TicketsStore {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;

  fetchTickets: () => Promise<void>;
  createTicket: (ticket: CreateTicketDTO) => Promise<Ticket>;
  assignTicket: (ticketId: string, userId: string) => Promise<void>;
}

export const useTicketsStore = create<TicketsStore>((set, get) => ({
  tickets: [],
  loading: false,
  error: null,

  fetchTickets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<Ticket[]>('/tickets');
      set({ tickets: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createTicket: async (ticketData) => {
    const response = await apiClient.post<Ticket>('/tickets', ticketData);
    set((state) => ({ tickets: [...state.tickets, response.data] }));
    return response.data;
  },

  assignTicket: async (ticketId, userId) => {
    await apiClient.post(`/tickets/${ticketId}/assign`, { user_id: userId });
    // Refresh tickets after assignment
    await get().fetchTickets();
  },
}));
```

---

## Error Handling

### API Error Response Format

```typescript
interface APIError {
  error: string; // Error message
  status?: number; // HTTP status code (from axios)
}
```

### Centralized Error Handler

```typescript
// utils/errorHandler.ts
export function handleAPIError(error: any): string {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.error || 'An error occurred';

    switch (error.response.status) {
      case 400:
        return `Validation Error: ${message}`;
      case 401:
        return 'Unauthorized. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return `Not Found: ${message}`;
      case 409:
        return `Conflict: ${message}`;
      case 500:
        return 'Server error. Please try again later.';
      default:
        return message;
    }
  } else if (error.request) {
    // Request made but no response received
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
}
```

### Usage in Components

```typescript
// Example: React component
import { handleAPIError } from '@/utils/errorHandler';

function CreateTicketForm() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (ticketData: CreateTicketDTO) => {
    try {
      setError(null);
      const ticket = await createTicket(ticketData);
      toast.success('Ticket created successfully!');
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}
      {/* Form fields */}
    </form>
  );
}
```

---

## Real-World Usage Examples

### Example 1: Create a Ticket and Assign

```typescript
async function createAndAssignTicket(
  projectId: string,
  userId: string,
  ticketData: Partial<CreateTicketDTO>
) {
  try {
    // 1. Create ticket
    const ticket = await apiClient.post<Ticket>('/tickets', {
      project_id: projectId,
      title: ticketData.title!,
      priority: ticketData.priority || 'MEDIUM',
      description: ticketData.description,
      delivery_datetime: ticketData.delivery_datetime,
    });

    console.log('✅ Ticket created:', ticket.data.id);

    // 2. Assign to user
    await apiClient.post(`/tickets/${ticket.data.id}/assign`, {
      user_id: userId,
    });

    console.log('✅ Ticket assigned to user:', userId);

    return ticket.data;
  } catch (error) {
    console.error('❌ Error:', handleAPIError(error));
    throw error;
  }
}
```

### Example 2: Approval Workflow

```typescript
async function reviewTicket(
  ticketId: string,
  approverId: string,
  approved: boolean,
  rejectionReason?: string
) {
  try {
    if (approved) {
      // Approve the ticket
      const response = await apiClient.post(`/tickets/${ticketId}/approve`, {
        approved_by: approverId,
      });

      const { iteration, approval, ftr } = response.data;

      if (ftr.first_time_right) {
        console.log('🎉 First Time Right! FTR achieved.');
      }

      console.log('✅ Ticket approved at iteration:', iteration.iteration_number);
      return response.data;
    } else {
      // Reject and request revision
      const response = await apiClient.post(`/tickets/${ticketId}/reject`, {
        approved_by: approverId,
        reason: rejectionReason,
      });

      console.log('🔄 Revision required. New iteration created:', response.data.new_iteration.iteration_number);
      return response.data;
    }
  } catch (error) {
    console.error('❌ Review failed:', handleAPIError(error));
    throw error;
  }
}
```

### Example 3: Dashboard Analytics

```typescript
async function loadDashboard() {
  try {
    // Fetch overview analytics
    const overview = await apiClient.get<OverviewAnalytics>('/analytics/overview');

    // Fetch recent alerts
    const alerts = await apiClient.get<RedAlert[]>('/alerts/recent?hours=24');

    // Fetch unread notifications count
    const currentUser = getCurrentUser();
    const notifCount = await apiClient.get(`/notifications/unread/count?user_id=${currentUser.id}`);

    return {
      analytics: overview.data,
      recentAlerts: alerts.data,
      unreadNotifications: notifCount.data.count,
    };
  } catch (error) {
    console.error('❌ Dashboard load failed:', handleAPIError(error));
    throw error;
  }
}
```

### Example 4: Sprint Burndown Chart

```typescript
import { Line } from 'react-chartjs-2';

function SprintBurndownChart({ sprintId }: { sprintId: string }) {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    async function loadSprintData() {
      const response = await apiClient.get<SprintAnalytics>(`/analytics/sprints/${sprintId}`);
      const analytics = response.data;

      // Prepare data for Chart.js
      const labels = analytics.timeline.map((t) => t.date);
      const completedData = analytics.timeline.map((t) => t.cumulative_count);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Completed Tickets',
            data: completedData,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      });
    }

    loadSprintData();
  }, [sprintId]);

  if (!chartData) return <div>Loading...</div>;

  return <Line data={chartData} />;
}
```

### Example 5: Real-Time Notifications

```typescript
// Use polling for real-time notifications (WebSocket can be added later)
function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchNotifications() {
      const [notifs, count] = await Promise.all([
        apiClient.get<Notification[]>(`/notifications?user_id=${userId}`),
        apiClient.get<{ count: number }>(`/notifications/unread/count?user_id=${userId}`),
      ]);

      setNotifications(notifs.data);
      setUnreadCount(count.data.count);
    }

    // Initial fetch
    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    await apiClient.patch(`/notifications/${notificationId}/read`);
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return { notifications, unreadCount, markAsRead };
}
```

---

## Best Practices

### 1. Use TypeScript

Always use TypeScript to catch errors at compile time and improve developer experience with autocomplete.

### 2. Centralize API Calls

Create dedicated API service files instead of calling `apiClient` directly in components.

```typescript
// api/tickets.service.ts
export const ticketsAPI = {
  getAll: () => apiClient.get<Ticket[]>('/tickets'),
  getById: (id: string) => apiClient.get<Ticket>(`/tickets/${id}`),
  create: (data: CreateTicketDTO) => apiClient.post<Ticket>('/tickets', data),
  update: (id: string, data: UpdateTicketDTO) =>
    apiClient.patch<Ticket>(`/tickets/${id}`, data),
  assign: (id: string, userId: string) =>
    apiClient.post(`/tickets/${id}/assign`, { user_id: userId }),
};
```

### 3. Implement Optimistic Updates

For better UX, update UI immediately and rollback on error.

```typescript
const assignTicket = async (ticketId: string, userId: string) => {
  // Optimistic update
  const previousTickets = [...tickets];
  setTickets((prev) =>
    prev.map((t) =>
      t.id === ticketId ? { ...t, status: 'ASSIGNED' } : t
    )
  );

  try {
    await ticketsAPI.assign(ticketId, userId);
  } catch (error) {
    // Rollback on error
    setTickets(previousTickets);
    toast.error('Assignment failed');
  }
};
```

### 4. Cache Analytics Data

Analytics data doesn't change frequently. Use caching to reduce API calls.

```typescript
// Use React Query or SWR
import { useQuery } from '@tanstack/react-query';

function useOverviewAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => apiClient.get<OverviewAnalytics>('/analytics/overview'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 5. Handle Permissions Client-Side

```typescript
function canApproveTicket(user: User) {
  return ['ADMIN', 'PM'].includes(user.role);
}

function canCreateProject(user: User) {
  return user.role === 'ADMIN';
}

// In component:
const currentUser = getCurrentUser();

{canApproveTicket(currentUser) && (
  <button onClick={handleApprove}>Approve</button>
)}
```

### 6. Use Enums for Status/Priority

```typescript
// Instead of hardcoded strings:
if (ticket.status === 'APPROVED') { ... }

// Use enums:
if (ticket.status === TicketStatus.APPROVED) { ... }
```

### 7. Format Dates Consistently

```typescript
import { format, formatDistanceToNow } from 'date-fns';

function formatDate(dateString: string) {
  return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
}

function formatRelativeDate(dateString: string) {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

// Usage:
<span>{formatDate(ticket.created_at)}</span>
<span>{formatRelativeDate(ticket.created_at)} ago</span>
```

### 8. Implement Loading States

```typescript
function TicketsList() {
  const { tickets, loading, error } = useTickets();

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;
  if (tickets.length === 0) return <EmptyState message="No tickets found" />;

  return (
    <div>
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
```

### 9. Debounce Search/Filter

```typescript
import { useMemo } from 'react';
import debounce from 'lodash.debounce';

function TicketsFilter() {
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        // Trigger API call or filter
        filterTickets(value);
      }, 500),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  return <input value={searchTerm} onChange={handleSearch} placeholder="Search tickets..." />;
}
```

### 10. Use Color Coding for Priorities & Statuses

```typescript
const PRIORITY_COLORS = {
  [TicketPriority.LOW]: '#10B981', // Green
  [TicketPriority.MEDIUM]: '#F59E0B', // Yellow
  [TicketPriority.HIGH]: '#EF4444', // Red
  [TicketPriority.URGENT]: '#DC2626', // Dark Red
};

const STATUS_COLORS = {
  [TicketStatus.CREATED]: '#9CA3AF',
  [TicketStatus.ASSIGNED]: '#3B82F6',
  [TicketStatus.IN_PROGRESS]: '#8B5CF6',
  [TicketStatus.SUBMITTED]: '#F59E0B',
  [TicketStatus.APPROVED]: '#10B981',
  [TicketStatus.DELIVERED]: '#059669',
  [TicketStatus.CLOSED]: '#6B7280',
  [TicketStatus.REVISION_REQUIRED]: '#EF4444',
};

// Usage:
<Badge color={PRIORITY_COLORS[ticket.priority]}>{ticket.priority}</Badge>
```

---

## Deployment Checklist

### Frontend Configuration

- [ ] Set `REACT_APP_API_URL` (or equivalent) to production backend URL
- [ ] Enable HTTPS for production
- [ ] Configure CORS on backend to allow your frontend domain
- [ ] Set up environment variables for different environments (dev, staging, prod)

### Security

- [ ] Store JWT token securely (httpOnly cookies preferred over localStorage)
- [ ] Implement token refresh mechanism
- [ ] Add CSRF protection if using cookies
- [ ] Validate all user inputs client-side (in addition to backend validation)
- [ ] Implement rate limiting for API calls
- [ ] Enable Content Security Policy (CSP) headers

### Performance

- [ ] Enable API response caching (React Query, SWR, or Redux RTK Query)
- [ ] Implement code splitting / lazy loading for routes
- [ ] Optimize images and assets
- [ ] Use pagination for large lists (tickets, users, etc.)
- [ ] Add loading skeletons for better perceived performance

### Monitoring

- [ ] Set up error tracking (Sentry, Rollbar, etc.)
- [ ] Add analytics (Google Analytics, Mixpanel, etc.)
- [ ] Monitor API response times
- [ ] Set up health check endpoints monitoring

### User Experience

- [ ] Add toast notifications for success/error feedback
- [ ] Implement confirmation dialogs for destructive actions
- [ ] Add keyboard shortcuts for power users
- [ ] Ensure mobile responsiveness
- [ ] Add accessibility features (ARIA labels, keyboard navigation)

### Testing

- [ ] Write unit tests for critical components
- [ ] Add integration tests for user flows
- [ ] Test all API error scenarios
- [ ] Perform end-to-end testing
- [ ] Test with different user roles (Admin, PM, Employee)

---

## Support & Resources

### API Health Check

- **Endpoint:** `GET /health`
- **Response:** `{ status: 'ok', timestamp: '...' }`

### Documentation

- **Backend Docs:** `/Users/manu/Desktop/Butler/API_DOCUMENTATION.md`
- **Architecture Context:** `/Users/manu/Desktop/Butler/AI_CONTEXT.md`

### External Integrations

The backend supports Slack and Email notifications. Configure these in `.env`:

**Slack:**
```
SLACK_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Email (Gmail):**
```
EMAIL_ENABLED=true
EMAIL_PROVIDER=gmail
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Butler PMS
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

---

## Changelog

### Version 1.0 (2026-01-13)
- Initial release
- Complete API reference for all modules
- TypeScript interfaces for all data models
- Real-world usage examples
- Best practices guide

---

**End of Frontend Integration Guide**

For questions or issues, please refer to the backend API documentation or reach out to the development team.
