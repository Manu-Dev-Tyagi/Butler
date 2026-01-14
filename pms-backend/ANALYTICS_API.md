# Butler PMS - Analytics API Documentation

## Overview

The Analytics API provides comprehensive reporting and KPI metrics for the Butler PMS system. All endpoints require authentication via Bearer token.

## Base URL

```
http://localhost:3000
```

## Authentication

All endpoints require the `Authorization` header with a valid JWT token:

```
Authorization: Bearer <your_token_here>
```

---

## Endpoints

### 1. GET /analytics/overview

**Description**: Returns system-wide analytics with comprehensive KPI metrics.

**Authentication**: Required

**Response Structure**:
```typescript
{
    status: 'success',
    data: {
        summary: {
            total_tickets: number,
            total_projects: number,
            total_users: number,
            active_tickets: number
        },
        ftr: {
            percentage: number,           // 0-100
            approved_first_time: number,
            total_completed: number
        },
        resolution: {
            avg_hours: number,
            median_hours: number,
            fastest_hours: number,
            slowest_hours: number
        },
        iterations: {
            avg_per_ticket: number,
            single_iteration_count: number,
            multiple_iterations_count: number
        },
        status_distribution: Array<{
            status: string,
            count: number,
            percentage: number
        }>,
        priority_distribution: Array<{
            priority: string,
            count: number,
            percentage: number
        }>,
        recent_activity: {
            tickets_created_today: number,
            tickets_completed_today: number,
            tickets_in_progress: number
        }
    }
}
```

**Example Request**:
```bash
curl -X GET http://localhost:3000/analytics/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Use Cases**:
- Admin dashboard overview
- System health monitoring
- Executive reporting

---

### 2. GET /analytics/sprints/:sprintId

**Description**: Returns detailed analytics for a specific sprint including velocity, timeline, and team metrics.

**Authentication**: Required

**Parameters**:
- `sprintId` (path, UUID) - The ID of the sprint

**Response Structure**:
```typescript
{
    status: 'success',
    data: {
        sprint: {
            id: string,
            name: string,
            start_date: Date,
            end_date: Date,
            days_total: number,
            days_elapsed: number,
            days_remaining: number,
            is_active: boolean
        },
        tickets: {
            total: number,
            completed: number,
            in_progress: number,
            pending: number,
            completion_rate: number
        },
        ftr: {
            percentage: number,
            approved_first_time: number,
            required_revisions: number
        },
        velocity: {
            tickets_per_day: number,
            estimated_completion_date: Date | null,
            on_track: boolean
        },
        team: {
            members_count: number,
            tickets_per_member: number
        },
        timeline: Array<{
            date: string,
            tickets_completed: number,
            cumulative_completed: number
        }>
    }
}
```

**Example Request**:
```bash
curl -X GET http://localhost:3000/analytics/sprints/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Use Cases**:
- Sprint planning and review
- Burndown chart visualization
- Velocity tracking
- Team capacity planning

---

### 3. GET /analytics/users

**Description**: Returns comprehensive user performance analytics with leaderboard and individual metrics.

**Authentication**: Required

**Response Structure**:
```typescript
{
    status: 'success',
    data: {
        summary: {
            total_users: number,
            active_users: number,
            avg_ftr: number,
            avg_resolution_hours: number
        },
        leaderboard: Array<{
            user: {
                id: string,
                name: string,
                email: string
            },
            metrics: {
                ftr_percentage: number,
                tickets_completed: number,
                avg_resolution_hours: number,
                rank: number
            }
        }>,
        users: Array<UserPerformance>
    }
}
```

**Example Request**:
```bash
curl -X GET http://localhost:3000/analytics/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Use Cases**:
- Team leaderboard display
- Performance reviews
- Resource allocation
- Gamification features

---

### 4. GET /analytics/users/:userId

**Description**: Returns detailed performance metrics for a specific user.

**Authentication**: Required

**Parameters**:
- `userId` (path, UUID) - The ID of the user

**Response Structure**:
```typescript
{
    status: 'success',
    data: {
        user: {
            id: string,
            name: string,
            email: string,
            role: string
        },
        tickets: {
            total_assigned: number,
            completed: number,
            in_progress: number,
            pending: number,
            completion_rate: number
        },
        ftr: {
            percentage: number,
            approved_first_time: number,
            required_revisions: number
        },
        performance: {
            avg_resolution_hours: number,
            avg_iterations_per_ticket: number,
            active_streak_days: number
        },
        recent_tickets: Array<{
            id: string,
            title: string,
            status: string,
            priority: string,
            created_at: Date,
            completed_at: Date | null
        }>
    }
}
```

**Example Request**:
```bash
curl -X GET http://localhost:3000/analytics/users/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Use Cases**:
- Individual performance dashboards
- 1-on-1 performance reviews
- Personal progress tracking
- Skill assessment

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
    "status": "error",
    "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
    "status": "error",
    "message": "Sprint with ID {id} not found"
}
```

### 500 Internal Server Error
```json
{
    "status": "error",
    "message": "Failed to fetch analytics"
}
```

---

## Frontend Integration Examples

### React Example (Overview Dashboard)
```typescript
const OverviewDashboard = () => {
    const [analytics, setAnalytics] = useState<OverviewAnalytics | null>(null);

    useEffect(() => {
        fetch('/analytics/overview', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setAnalytics(data.data));
    }, []);

    return (
        <div>
            <h2>Total Tickets: {analytics?.summary.total_tickets}</h2>
            <p>FTR: {analytics?.ftr.percentage}%</p>
            {/* Chart components using status_distribution, priority_distribution, etc. */}
        </div>
    );
};
```

### Chart.js Integration (Burndown Chart)
```typescript
const BurndownChart = ({ sprintId }) => {
    const [timeline, setTimeline] = useState([]);

    useEffect(() => {
        fetch(`/analytics/sprints/${sprintId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setTimeline(data.data.timeline));
    }, [sprintId]);

    const chartData = {
        labels: timeline.map(t => t.date),
        datasets: [{
            label: 'Cumulative Completed',
            data: timeline.map(t => t.cumulative_completed)
        }]
    };

    return <Line data={chartData} />;
};
```

---

## Performance Notes

- All queries are optimized with aggregate functions and indexed columns
- Response times < 200ms for typical datasets (< 10k tickets)
- Read-only operations (no write locks)
- Suitable for real-time dashboard updates
- Timeline queries use date grouping for efficient aggregation

---

## Key Performance Indicators (KPIs)

| KPI | Description | Range | Target |
|-----|-------------|-------|--------|
| **FTR %** | First Time Right percentage | 0-100% | >80% |
| **Avg Resolution** | Average hours from creation to approval | 0-∞ hours | <24h |
| **Iterations/Ticket** | Average number of revisions per ticket | ≥1 | <2 |
| **Velocity** | Tickets completed per day | 0-∞ | Consistent |
| **Completion Rate** | Percentage of tickets completed vs total | 0-100% | >90% |
| **Active Streak** | Consecutive days with activity | 0-∞ days | >5 days |

---

## Changelog

### 2026-01-13 - Initial Release
- Added GET /analytics/overview
- Added GET /analytics/sprints/:sprintId
- Added GET /analytics/users
- Added GET /analytics/users/:userId
- Frontend-optimized data structures
- Comprehensive KPI coverage
