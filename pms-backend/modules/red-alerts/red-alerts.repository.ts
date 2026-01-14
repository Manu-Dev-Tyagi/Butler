import { BaseRepository } from '@database/base.repository';
import { pool } from '@database/connection';
import {
    RedAlert,
    RedAlertWithDetails,
    AlertReason,
    CreateRedAlertDTO,
    AlertFilters,
    AlertStatistics,
} from './red-alerts.types';

export class RedAlertsRepository extends BaseRepository<RedAlert> {
    constructor() {
        super('red_alerts');
    }

    /**
     * Create a new red alert
     */
    async createAlert(data: CreateRedAlertDTO): Promise<RedAlert> {
        const result = await pool.query(
            `INSERT INTO red_alerts (ticket_id, reason)
             VALUES ($1, $2)
             RETURNING *`,
            [data.ticket_id, data.reason]
        );

        return result.rows[0];
    }

    /**
     * Get all alerts with ticket and project details
     */
    async findAllWithDetails(filters?: AlertFilters): Promise<RedAlertWithDetails[]> {
        let query = `
            SELECT
                ra.id,
                ra.ticket_id,
                ra.reason,
                ra.triggered_at,
                t.title as ticket_title,
                t.status as ticket_status,
                t.priority as ticket_priority,
                t.delivery_datetime,
                t.project_id,
                p.name as project_name,
                ta.user_id as assigned_to,
                u.name as assignee_name,
                u.email as assignee_email,
                (SELECT COUNT(*) FROM ticket_iterations WHERE ticket_id = t.id) as iteration_count,
                (SELECT MAX(created_at) FROM ticket_iterations WHERE ticket_id = t.id) as last_updated
            FROM red_alerts ra
            JOIN tickets t ON ra.ticket_id = t.id
            JOIN projects p ON t.project_id = p.id
            LEFT JOIN (
                SELECT DISTINCT ON (ticket_id) ticket_id, user_id
                FROM ticket_assignments
                WHERE assignment_status = 'ACTIVE'
                ORDER BY ticket_id, assigned_at DESC
            ) ta ON t.id = ta.ticket_id
            LEFT JOIN users u ON ta.user_id = u.id
            WHERE 1=1
        `;

        const params: any[] = [];
        let paramIndex = 1;

        if (filters) {
            if (filters.reason) {
                query += ` AND ra.reason = $${paramIndex}`;
                params.push(filters.reason);
                paramIndex++;
            }
            if (filters.project_id) {
                query += ` AND t.project_id = $${paramIndex}`;
                params.push(filters.project_id);
                paramIndex++;
            }
            if (filters.ticket_id) {
                query += ` AND ra.ticket_id = $${paramIndex}`;
                params.push(filters.ticket_id);
                paramIndex++;
            }
            if (filters.from_date) {
                query += ` AND ra.triggered_at >= $${paramIndex}`;
                params.push(filters.from_date);
                paramIndex++;
            }
            if (filters.to_date) {
                query += ` AND ra.triggered_at <= $${paramIndex}`;
                params.push(filters.to_date);
                paramIndex++;
            }
        }

        query += ` ORDER BY ra.triggered_at DESC`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Get alerts for a specific ticket
     */
    async findByTicket(ticketId: string): Promise<RedAlert[]> {
        const result = await pool.query(
            `SELECT * FROM red_alerts WHERE ticket_id = $1 ORDER BY triggered_at DESC`,
            [ticketId]
        );

        return result.rows;
    }

    /**
     * Get alerts for a specific project
     */
    async findByProject(projectId: string): Promise<RedAlertWithDetails[]> {
        return this.findAllWithDetails({ project_id: projectId });
    }

    /**
     * Get alert statistics
     */
    async getStatistics(): Promise<AlertStatistics> {
        // Total and active alerts
        const totalResult = await pool.query(`
            SELECT COUNT(*) as total_alerts
            FROM red_alerts
        `);

        const activeResult = await pool.query(`
            SELECT COUNT(DISTINCT ra.ticket_id) as active_alerts
            FROM red_alerts ra
            JOIN tickets t ON ra.ticket_id = t.id
            WHERE t.status NOT IN ('CLOSED', 'CANCELLED', 'DELIVERED')
        `);

        // By reason
        const byReasonResult = await pool.query(`
            SELECT reason, COUNT(*) as count
            FROM red_alerts
            GROUP BY reason
        `);

        const byReason = {
            excessive_iterations: 0,
            sla_breach: 0,
            idle_ticket: 0,
        };

        byReasonResult.rows.forEach((row) => {
            if (row.reason === AlertReason.EXCESSIVE_ITERATIONS) {
                byReason.excessive_iterations = parseInt(row.count);
            } else if (row.reason === AlertReason.SLA_BREACH) {
                byReason.sla_breach = parseInt(row.count);
            } else if (row.reason === AlertReason.IDLE_TICKET) {
                byReason.idle_ticket = parseInt(row.count);
            }
        });

        // By project
        const byProjectResult = await pool.query(`
            SELECT
                p.id as project_id,
                p.name as project_name,
                COUNT(DISTINCT ra.ticket_id) as alert_count
            FROM red_alerts ra
            JOIN tickets t ON ra.ticket_id = t.id
            JOIN projects p ON t.project_id = p.id
            WHERE t.status NOT IN ('CLOSED', 'CANCELLED', 'DELIVERED')
            GROUP BY p.id, p.name
            ORDER BY alert_count DESC
            LIMIT 10
        `);

        return {
            total_alerts: parseInt(totalResult.rows[0].total_alerts),
            active_alerts: parseInt(activeResult.rows[0].active_alerts),
            by_reason: byReason,
            by_project: byProjectResult.rows.map((row) => ({
                project_id: row.project_id,
                project_name: row.project_name,
                alert_count: parseInt(row.alert_count),
            })),
        };
    }

    /**
     * Check if alert already exists for ticket with same reason
     * (to prevent duplicate alerts)
     */
    async existsForTicket(ticketId: string, reason: AlertReason): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(
                SELECT 1 FROM red_alerts
                WHERE ticket_id = $1 AND reason = $2
            ) as exists`,
            [ticketId, reason]
        );

        return result.rows[0].exists;
    }

    /**
     * Delete alerts for a specific ticket and reason
     * (Used when alert condition is resolved)
     */
    async deleteByTicketAndReason(ticketId: string, reason: AlertReason): Promise<void> {
        await pool.query(
            `DELETE FROM red_alerts WHERE ticket_id = $1 AND reason = $2`,
            [ticketId, reason]
        );
    }

    /**
     * Get recent alerts (last 24 hours)
     */
    async getRecentAlerts(hours: number = 24): Promise<RedAlertWithDetails[]> {
        const fromDate = new Date();
        fromDate.setHours(fromDate.getHours() - hours);

        return this.findAllWithDetails({ from_date: fromDate });
    }
}
