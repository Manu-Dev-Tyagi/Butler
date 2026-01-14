import { pool } from '@database/connection';
import { RedAlertsRepository } from './red-alerts.repository';
import {
    RedAlert,
    RedAlertWithDetails,
    AlertReason,
    AlertFilters,
    AlertStatistics,
} from './red-alerts.types';
import { TicketStatus } from '@modules/tickets/tickets.types';

export class RedAlertsService {
    private readonly repository: RedAlertsRepository;

    // Configuration (can be moved to .env)
    private readonly ITERATION_THRESHOLD = 2; // Trigger alert if iterations > 2
    private readonly IDLE_THRESHOLD_HOURS = 48; // Trigger alert if no update for 48 hours

    constructor() {
        this.repository = new RedAlertsRepository();
    }

    /**
     * Get all alerts with details (for dashboards)
     */
    async getAllAlerts(filters?: AlertFilters): Promise<RedAlertWithDetails[]> {
        return this.repository.findAllWithDetails(filters);
    }

    /**
     * Get alerts for a specific ticket
     */
    async getAlertsByTicket(ticketId: string): Promise<RedAlert[]> {
        return this.repository.findByTicket(ticketId);
    }

    /**
     * Get alerts for a specific project
     */
    async getAlertsByProject(projectId: string): Promise<RedAlertWithDetails[]> {
        return this.repository.findByProject(projectId);
    }

    /**
     * Get alert statistics
     */
    async getStatistics(): Promise<AlertStatistics> {
        return this.repository.getStatistics();
    }

    /**
     * Get recent alerts (last 24 hours)
     */
    async getRecentAlerts(hours: number = 24): Promise<RedAlertWithDetails[]> {
        return this.repository.getRecentAlerts(hours);
    }

    /**
     * Manually trigger an alert (used by cron job or admin)
     */
    async triggerAlert(ticketId: string, reason: AlertReason): Promise<RedAlert> {
        // Check if alert already exists
        const exists = await this.repository.existsForTicket(ticketId, reason);
        if (exists) {
            throw new Error(`Alert already exists for ticket ${ticketId} with reason ${reason}`);
        }

        // Create alert
        const alert = await this.repository.createAlert({ ticket_id: ticketId, reason });

        console.log(`[RED-ALERT] Alert triggered for ticket ${ticketId}: ${reason}`);

        return alert;
    }

    /**
     * Check all tickets and trigger alerts where conditions are met
     * This should be called by a cron job
     */
    async scanAndTriggerAlerts(): Promise<{
        excessive_iterations: number;
        sla_breach: number;
        idle_ticket: number;
    }> {
        console.log('[RED-ALERT-SCAN] Starting alert scan...');

        let excessiveIterationsCount = 0;
        let slaBreachCount = 0;
        let idleTicketCount = 0;

        // 1. Check for EXCESSIVE_ITERATIONS (> 2 iterations)
        const excessiveIterationsResult = await pool.query(`
            SELECT t.id as ticket_id
            FROM tickets t
            WHERE t.status NOT IN ('CLOSED', 'CANCELLED', 'DELIVERED')
            AND (
                SELECT COUNT(*) FROM ticket_iterations WHERE ticket_id = t.id
            ) > $1
            AND NOT EXISTS (
                SELECT 1 FROM red_alerts
                WHERE ticket_id = t.id AND reason = $2
            )
        `, [this.ITERATION_THRESHOLD, AlertReason.EXCESSIVE_ITERATIONS]);

        for (const row of excessiveIterationsResult.rows) {
            try {
                await this.triggerAlert(row.ticket_id, AlertReason.EXCESSIVE_ITERATIONS);
                excessiveIterationsCount++;
            } catch (error: any) {
                console.error(`[RED-ALERT-SCAN] Failed to trigger EXCESSIVE_ITERATIONS alert:`, error.message);
            }
        }

        // 2. Check for SLA_BREACH (delivery_datetime crossed)
        const slaBreachResult = await pool.query(`
            SELECT t.id as ticket_id
            FROM tickets t
            WHERE t.status NOT IN ('CLOSED', 'CANCELLED', 'DELIVERED', 'APPROVED')
            AND t.delivery_datetime IS NOT NULL
            AND t.delivery_datetime < CURRENT_TIMESTAMP
            AND NOT EXISTS (
                SELECT 1 FROM red_alerts
                WHERE ticket_id = t.id AND reason = $1
            )
        `, [AlertReason.SLA_BREACH]);

        for (const row of slaBreachResult.rows) {
            try {
                await this.triggerAlert(row.ticket_id, AlertReason.SLA_BREACH);
                slaBreachCount++;
            } catch (error: any) {
                console.error(`[RED-ALERT-SCAN] Failed to trigger SLA_BREACH alert:`, error.message);
            }
        }

        // 3. Check for IDLE_TICKET (no updates for X hours)
        const idleTicketResult = await pool.query(`
            SELECT t.id as ticket_id
            FROM tickets t
            WHERE t.status NOT IN ('CLOSED', 'CANCELLED', 'DELIVERED')
            AND t.status IN ('IN_PROGRESS', 'ASSIGNED')
            AND (
                SELECT MAX(created_at) FROM ticket_iterations WHERE ticket_id = t.id
            ) < CURRENT_TIMESTAMP - INTERVAL '${this.IDLE_THRESHOLD_HOURS} hours'
            AND NOT EXISTS (
                SELECT 1 FROM red_alerts
                WHERE ticket_id = t.id AND reason = $1
            )
        `, [AlertReason.IDLE_TICKET]);

        for (const row of idleTicketResult.rows) {
            try {
                await this.triggerAlert(row.ticket_id, AlertReason.IDLE_TICKET);
                idleTicketCount++;
            } catch (error: any) {
                console.error(`[RED-ALERT-SCAN] Failed to trigger IDLE_TICKET alert:`, error.message);
            }
        }

        console.log(`[RED-ALERT-SCAN] Scan complete. New alerts: ${excessiveIterationsCount + slaBreachCount + idleTicketCount}`);

        return {
            excessive_iterations: excessiveIterationsCount,
            sla_breach: slaBreachCount,
            idle_ticket: idleTicketCount,
        };
    }

    /**
     * Resolve alerts when conditions are fixed
     * (e.g., ticket approved, delivered, or updated)
     */
    async resolveAlertsForTicket(ticketId: string): Promise<void> {
        // Get ticket details
        const ticketResult = await pool.query(
            `SELECT status, delivery_datetime,
                    (SELECT COUNT(*) FROM ticket_iterations WHERE ticket_id = $1) as iteration_count,
                    (SELECT MAX(created_at) FROM ticket_iterations WHERE ticket_id = $1) as last_updated
             FROM tickets WHERE id = $1`,
            [ticketId]
        );

        if (ticketResult.rows.length === 0) {
            return;
        }

        const ticket = ticketResult.rows[0];

        // Resolve EXCESSIVE_ITERATIONS if ticket is completed
        if (['CLOSED', 'CANCELLED', 'DELIVERED'].includes(ticket.status)) {
            await this.repository.deleteByTicketAndReason(ticketId, AlertReason.EXCESSIVE_ITERATIONS);
        }

        // Resolve SLA_BREACH if ticket is approved or delivered
        if (['APPROVED', 'DELIVERED', 'CLOSED'].includes(ticket.status)) {
            await this.repository.deleteByTicketAndReason(ticketId, AlertReason.SLA_BREACH);
        }

        // Resolve IDLE_TICKET if ticket has been updated recently
        const lastUpdated = ticket.last_updated ? new Date(ticket.last_updated) : null;
        if (lastUpdated) {
            const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
            if (hoursSinceUpdate < this.IDLE_THRESHOLD_HOURS) {
                await this.repository.deleteByTicketAndReason(ticketId, AlertReason.IDLE_TICKET);
            }
        }

        console.log(`[RED-ALERT] Resolved alerts for ticket ${ticketId}`);
    }

    /**
     * Get active alerts count (for dashboard badges)
     */
    async getActiveAlertsCount(): Promise<number> {
        const stats = await this.getStatistics();
        return stats.active_alerts;
    }
}
