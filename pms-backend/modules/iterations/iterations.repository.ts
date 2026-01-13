import { BaseRepository } from '@database/base.repository';
import { pool } from '@database/connection';
import { PoolClient } from 'pg';
import {
    TicketIteration,
    Approval,
    FTRMetric,
    IterationOutcome,
    ApprovalStatus,
} from './iterations.types';

export class IterationsRepository extends BaseRepository<TicketIteration> {
    constructor() {
        super('ticket_iterations');
    }

    /**
     * Create a new iteration
     */
    async createIteration(ticketId: string, iterationNumber: number): Promise<TicketIteration> {
        const result = await this.execute(
            `INSERT INTO ticket_iterations (ticket_id, iteration_number, outcome)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [ticketId, iterationNumber, IterationOutcome.PENDING]
        );
        return result.rows[0];
    }

    /**
     * Get all iterations for a ticket
     */
    async findByTicket(ticketId: string): Promise<TicketIteration[]> {
        const result = await this.execute(
            'SELECT * FROM ticket_iterations WHERE ticket_id = $1 ORDER BY iteration_number ASC',
            [ticketId]
        );
        return result.rows;
    }

    /**
     * Get current (latest) iteration for a ticket
     */
    async getCurrentIteration(ticketId: string): Promise<TicketIteration | null> {
        const result = await this.execute(
            `SELECT * FROM ticket_iterations
             WHERE ticket_id = $1
             ORDER BY iteration_number DESC
             LIMIT 1`,
            [ticketId]
        );
        return result.rows[0] || null;
    }

    /**
     * Update iteration outcome
     */
    async updateIterationOutcome(id: string, outcome: IterationOutcome): Promise<TicketIteration | null> {
        const result = await this.execute(
            'UPDATE ticket_iterations SET outcome = $1 WHERE id = $2 RETURNING *',
            [outcome, id]
        );
        return result.rows[0] || null;
    }

    /**
     * Count iterations for a ticket
     */
    async countIterations(ticketId: string): Promise<number> {
        const result = await this.execute(
            'SELECT COUNT(*) as count FROM ticket_iterations WHERE ticket_id = $1',
            [ticketId]
        );
        return parseInt(result.rows[0].count);
    }
}

export class ApprovalsRepository extends BaseRepository<Approval> {
    constructor() {
        super('approvals');
    }

    /**
     * Create an approval record
     */
    async createApproval(
        ticketId: string,
        approvedBy: string,
        status: ApprovalStatus
    ): Promise<Approval> {
        const result = await this.execute(
            `INSERT INTO approvals (ticket_id, approved_by, status)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [ticketId, approvedBy, status]
        );
        return result.rows[0];
    }

    /**
     * Get all approvals for a ticket
     */
    async findByTicket(ticketId: string): Promise<Approval[]> {
        const result = await this.execute(
            `SELECT a.*, u.name as approver_name, u.email as approver_email
             FROM approvals a
             JOIN users u ON a.approved_by = u.id
             WHERE a.ticket_id = $1
             ORDER BY a.approved_at DESC`,
            [ticketId]
        );
        return result.rows;
    }
}

export class FTRMetricsRepository extends BaseRepository<FTRMetric> {
    constructor() {
        super('ftr_metrics');
    }

    /**
     * Create or update FTR metric
     */
    async upsertFTR(ticketId: string, firstTimeRight: boolean, score: number): Promise<FTRMetric> {
        const result = await this.execute(
            `INSERT INTO ftr_metrics (ticket_id, first_time_right, score)
             VALUES ($1, $2, $3)
             ON CONFLICT (ticket_id)
             DO UPDATE SET first_time_right = $2, score = $3
             RETURNING *`,
            [ticketId, firstTimeRight, score]
        );
        return result.rows[0];
    }

    /**
     * Get FTR metric for a ticket
     */
    async getByTicket(ticketId: string): Promise<FTRMetric | null> {
        const result = await this.execute(
            'SELECT * FROM ftr_metrics WHERE ticket_id = $1',
            [ticketId]
        );
        return result.rows[0] || null;
    }

    /**
     * Check if FTR exists for a ticket
     */
    async hasFTR(ticketId: string): Promise<boolean> {
        const result = await this.execute(
            'SELECT COUNT(*) as count FROM ftr_metrics WHERE ticket_id = $1',
            [ticketId]
        );
        return parseInt(result.rows[0].count) > 0;
    }
}
