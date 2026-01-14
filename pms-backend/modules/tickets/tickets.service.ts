import { TicketsRepository } from './tickets.repository';
import {
    Ticket,
    TicketAssignment,
    TicketPriority,
    TicketStatus,
    CreateTicketDTO,
    UpdateTicketDTO,
    AssignTicketDTO,
} from './tickets.types';
import { TicketEventPublisher } from '@events/publishers/ticket.publisher';

export class TicketsService {
    private readonly repository: TicketsRepository;
    private readonly eventPublisher: TicketEventPublisher;

    constructor() {
        this.repository = new TicketsRepository();
        this.eventPublisher = new TicketEventPublisher();
    }

    /**
     * Create a new ticket
     */
    async createTicket(data: CreateTicketDTO): Promise<Ticket> {
        // Validation
        if (!data.project_id || !data.title || !data.priority) {
            throw new Error('project_id, title, and priority are required');
        }

        if (data.title.trim() === '') {
            throw new Error('Title cannot be empty');
        }

        // Validate priority
        if (!Object.values(TicketPriority).includes(data.priority)) {
            throw new Error('Invalid priority value');
        }

        return this.repository.create(data);
    }

    /**
     * Get all tickets
     */
    async findAll(): Promise<Ticket[]> {
        return this.repository.findAllOrdered();
    }

    /**
     * Get ticket by ID
     */
    async findById(id: string): Promise<Ticket | null> {
        return this.repository.findById(id);
    }

    /**
     * Update ticket
     */
    async updateTicket(id: string, data: UpdateTicketDTO): Promise<Ticket | null> {
        // Validation
        if (data.title !== undefined && data.title.trim() === '') {
            throw new Error('Title cannot be empty');
        }

        if (data.priority && !Object.values(TicketPriority).includes(data.priority)) {
            throw new Error('Invalid priority value');
        }

        if (data.status && !Object.values(TicketStatus).includes(data.status)) {
            throw new Error('Invalid status value');
        }

        return this.repository.update(id, data);
    }

    /**
     * Update ticket status only
     */
    async updateTicketStatus(id: string, status: TicketStatus): Promise<Ticket | null> {
        if (!Object.values(TicketStatus).includes(status)) {
            throw new Error('Invalid status value');
        }

        return this.repository.updateStatus(id, status);
    }

    /**
     * Get tickets by project
     */
    async findByProject(projectId: string): Promise<Ticket[]> {
        return this.repository.findByProject(projectId);
    }

    /**
     * Get tickets by sprint
     */
    async findBySprint(sprintId: string): Promise<Ticket[]> {
        return this.repository.findBySprint(sprintId);
    }

    // ===================== ASSIGNMENT METHODS =====================

    /**
     * Assign ticket to a user
     * - Enforces ONE active owner rule
     * - Updates ticket state: CREATED → ASSIGNED
     * - Emits TICKET_ASSIGNED event for notifications
     */
    async assignTicket(ticketId: string, data: AssignTicketDTO): Promise<TicketAssignment> {
        if (!data.user_id) {
            throw new Error('user_id is required');
        }

        // Check if ticket exists
        const ticket = await this.repository.findById(ticketId);
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        // Check if ticket already has active assignment
        const existingAssignment = await this.repository.getActiveAssignment(ticketId);
        if (existingAssignment && existingAssignment.user_id === data.user_id) {
            throw new Error('Ticket is already assigned to this user');
        }

        // Assign ticket (transactional: deactivate old + create new + update status)
        const assignment = await this.repository.assignTicket(ticketId, data.user_id);

        // Emit TICKET_ASSIGNED event for notifications (Slack + Email)
        this.eventPublisher.emitTicketAssigned({
            ticket_id: ticketId,
            ticket_title: ticket.title,
            user_id: data.user_id,
            project_id: ticket.project_id,
            priority: ticket.priority,
        });

        return assignment;
    }

    /**
     * Unassign ticket (exit flow only)
     * - Deactivates active assignment
     * - Updates ticket status to REASSIGNED
     */
    async unassignTicket(ticketId: string): Promise<boolean> {
        // Check if ticket exists
        const ticket = await this.repository.findById(ticketId);
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        // Check if ticket has active assignment
        const hasActive = await this.repository.hasActiveAssignment(ticketId);
        if (!hasActive) {
            throw new Error('Ticket has no active assignment to unassign');
        }

        return this.repository.unassignTicket(ticketId);
    }

    /**
     * Get active assignment for a ticket
     */
    async getActiveAssignment(ticketId: string): Promise<TicketAssignment | null> {
        return this.repository.getActiveAssignment(ticketId);
    }

    /**
     * Get assignment history for a ticket
     */
    async getAssignmentHistory(ticketId: string): Promise<TicketAssignment[]> {
        return this.repository.getAssignmentHistory(ticketId);
    }
}
