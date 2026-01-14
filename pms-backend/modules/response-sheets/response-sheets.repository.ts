import { pool } from '@database/connection';
import { ResponseSheet, ResponseSheetSnapshot, ResponseSheetListItem } from './response-sheets.types';

export class ResponseSheetsRepository {
    // ==================== GENERATE SNAPSHOT ====================

    async generateSnapshot(projectId: string): Promise<ResponseSheetSnapshot> {
        const client = await pool.connect();
        try {
            // 1. Get project and client information
            const projectQuery = `
                SELECT
                    p.id, p.name, p.status, p.created_at,
                    c.id as client_id, c.name as client_name
                FROM projects p
                INNER JOIN clients c ON p.client_id = c.id
                WHERE p.id = $1
            `;
            const projectResult = await client.query(projectQuery, [projectId]);

            if (projectResult.rows.length === 0) {
                throw new Error(`Project with ID ${projectId} not found`);
            }

            const projectData = projectResult.rows[0];

            // 2. Get project POCs
            const pocsQuery = `
                SELECT name, email, phone
                FROM project_pocs
                WHERE project_id = $1
            `;
            const pocsResult = await client.query(pocsQuery, [projectId]);

            // 3. Get current team members
            const teamQuery = `
                SELECT
                    pm.user_id,
                    u.name,
                    u.email,
                    u.role,
                    pm.assigned_from
                FROM project_members pm
                INNER JOIN users u ON pm.user_id = u.id
                WHERE pm.project_id = $1 AND pm.is_current = true
                ORDER BY pm.assigned_from
            `;
            const teamResult = await client.query(teamQuery, [projectId]);

            // 4. Get all tickets with detailed information
            const ticketsQuery = `
                SELECT
                    t.id,
                    t.title,
                    t.description,
                    t.priority,
                    t.status,
                    t.delivery_datetime,
                    t.created_at,
                    ta.user_id as assigned_to,
                    u.name as assignee_name,
                    COUNT(ti.id) as iteration_count,
                    fm.first_time_right,
                    CASE
                        WHEN a.approved_at IS NOT NULL THEN
                            EXTRACT(EPOCH FROM (a.approved_at - t.created_at)) / 3600
                        ELSE NULL
                    END as resolution_hours
                FROM tickets t
                LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id AND ta.assignment_status = 'ACTIVE'
                LEFT JOIN users u ON ta.user_id = u.id
                LEFT JOIN ticket_iterations ti ON t.id = ti.ticket_id
                LEFT JOIN ftr_metrics fm ON t.id = fm.ticket_id
                LEFT JOIN approvals a ON t.id = a.ticket_id
                WHERE t.project_id = $1
                GROUP BY t.id, t.title, t.description, t.priority, t.status, t.delivery_datetime, t.created_at,
                         ta.user_id, u.name, fm.first_time_right, a.approved_at
                ORDER BY t.created_at DESC
            `;
            const ticketsResult = await client.query(ticketsQuery, [projectId]);

            // 5. Calculate summary metrics
            const tickets = ticketsResult.rows;
            const totalTickets = tickets.length;
            const completedTickets = tickets.filter(t =>
                ['APPROVED', 'DELIVERED', 'CLOSED'].includes(t.status)
            ).length;
            const inProgressTickets = tickets.filter(t =>
                ['IN_PROGRESS', 'SUBMITTED'].includes(t.status)
            ).length;
            const pendingTickets = tickets.filter(t =>
                ['CREATED', 'ASSIGNED'].includes(t.status)
            ).length;

            const ftrTickets = tickets.filter(t => t.first_time_right === true).length;
            const totalCompletedForFtr = tickets.filter(t =>
                t.first_time_right !== null
            ).length;
            const ftrPercentage = totalCompletedForFtr > 0
                ? (ftrTickets / totalCompletedForFtr) * 100
                : 0;

            const resolutionTimes = tickets
                .filter(t => t.resolution_hours !== null)
                .map(t => parseFloat(t.resolution_hours));
            const avgResolutionHours = resolutionTimes.length > 0
                ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
                : 0;

            const totalIterations = tickets.reduce((sum, t) => sum + parseInt(t.iteration_count), 0);
            const avgIterationsPerTicket = totalTickets > 0
                ? totalIterations / totalTickets
                : 0;

            // 6. Build snapshot object
            const snapshot: ResponseSheetSnapshot = {
                project: {
                    id: projectData.id,
                    name: projectData.name,
                    status: projectData.status,
                    created_at: projectData.created_at,
                },
                client: {
                    id: projectData.client_id,
                    name: projectData.client_name,
                },
                pocs: pocsResult.rows.map(poc => ({
                    name: poc.name,
                    email: poc.email,
                    phone: poc.phone,
                })),
                team_members: teamResult.rows.map(member => ({
                    user_id: member.user_id,
                    name: member.name,
                    email: member.email,
                    role: member.role,
                    assigned_from: member.assigned_from,
                })),
                tickets: tickets.map(ticket => ({
                    id: ticket.id,
                    title: ticket.title,
                    description: ticket.description,
                    priority: ticket.priority,
                    status: ticket.status,
                    delivery_datetime: ticket.delivery_datetime,
                    created_at: ticket.created_at,
                    assigned_to: ticket.assigned_to,
                    assignee_name: ticket.assignee_name,
                    iteration_count: parseInt(ticket.iteration_count),
                    first_time_right: ticket.first_time_right,
                    resolution_hours: ticket.resolution_hours ? parseFloat(ticket.resolution_hours) : null,
                })),
                summary: {
                    total_tickets: totalTickets,
                    completed_tickets: completedTickets,
                    in_progress_tickets: inProgressTickets,
                    pending_tickets: pendingTickets,
                    ftr_percentage: Math.round(ftrPercentage * 100) / 100,
                    avg_resolution_hours: Math.round(avgResolutionHours * 100) / 100,
                    total_iterations: totalIterations,
                    avg_iterations_per_ticket: Math.round(avgIterationsPerTicket * 100) / 100,
                },
                generated_at: new Date(),
            };

            return snapshot;
        } finally {
            client.release();
        }
    }

    // ==================== CREATE RESPONSE SHEET ====================

    async createSheet(projectId: string, snapshot: ResponseSheetSnapshot): Promise<ResponseSheet> {
        const query = `
            INSERT INTO response_sheets (project_id, snapshot_data, avg_resolution_time)
            VALUES ($1, $2, $3)
            RETURNING id, project_id, snapshot_data, generated_at, sent_at, sent_to, avg_resolution_time
        `;

        const result = await pool.query(query, [
            projectId,
            JSON.stringify(snapshot),
            snapshot.summary.avg_resolution_hours,
        ]);

        return result.rows[0];
    }

    // ==================== RETRIEVE RESPONSE SHEETS ====================

    async getSheetById(sheetId: string): Promise<ResponseSheet | null> {
        const query = `
            SELECT id, project_id, snapshot_data, generated_at, sent_at, sent_to, avg_resolution_time
            FROM response_sheets
            WHERE id = $1
        `;

        const result = await pool.query(query, [sheetId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    async getSheetsByProjectId(projectId: string): Promise<ResponseSheetListItem[]> {
        const query = `
            SELECT
                rs.id,
                rs.project_id,
                p.name as project_name,
                rs.generated_at,
                rs.sent_at,
                rs.sent_to,
                (rs.snapshot_data->'summary'->>'total_tickets')::int as total_tickets,
                (rs.snapshot_data->'summary'->>'completed_tickets')::int as completed_tickets,
                (rs.snapshot_data->'summary'->>'ftr_percentage')::decimal as ftr_percentage
            FROM response_sheets rs
            INNER JOIN projects p ON rs.project_id = p.id
            WHERE rs.project_id = $1
            ORDER BY rs.generated_at DESC
        `;

        const result = await pool.query(query, [projectId]);
        return result.rows;
    }

    async getAllSheets(): Promise<ResponseSheetListItem[]> {
        const query = `
            SELECT
                rs.id,
                rs.project_id,
                p.name as project_name,
                rs.generated_at,
                rs.sent_at,
                rs.sent_to,
                (rs.snapshot_data->'summary'->>'total_tickets')::int as total_tickets,
                (rs.snapshot_data->'summary'->>'completed_tickets')::int as completed_tickets,
                (rs.snapshot_data->'summary'->>'ftr_percentage')::decimal as ftr_percentage
            FROM response_sheets rs
            INNER JOIN projects p ON rs.project_id = p.id
            ORDER BY rs.generated_at DESC
        `;

        const result = await pool.query(query);
        return result.rows;
    }

    // ==================== UPDATE SENT STATUS ====================

    async markAsSent(sheetId: string, recipients: string[]): Promise<void> {
        const query = `
            UPDATE response_sheets
            SET sent_at = CURRENT_TIMESTAMP, sent_to = $1
            WHERE id = $2
        `;

        await pool.query(query, [recipients, sheetId]);
    }
}
