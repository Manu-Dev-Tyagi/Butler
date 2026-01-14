import { pool } from '@database/connection';
import { OverviewAnalytics, SprintAnalytics, UsersAnalytics, UserPerformance } from './analytics.types';

export class AnalyticsRepository {
    // ==================== OVERVIEW ANALYTICS ====================

    async getOverviewAnalytics(): Promise<OverviewAnalytics> {
        const client = await pool.connect();
        try {
            // Summary metrics
            const summaryQuery = `
                SELECT
                    (SELECT COUNT(*) FROM tickets) as total_tickets,
                    (SELECT COUNT(*) FROM projects) as total_projects,
                    (SELECT COUNT(*) FROM users) as total_users,
                    (SELECT COUNT(*) FROM tickets WHERE status IN ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUIRED')) as active_tickets
            `;
            const summaryResult = await client.query(summaryQuery);

            // FTR metrics
            const ftrQuery = `
                SELECT
                    COUNT(CASE WHEN fm.first_time_right = true THEN 1 END) as approved_first_time,
                    COUNT(*) as total_completed
                FROM tickets t
                LEFT JOIN ftr_metrics fm ON t.id = fm.ticket_id
                WHERE t.status IN ('APPROVED', 'DELIVERED', 'CLOSED')
            `;
            const ftrResult = await client.query(ftrQuery);
            const ftrData = ftrResult.rows[0];
            const ftrPercentage = ftrData.total_completed > 0
                ? (ftrData.approved_first_time / ftrData.total_completed) * 100
                : 0;

            // Resolution time metrics (in hours)
            const resolutionQuery = `
                WITH completed_tickets AS (
                    SELECT
                        t.id,
                        EXTRACT(EPOCH FROM (t.created_at - COALESCE(
                            (SELECT MIN(created_at) FROM approvals WHERE ticket_id = t.id),
                            t.created_at
                        ))) / 3600 as resolution_hours
                    FROM tickets t
                    WHERE t.status IN ('APPROVED', 'DELIVERED', 'CLOSED')
                )
                SELECT
                    COALESCE(AVG(resolution_hours), 0) as avg_hours,
                    COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resolution_hours), 0) as median_hours,
                    COALESCE(MIN(resolution_hours), 0) as fastest_hours,
                    COALESCE(MAX(resolution_hours), 0) as slowest_hours
                FROM completed_tickets
            `;
            const resolutionResult = await client.query(resolutionQuery);

            // Iterations metrics
            const iterationsQuery = `
                WITH ticket_iteration_counts AS (
                    SELECT
                        t.id,
                        COUNT(ti.id) as iteration_count
                    FROM tickets t
                    LEFT JOIN ticket_iterations ti ON t.id = ti.ticket_id
                    GROUP BY t.id
                )
                SELECT
                    COALESCE(AVG(iteration_count), 0) as avg_per_ticket,
                    COUNT(CASE WHEN iteration_count = 1 THEN 1 END) as single_iteration_count,
                    COUNT(CASE WHEN iteration_count > 1 THEN 1 END) as multiple_iterations_count
                FROM ticket_iteration_counts
            `;
            const iterationsResult = await client.query(iterationsQuery);

            // Status distribution
            const statusQuery = `
                WITH status_counts AS (
                    SELECT
                        status,
                        COUNT(*) as count
                    FROM tickets
                    GROUP BY status
                ),
                total_count AS (
                    SELECT COUNT(*) as total FROM tickets
                )
                SELECT
                    sc.status,
                    sc.count,
                    ROUND((sc.count::decimal / NULLIF(tc.total, 0)) * 100, 2) as percentage
                FROM status_counts sc
                CROSS JOIN total_count tc
                ORDER BY sc.count DESC
            `;
            const statusResult = await client.query(statusQuery);

            // Priority distribution
            const priorityQuery = `
                WITH priority_counts AS (
                    SELECT
                        priority,
                        COUNT(*) as count
                    FROM tickets
                    GROUP BY priority
                ),
                total_count AS (
                    SELECT COUNT(*) as total FROM tickets
                )
                SELECT
                    pc.priority,
                    pc.count,
                    ROUND((pc.count::decimal / NULLIF(tc.total, 0)) * 100, 2) as percentage
                FROM priority_counts pc
                CROSS JOIN total_count tc
                ORDER BY
                    CASE pc.priority
                        WHEN 'URGENT' THEN 1
                        WHEN 'HIGH' THEN 2
                        WHEN 'MEDIUM' THEN 3
                        WHEN 'LOW' THEN 4
                    END
            `;
            const priorityResult = await client.query(priorityQuery);

            // Recent activity (today's metrics)
            const activityQuery = `
                SELECT
                    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as tickets_created_today,
                    COUNT(CASE WHEN status IN ('APPROVED', 'DELIVERED', 'CLOSED') AND DATE(created_at) = CURRENT_DATE THEN 1 END) as tickets_completed_today,
                    COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as tickets_in_progress
                FROM tickets
            `;
            const activityResult = await client.query(activityQuery);

            return {
                summary: {
                    total_tickets: parseInt(summaryResult.rows[0].total_tickets),
                    total_projects: parseInt(summaryResult.rows[0].total_projects),
                    total_users: parseInt(summaryResult.rows[0].total_users),
                    active_tickets: parseInt(summaryResult.rows[0].active_tickets),
                },
                ftr: {
                    percentage: Math.round(ftrPercentage * 100) / 100,
                    approved_first_time: parseInt(ftrData.approved_first_time),
                    total_completed: parseInt(ftrData.total_completed),
                },
                resolution: {
                    avg_hours: Math.round(parseFloat(resolutionResult.rows[0].avg_hours) * 100) / 100,
                    median_hours: Math.round(parseFloat(resolutionResult.rows[0].median_hours) * 100) / 100,
                    fastest_hours: Math.round(parseFloat(resolutionResult.rows[0].fastest_hours) * 100) / 100,
                    slowest_hours: Math.round(parseFloat(resolutionResult.rows[0].slowest_hours) * 100) / 100,
                },
                iterations: {
                    avg_per_ticket: Math.round(parseFloat(iterationsResult.rows[0].avg_per_ticket) * 100) / 100,
                    single_iteration_count: parseInt(iterationsResult.rows[0].single_iteration_count),
                    multiple_iterations_count: parseInt(iterationsResult.rows[0].multiple_iterations_count),
                },
                status_distribution: statusResult.rows.map(row => ({
                    status: row.status,
                    count: parseInt(row.count),
                    percentage: parseFloat(row.percentage),
                })),
                priority_distribution: priorityResult.rows.map(row => ({
                    priority: row.priority,
                    count: parseInt(row.count),
                    percentage: parseFloat(row.percentage),
                })),
                recent_activity: {
                    tickets_created_today: parseInt(activityResult.rows[0].tickets_created_today),
                    tickets_completed_today: parseInt(activityResult.rows[0].tickets_completed_today),
                    tickets_in_progress: parseInt(activityResult.rows[0].tickets_in_progress),
                },
            };
        } finally {
            client.release();
        }
    }

    // ==================== SPRINT ANALYTICS ====================

    async getSprintAnalytics(sprintId: string): Promise<SprintAnalytics> {
        const client = await pool.connect();
        try {
            // Sprint info
            const sprintQuery = `
                SELECT
                    id,
                    name,
                    start_date,
                    end_date,
                    EXTRACT(DAY FROM (end_date - start_date)) as days_total,
                    EXTRACT(DAY FROM (CURRENT_DATE - start_date)) as days_elapsed,
                    EXTRACT(DAY FROM (end_date - CURRENT_DATE)) as days_remaining,
                    (CURRENT_DATE BETWEEN start_date AND end_date) as is_active
                FROM sprints
                WHERE id = $1
            `;
            const sprintResult = await client.query(sprintQuery, [sprintId]);

            if (sprintResult.rows.length === 0) {
                throw new Error(`Sprint with ID ${sprintId} not found`);
            }

            const sprint = sprintResult.rows[0];

            // Tickets metrics
            const ticketsQuery = `
                SELECT
                    COUNT(*) as total,
                    COUNT(CASE WHEN status IN ('APPROVED', 'DELIVERED', 'CLOSED') THEN 1 END) as completed,
                    COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress,
                    COUNT(CASE WHEN status IN ('CREATED', 'ASSIGNED') THEN 1 END) as pending
                FROM tickets
                WHERE sprint_id = $1
            `;
            const ticketsResult = await client.query(ticketsQuery, [sprintId]);
            const ticketsData = ticketsResult.rows[0];
            const completionRate = ticketsData.total > 0
                ? (ticketsData.completed / ticketsData.total) * 100
                : 0;

            // FTR metrics for sprint
            const ftrQuery = `
                SELECT
                    COUNT(CASE WHEN fm.first_time_right = true THEN 1 END) as approved_first_time,
                    COUNT(CASE WHEN fm.first_time_right = false THEN 1 END) as required_revisions
                FROM tickets t
                LEFT JOIN ftr_metrics fm ON t.id = fm.ticket_id
                WHERE t.sprint_id = $1 AND t.status IN ('APPROVED', 'DELIVERED', 'CLOSED')
            `;
            const ftrResult = await client.query(ftrQuery, [sprintId]);
            const ftrData = ftrResult.rows[0];
            const totalFtrTickets = parseInt(ftrData.approved_first_time) + parseInt(ftrData.required_revisions);
            const ftrPercentage = totalFtrTickets > 0
                ? (ftrData.approved_first_time / totalFtrTickets) * 100
                : 0;

            // Velocity calculation
            const daysElapsed = Math.max(parseInt(sprint.days_elapsed), 1);
            const ticketsPerDay = ticketsData.completed / daysElapsed;
            const remainingTickets = ticketsData.total - ticketsData.completed;
            const daysToComplete = ticketsPerDay > 0 ? remainingTickets / ticketsPerDay : null;
            const estimatedCompletionDate = daysToComplete !== null
                ? new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000)
                : null;
            const onTrack = estimatedCompletionDate !== null && estimatedCompletionDate <= new Date(sprint.end_date);

            // Team metrics
            const teamQuery = `
                SELECT COUNT(DISTINCT user_id) as members_count
                FROM ticket_assignments
                WHERE ticket_id IN (SELECT id FROM tickets WHERE sprint_id = $1)
            `;
            const teamResult = await client.query(teamQuery, [sprintId]);
            const membersCount = parseInt(teamResult.rows[0].members_count) || 1;
            const ticketsPerMember = ticketsData.total / membersCount;

            // Timeline data (daily completion)
            const timelineQuery = `
                WITH date_series AS (
                    SELECT generate_series(
                        $2::date,
                        LEAST($3::date, CURRENT_DATE),
                        '1 day'::interval
                    )::date as date
                ),
                daily_completions AS (
                    SELECT
                        DATE(created_at) as completion_date,
                        COUNT(*) as tickets_completed
                    FROM tickets
                    WHERE sprint_id = $1
                        AND status IN ('APPROVED', 'DELIVERED', 'CLOSED')
                        AND DATE(created_at) BETWEEN $2 AND $3
                    GROUP BY DATE(created_at)
                )
                SELECT
                    ds.date::text,
                    COALESCE(dc.tickets_completed, 0) as tickets_completed,
                    SUM(COALESCE(dc.tickets_completed, 0)) OVER (ORDER BY ds.date) as cumulative_completed
                FROM date_series ds
                LEFT JOIN daily_completions dc ON ds.date = dc.completion_date
                ORDER BY ds.date
            `;
            const timelineResult = await client.query(timelineQuery, [
                sprintId,
                sprint.start_date,
                sprint.end_date
            ]);

            return {
                sprint: {
                    id: sprint.id,
                    name: sprint.name,
                    start_date: sprint.start_date,
                    end_date: sprint.end_date,
                    days_total: parseInt(sprint.days_total),
                    days_elapsed: Math.max(0, parseInt(sprint.days_elapsed)),
                    days_remaining: Math.max(0, parseInt(sprint.days_remaining)),
                    is_active: sprint.is_active,
                },
                tickets: {
                    total: parseInt(ticketsData.total),
                    completed: parseInt(ticketsData.completed),
                    in_progress: parseInt(ticketsData.in_progress),
                    pending: parseInt(ticketsData.pending),
                    completion_rate: Math.round(completionRate * 100) / 100,
                },
                ftr: {
                    percentage: Math.round(ftrPercentage * 100) / 100,
                    approved_first_time: parseInt(ftrData.approved_first_time),
                    required_revisions: parseInt(ftrData.required_revisions),
                },
                velocity: {
                    tickets_per_day: Math.round(ticketsPerDay * 100) / 100,
                    estimated_completion_date: estimatedCompletionDate,
                    on_track: onTrack,
                },
                team: {
                    members_count: membersCount,
                    tickets_per_member: Math.round(ticketsPerMember * 100) / 100,
                },
                timeline: timelineResult.rows.map(row => ({
                    date: row.date,
                    tickets_completed: parseInt(row.tickets_completed),
                    cumulative_completed: parseInt(row.cumulative_completed),
                })),
            };
        } finally {
            client.release();
        }
    }

    // ==================== USER ANALYTICS ====================

    async getUsersAnalytics(): Promise<UsersAnalytics> {
        const client = await pool.connect();
        try {
            // Summary metrics
            const summaryQuery = `
                SELECT
                    COUNT(DISTINCT u.id) as total_users,
                    COUNT(DISTINCT CASE WHEN u.employment_status = 'ACTIVE' THEN u.id END) as active_users,
                    COALESCE(AVG(CASE WHEN fm.first_time_right = true THEN 100 ELSE 0 END), 0) as avg_ftr,
                    COALESCE(AVG(EXTRACT(EPOCH FROM (a.approved_at - t.created_at)) / 3600), 0) as avg_resolution_hours
                FROM users u
                LEFT JOIN ticket_assignments ta ON u.id = ta.user_id
                LEFT JOIN tickets t ON ta.ticket_id = t.id
                LEFT JOIN ftr_metrics fm ON t.id = fm.ticket_id
                LEFT JOIN approvals a ON t.id = a.ticket_id
                WHERE t.status IN ('APPROVED', 'DELIVERED', 'CLOSED')
            `;
            const summaryResult = await client.query(summaryQuery);

            // Leaderboard (top performers by FTR and tickets completed)
            const leaderboardQuery = `
                WITH user_metrics AS (
                    SELECT
                        u.id,
                        u.name,
                        u.email,
                        COUNT(CASE WHEN t.status IN ('APPROVED', 'DELIVERED', 'CLOSED') THEN 1 END) as tickets_completed,
                        COALESCE(AVG(CASE WHEN fm.first_time_right = true THEN 100 ELSE 0 END), 0) as ftr_percentage,
                        COALESCE(AVG(EXTRACT(EPOCH FROM (a.approved_at - t.created_at)) / 3600), 0) as avg_resolution_hours
                    FROM users u
                    LEFT JOIN ticket_assignments ta ON u.id = ta.user_id AND ta.assignment_status = 'ACTIVE'
                    LEFT JOIN tickets t ON ta.ticket_id = t.id
                    LEFT JOIN ftr_metrics fm ON t.id = fm.ticket_id
                    LEFT JOIN approvals a ON t.id = a.ticket_id
                    WHERE u.employment_status = 'ACTIVE'
                    GROUP BY u.id, u.name, u.email
                    HAVING COUNT(t.id) > 0
                )
                SELECT
                    id,
                    name,
                    email,
                    tickets_completed,
                    ftr_percentage,
                    avg_resolution_hours,
                    RANK() OVER (ORDER BY ftr_percentage DESC, tickets_completed DESC) as rank
                FROM user_metrics
                ORDER BY rank
                LIMIT 10
            `;
            const leaderboardResult = await client.query(leaderboardQuery);

            // All users performance
            const usersResult = await this.getAllUserPerformance(client);

            return {
                summary: {
                    total_users: parseInt(summaryResult.rows[0].total_users),
                    active_users: parseInt(summaryResult.rows[0].active_users),
                    avg_ftr: Math.round(parseFloat(summaryResult.rows[0].avg_ftr) * 100) / 100,
                    avg_resolution_hours: Math.round(parseFloat(summaryResult.rows[0].avg_resolution_hours) * 100) / 100,
                },
                leaderboard: leaderboardResult.rows.map(row => ({
                    user: {
                        id: row.id,
                        name: row.name,
                        email: row.email,
                    },
                    metrics: {
                        ftr_percentage: Math.round(parseFloat(row.ftr_percentage) * 100) / 100,
                        tickets_completed: parseInt(row.tickets_completed),
                        avg_resolution_hours: Math.round(parseFloat(row.avg_resolution_hours) * 100) / 100,
                        rank: parseInt(row.rank),
                    },
                })),
                users: usersResult,
            };
        } finally {
            client.release();
        }
    }

    async getUserPerformance(userId: string): Promise<UserPerformance> {
        const client = await pool.connect();
        try {
            // User info
            const userQuery = `
                SELECT id, name, email, role
                FROM users
                WHERE id = $1
            `;
            const userResult = await client.query(userQuery, [userId]);

            if (userResult.rows.length === 0) {
                throw new Error(`User with ID ${userId} not found`);
            }

            const user = userResult.rows[0];

            // Tickets metrics
            const ticketsQuery = `
                SELECT
                    COUNT(*) as total_assigned,
                    COUNT(CASE WHEN t.status IN ('APPROVED', 'DELIVERED', 'CLOSED') THEN 1 END) as completed,
                    COUNT(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 END) as in_progress,
                    COUNT(CASE WHEN t.status IN ('CREATED', 'ASSIGNED') THEN 1 END) as pending
                FROM tickets t
                INNER JOIN ticket_assignments ta ON t.id = ta.ticket_id
                WHERE ta.user_id = $1 AND ta.assignment_status = 'ACTIVE'
            `;
            const ticketsResult = await client.query(ticketsQuery, [userId]);
            const ticketsData = ticketsResult.rows[0];
            const completionRate = ticketsData.total_assigned > 0
                ? (ticketsData.completed / ticketsData.total_assigned) * 100
                : 0;

            // FTR metrics
            const ftrQuery = `
                SELECT
                    COUNT(CASE WHEN fm.first_time_right = true THEN 1 END) as approved_first_time,
                    COUNT(CASE WHEN fm.first_time_right = false THEN 1 END) as required_revisions
                FROM tickets t
                INNER JOIN ticket_assignments ta ON t.id = ta.ticket_id
                LEFT JOIN ftr_metrics fm ON t.id = fm.ticket_id
                WHERE ta.user_id = $1
                    AND ta.assignment_status = 'ACTIVE'
                    AND t.status IN ('APPROVED', 'DELIVERED', 'CLOSED')
            `;
            const ftrResult = await client.query(ftrQuery, [userId]);
            const ftrData = ftrResult.rows[0];
            const totalFtrTickets = parseInt(ftrData.approved_first_time) + parseInt(ftrData.required_revisions);
            const ftrPercentage = totalFtrTickets > 0
                ? (ftrData.approved_first_time / totalFtrTickets) * 100
                : 0;

            // Performance metrics
            const performanceQuery = `
                WITH user_tickets AS (
                    SELECT
                        t.id,
                        t.created_at,
                        a.approved_at,
                        COUNT(ti.id) as iteration_count
                    FROM tickets t
                    INNER JOIN ticket_assignments ta ON t.id = ta.ticket_id
                    LEFT JOIN approvals a ON t.id = a.ticket_id
                    LEFT JOIN ticket_iterations ti ON t.id = ti.ticket_id
                    WHERE ta.user_id = $1
                        AND ta.assignment_status = 'ACTIVE'
                        AND t.status IN ('APPROVED', 'DELIVERED', 'CLOSED')
                    GROUP BY t.id, t.created_at, a.approved_at
                )
                SELECT
                    COALESCE(AVG(EXTRACT(EPOCH FROM (approved_at - created_at)) / 3600), 0) as avg_resolution_hours,
                    COALESCE(AVG(iteration_count), 0) as avg_iterations_per_ticket
                FROM user_tickets
            `;
            const performanceResult = await client.query(performanceQuery, [userId]);
            const performanceData = performanceResult.rows[0];

            // Active streak (consecutive days with activity)
            const streakQuery = `
                WITH daily_activity AS (
                    SELECT DISTINCT DATE(created_at) as activity_date
                    FROM tickets t
                    INNER JOIN ticket_assignments ta ON t.id = ta.ticket_id
                    WHERE ta.user_id = $1
                    ORDER BY activity_date DESC
                ),
                streak_calc AS (
                    SELECT
                        activity_date,
                        activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date DESC))::integer as streak_group
                    FROM daily_activity
                )
                SELECT COUNT(*) as streak_days
                FROM streak_calc
                WHERE streak_group = (SELECT MAX(streak_group) FROM streak_calc)
            `;
            const streakResult = await client.query(streakQuery, [userId]);

            // Recent tickets
            const recentQuery = `
                SELECT
                    t.id,
                    t.title,
                    t.status,
                    t.priority,
                    t.created_at,
                    a.approved_at as completed_at
                FROM tickets t
                INNER JOIN ticket_assignments ta ON t.id = ta.ticket_id
                LEFT JOIN approvals a ON t.id = a.ticket_id
                WHERE ta.user_id = $1 AND ta.assignment_status = 'ACTIVE'
                ORDER BY t.created_at DESC
                LIMIT 10
            `;
            const recentResult = await client.query(recentQuery, [userId]);

            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                tickets: {
                    total_assigned: parseInt(ticketsData.total_assigned),
                    completed: parseInt(ticketsData.completed),
                    in_progress: parseInt(ticketsData.in_progress),
                    pending: parseInt(ticketsData.pending),
                    completion_rate: Math.round(completionRate * 100) / 100,
                },
                ftr: {
                    percentage: Math.round(ftrPercentage * 100) / 100,
                    approved_first_time: parseInt(ftrData.approved_first_time),
                    required_revisions: parseInt(ftrData.required_revisions),
                },
                performance: {
                    avg_resolution_hours: Math.round(parseFloat(performanceData.avg_resolution_hours) * 100) / 100,
                    avg_iterations_per_ticket: Math.round(parseFloat(performanceData.avg_iterations_per_ticket) * 100) / 100,
                    active_streak_days: parseInt(streakResult.rows[0]?.streak_days || 0),
                },
                recent_tickets: recentResult.rows.map(row => ({
                    id: row.id,
                    title: row.title,
                    status: row.status,
                    priority: row.priority,
                    created_at: row.created_at,
                    completed_at: row.completed_at,
                })),
            };
        } finally {
            client.release();
        }
    }

    private async getAllUserPerformance(client: any): Promise<UserPerformance[]> {
        const usersQuery = `
            SELECT id FROM users WHERE employment_status = 'ACTIVE'
        `;
        const usersResult = await client.query(usersQuery);

        const performances: UserPerformance[] = [];
        for (const row of usersResult.rows) {
            try {
                const performance = await this.getUserPerformance(row.id);
                performances.push(performance);
            } catch (error) {
                // Skip users with no data
                console.error(`Error fetching performance for user ${row.id}:`, error);
            }
        }

        return performances;
    }
}
