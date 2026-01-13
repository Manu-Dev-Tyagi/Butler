import { BaseRepository } from '@database/base.repository';
import { pool } from '@database/connection';
import { PoolClient } from 'pg';
import {
    Ticket,
    TicketAssignment,
    TicketStatus,
    TicketPriority,
    AssignmentStatus,
    CreateTicketDTO,
    UpdateTicketDTO,
} from './tickets.types';

export class TicketsRepository extends BaseRepository<Ticket> {
    constructor() {
        super('tickets');
    }

    /**
     * Create a new ticket with status CREATED
     */
    async create(data: CreateTicketDTO): Promise<Ticket> {
        const columns: string[] = ['project_id', 'title', 'priority', 'status'];
        const values: any[] = [data.project_id, data.title, data.priority, TicketStatus.CREATED];
        let paramIndex = 5;

        // Optional fields
        if (data.sprint_id) {
            columns.push('sprint_id');
            values.push(data.sprint_id);
        }
        if (data.description) {
            columns.push('description');
            values.push(data.description);
        }
        if (data.delivery_datetime) {
            columns.push('delivery_datetime');
            values.push(data.delivery_datetime);
        }
        if (data.delivery_slot) {
            columns.push('delivery_slot');
            values.push(data.delivery_slot);
        }
        if (data.ad_name) {
            columns.push('ad_name');
            values.push(data.ad_name);
        }
        if (data.creative_count !== undefined) {
            columns.push('creative_count');
            values.push(data.creative_count);
        }

        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const result = await this.execute(
            `INSERT INTO tickets (${columns.join(', ')})
             VALUES (${placeholders})
             RETURNING *`,
            values
        );

        return result.rows[0];
    }

    /**
     * Update ticket fields
     */
    async update(id: string, data: UpdateTicketDTO): Promise<Ticket | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.title) {
            updates.push(`title = $${paramIndex++}`);
            values.push(data.title);
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(data.description);
        }
        if (data.priority) {
            updates.push(`priority = $${paramIndex++}`);
            values.push(data.priority);
        }
        if (data.delivery_datetime !== undefined) {
            updates.push(`delivery_datetime = $${paramIndex++}`);
            values.push(data.delivery_datetime);
        }
        if (data.delivery_slot !== undefined) {
            updates.push(`delivery_slot = $${paramIndex++}`);
            values.push(data.delivery_slot);
        }
        if (data.ad_name !== undefined) {
            updates.push(`ad_name = $${paramIndex++}`);
            values.push(data.ad_name);
        }
        if (data.creative_count !== undefined) {
            updates.push(`creative_count = $${paramIndex++}`);
            values.push(data.creative_count);
        }
        if (data.sprint_id !== undefined) {
            updates.push(`sprint_id = $${paramIndex++}`);
            values.push(data.sprint_id);
        }

        if (updates.length === 0) {
            return this.findById(id);
        }

        values.push(id);

        const result = await this.execute(
            `UPDATE tickets
             SET ${updates.join(', ')}
             WHERE id = $${paramIndex}
             RETURNING *`,
            values
        );

        return result.rows[0] || null;
    }

    /**
     * Update ticket status
     */
    async updateStatus(id: string, status: TicketStatus): Promise<Ticket | null> {
        const result = await this.execute(
            `UPDATE tickets SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );
        return result.rows[0] || null;
    }

    /**
     * Get tickets by project ID
     */
    async findByProject(projectId: string): Promise<Ticket[]> {
        const result = await this.execute(
            'SELECT * FROM tickets WHERE project_id = $1 ORDER BY created_at DESC',
            [projectId]
        );
        return result.rows;
    }

    /**
     * Get tickets by sprint ID
     */
    async findBySprint(sprintId: string): Promise<Ticket[]> {
        const result = await this.execute(
            'SELECT * FROM tickets WHERE sprint_id = $1 ORDER BY created_at DESC',
            [sprintId]
        );
        return result.rows;
    }

    /**
     * Get all tickets ordered by created_at DESC
     */
    async findAllOrdered(): Promise<Ticket[]> {
        const result = await this.execute(
            'SELECT * FROM tickets ORDER BY created_at DESC',
            []
        );
        return result.rows;
    }

    // ===================== ASSIGNMENT METHODS =====================

    /**
     * Assign ticket to user (transactional)
     * - Deactivates any existing active assignment
     * - Creates new active assignment
     * - Updates ticket status to ASSIGNED
     */
    async assignTicket(ticketId: string, userId: string): Promise<TicketAssignment> {
        const client: PoolClient = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Deactivate any existing active assignments
            await client.query(
                `UPDATE ticket_assignments
                 SET assignment_status = $1, unassigned_at = CURRENT_TIMESTAMP
                 WHERE ticket_id = $2 AND assignment_status = $3`,
                [AssignmentStatus.INACTIVE, ticketId, AssignmentStatus.ACTIVE]
            );

            // 2. Create new active assignment
            const assignmentResult = await client.query(
                `INSERT INTO ticket_assignments (ticket_id, user_id, assignment_status)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [ticketId, userId, AssignmentStatus.ACTIVE]
            );

            // 3. Update ticket status to ASSIGNED (if currently CREATED)
            await client.query(
                `UPDATE tickets
                 SET status = $1
                 WHERE id = $2 AND status = $3`,
                [TicketStatus.ASSIGNED, ticketId, TicketStatus.CREATED]
            );

            await client.query('COMMIT');

            return assignmentResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Unassign ticket (exit flow only)
     * - Deactivates current active assignment
     * - Updates ticket status to REASSIGNED
     */
    async unassignTicket(ticketId: string): Promise<boolean> {
        const client: PoolClient = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Deactivate active assignment
            const assignmentResult = await client.query(
                `UPDATE ticket_assignments
                 SET assignment_status = $1, unassigned_at = CURRENT_TIMESTAMP
                 WHERE ticket_id = $2 AND assignment_status = $3
                 RETURNING *`,
                [AssignmentStatus.INACTIVE, ticketId, AssignmentStatus.ACTIVE]
            );

            if (assignmentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return false;
            }

            // 2. Update ticket status to REASSIGNED
            await client.query(
                `UPDATE tickets SET status = $1 WHERE id = $2`,
                [TicketStatus.REASSIGNED, ticketId]
            );

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get active assignment for a ticket
     */
    async getActiveAssignment(ticketId: string): Promise<TicketAssignment | null> {
        const result = await this.execute(
            `SELECT ta.*, u.name as user_name, u.email as user_email
             FROM ticket_assignments ta
             JOIN users u ON ta.user_id = u.id
             WHERE ta.ticket_id = $1 AND ta.assignment_status = $2`,
            [ticketId, AssignmentStatus.ACTIVE]
        );
        return result.rows[0] || null;
    }

    /**
     * Check if ticket has active assignment
     */
    async hasActiveAssignment(ticketId: string): Promise<boolean> {
        const result = await this.execute(
            `SELECT COUNT(*) as count FROM ticket_assignments
             WHERE ticket_id = $1 AND assignment_status = $2`,
            [ticketId, AssignmentStatus.ACTIVE]
        );
        return parseInt(result.rows[0].count) > 0;
    }

    /**
     * Get all assignments for a ticket (historical)
     */
    async getAssignmentHistory(ticketId: string): Promise<TicketAssignment[]> {
        const result = await this.execute(
            `SELECT ta.*, u.name as user_name, u.email as user_email
             FROM ticket_assignments ta
             JOIN users u ON ta.user_id = u.id
             WHERE ta.ticket_id = $1
             ORDER BY ta.assigned_at DESC`,
            [ticketId]
        );
        return result.rows;
    }
}
