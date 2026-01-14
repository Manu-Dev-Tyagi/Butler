import { pool } from '@database/connection';
import { PoolClient } from 'pg';
import {
    IterationsRepository,
    ApprovalsRepository,
    FTRMetricsRepository,
} from './iterations.repository';
import {
    TicketIteration,
    Approval,
    FTRMetric,
    IterationOutcome,
    ApprovalStatus,
    ApproveTicketDTO,
    RejectTicketDTO,
} from './iterations.types';
import { TicketsRepository } from '@modules/tickets/tickets.repository';
import { TicketStatus } from '@modules/tickets/tickets.types';
import { IterationEventPublisher, IterationEventType } from '@events/publishers/iteration.publisher';

export class IterationsService {
    private readonly iterationsRepo: IterationsRepository;
    private readonly approvalsRepo: ApprovalsRepository;
    private readonly ftrRepo: FTRMetricsRepository;
    private readonly ticketsRepo: TicketsRepository;
    private readonly iterationPublisher: IterationEventPublisher;

    constructor() {
        this.iterationsRepo = new IterationsRepository();
        this.approvalsRepo = new ApprovalsRepository();
        this.ftrRepo = new FTRMetricsRepository();
        this.ticketsRepo = new TicketsRepository();
        this.iterationPublisher = new IterationEventPublisher();
    }

    /**
     * Create first iteration for a ticket (call this when ticket is submitted)
     */
    async createFirstIteration(ticketId: string): Promise<TicketIteration> {
        // Check if ticket exists
        const ticket = await this.ticketsRepo.findById(ticketId);
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        // Check if iteration already exists
        const existingIterations = await this.iterationsRepo.findByTicket(ticketId);
        if (existingIterations.length > 0) {
            throw new Error('Iteration already exists for this ticket');
        }

        const iteration = await this.iterationsRepo.createIteration(ticketId, 1);

        // Fetch active assignment to get actedByUserId (to respect 'no controller changes' rule)
        const activeAssignment = await this.ticketsRepo.getActiveAssignment(ticketId);
        const actedByUserId = activeAssignment ? activeAssignment.user_id : '00000000-0000-0000-0000-000000000000'; // Fallback if system user or unassigned

        // Emit Event
        await this.iterationPublisher.emitIterationEvent(IterationEventType.ITERATION_SUBMITTED, {
            iterationId: iteration.id,
            ticketId: ticketId,
            actedByUserId: actedByUserId,
            status: 'SUBMITTED',
            occurredAt: new Date(),
        });

        return iteration;
    }

    /**
     * Create a new iteration manually
     */
    async createIteration(ticketId: string): Promise<TicketIteration> {
        const ticket = await this.ticketsRepo.findById(ticketId);
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        const currentIteration = await this.iterationsRepo.getCurrentIteration(ticketId);
        const nextIterationNumber = currentIteration ? currentIteration.iteration_number + 1 : 1;

        const iteration = await this.iterationsRepo.createIteration(ticketId, nextIterationNumber);

        // Fetch active assignment to get actedByUserId
        const activeAssignment = await this.ticketsRepo.getActiveAssignment(ticketId);
        const actedByUserId = activeAssignment ? activeAssignment.user_id : '00000000-0000-0000-0000-000000000000';

        // Emit Event
        await this.iterationPublisher.emitIterationEvent(IterationEventType.ITERATION_SUBMITTED, {
            iterationId: iteration.id,
            ticketId: ticketId,
            actedByUserId: actedByUserId,
            status: 'SUBMITTED',
            occurredAt: new Date(),
        });

        return iteration;
    }

    /**
     * Get all iterations for a ticket
     */
    async getIterations(ticketId: string): Promise<TicketIteration[]> {
        return this.iterationsRepo.findByTicket(ticketId);
    }

    /**
     * Approve ticket (Transactional)
     * - Updates current iteration outcome to APPROVED
     * - Calculates and sets FTR (TRUE if iteration 1, FALSE otherwise)
     * - Updates ticket status to APPROVED
     * - Creates approval record
     */
    async approveTicket(
        ticketId: string,
        data: ApproveTicketDTO
    ): Promise<{ iteration: TicketIteration; approval: Approval; ftr: FTRMetric }> {
        const client: PoolClient = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Get ticket
            const ticket = await this.ticketsRepo.findById(ticketId);
            if (!ticket) {
                throw new Error('Ticket not found');
            }

            // 2. Get current iteration
            const currentIteration = await this.iterationsRepo.getCurrentIteration(ticketId);
            if (!currentIteration) {
                throw new Error('No iteration found for this ticket. Create an iteration first.');
            }

            if (currentIteration.outcome !== IterationOutcome.PENDING) {
                throw new Error('Current iteration is not pending. Cannot approve.');
            }

            // 3. Update iteration outcome to APPROVED
            await client.query(
                'UPDATE ticket_iterations SET outcome = $1 WHERE id = $2',
                [IterationOutcome.APPROVED, currentIteration.id]
            );

            // 4. Calculate FTR (TRUE only if iteration 1)
            const firstTimeRight = currentIteration.iteration_number === 1;
            const ftrScore = firstTimeRight ? 100 : 0;

            // 5. Create or update FTR metric
            const ftrResult = await client.query(
                `INSERT INTO ftr_metrics (ticket_id, first_time_right, score)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (ticket_id)
                 DO UPDATE SET first_time_right = EXCLUDED.first_time_right, score = EXCLUDED.score
                 RETURNING *`,
                [ticketId, firstTimeRight, ftrScore]
            );

            // 6. Update ticket status to APPROVED
            await client.query('UPDATE tickets SET status = $1 WHERE id = $2', [
                TicketStatus.APPROVED,
                ticketId,
            ]);

            // 7. Create approval record
            const approvalResult = await client.query(
                `INSERT INTO approvals (ticket_id, approved_by, status)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [ticketId, data.approved_by, ApprovalStatus.APPROVED]
            );

            await client.query('COMMIT');
            client.release();

            // 8. Emit Event (Async, outside transaction)
            await this.iterationPublisher.emitIterationEvent(IterationEventType.ITERATION_APPROVED, {
                iterationId: currentIteration.id,
                ticketId: ticketId,
                actedByUserId: data.approved_by,
                approverUserId: data.approved_by,
                status: 'APPROVED',
                occurredAt: new Date(),
            });

            // Fetch updated iteration
            const updatedIteration = await this.iterationsRepo.findById(currentIteration.id);

            return {
                iteration: updatedIteration!,
                approval: approvalResult.rows[0],
                ftr: ftrResult.rows[0],
            };
        } catch (error) {
            if (client) {
                await client.query('ROLLBACK');
                client.release();
            }
            throw error;
        }
    }

    /**
     * Reject ticket / Request revision (Transactional)
     * - Updates current iteration outcome to REJECTED
     * - Creates NEW iteration with iteration_number + 1
     * - Sets FTR = FALSE (permanent, locked)
     * - Updates ticket status to REVISION_REQUIRED
     * - Creates approval record with REJECTED status
     */
    async rejectTicket(
        ticketId: string,
        data: RejectTicketDTO
    ): Promise<{
        oldIteration: TicketIteration;
        newIteration: TicketIteration;
        approval: Approval;
        ftr: FTRMetric;
    }> {
        const client: PoolClient = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Get ticket
            const ticket = await this.ticketsRepo.findById(ticketId);
            if (!ticket) {
                throw new Error('Ticket not found');
            }

            // 2. Get current iteration
            const currentIteration = await this.iterationsRepo.getCurrentIteration(ticketId);
            if (!currentIteration) {
                throw new Error('No iteration found for this ticket. Create an iteration first.');
            }

            if (currentIteration.outcome !== IterationOutcome.PENDING) {
                throw new Error('Current iteration is not pending. Cannot reject.');
            }

            // 3. Update current iteration outcome to REJECTED
            await client.query(
                'UPDATE ticket_iterations SET outcome = $1 WHERE id = $2',
                [IterationOutcome.REJECTED, currentIteration.id]
            );

            // 4. Create NEW iteration with iteration_number + 1
            const newIterationResult = await client.query(
                `INSERT INTO ticket_iterations (ticket_id, iteration_number, outcome)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [ticketId, currentIteration.iteration_number + 1, IterationOutcome.PENDING]
            );

            // 5. Set FTR = FALSE (permanent, locked)
            const ftrResult = await client.query(
                `INSERT INTO ftr_metrics (ticket_id, first_time_right, score)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (ticket_id)
                 DO UPDATE SET first_time_right = FALSE, score = 0
                 RETURNING *`,
                [ticketId, false, 0]
            );

            // 6. Update ticket status to REVISION_REQUIRED
            await client.query('UPDATE tickets SET status = $1 WHERE id = $2', [
                TicketStatus.REVISION_REQUIRED,
                ticketId,
            ]);

            // 7. Create approval record with REJECTED status
            const approvalResult = await client.query(
                `INSERT INTO approvals (ticket_id, approved_by, status)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [ticketId, data.approved_by, ApprovalStatus.REJECTED]
            );

            await client.query('COMMIT');
            client.release();

            // 8. Emit Event (Async, outside transaction)
            await this.iterationPublisher.emitIterationEvent(IterationEventType.ITERATION_REJECTED, {
                iterationId: currentIteration.id,
                ticketId: ticketId,
                actedByUserId: data.approved_by,
                approverUserId: data.approved_by,
                status: 'REJECTED',
                remarks: data.reason,
                occurredAt: new Date(),
            });

            // Fetch updated iteration
            const updatedOldIteration = await this.iterationsRepo.findById(currentIteration.id);

            return {
                oldIteration: updatedOldIteration!,
                newIteration: newIterationResult.rows[0],
                approval: approvalResult.rows[0],
                ftr: ftrResult.rows[0],
            };
        } catch (error) {
            if (client) {
                await client.query('ROLLBACK');
                client.release();
            }
            throw error;
        }
    }

    /**
     * Get FTR metric for a ticket
     */
    async getFTR(ticketId: string): Promise<FTRMetric | null> {
        return this.ftrRepo.getByTicket(ticketId);
    }

    /**
     * Get all approvals for a ticket
     */
    async getApprovals(ticketId: string): Promise<Approval[]> {
        return this.approvalsRepo.findByTicket(ticketId);
    }
}
