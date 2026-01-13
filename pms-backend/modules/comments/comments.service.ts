import { CommentsRepository } from './comments.repository';
import { TicketsRepository } from '@modules/tickets/tickets.repository';
import { Comment, CreateCommentDTO } from './comments.types';

export class CommentsService {
    private readonly commentsRepo: CommentsRepository;
    private readonly ticketsRepo: TicketsRepository;

    constructor() {
        this.commentsRepo = new CommentsRepository();
        this.ticketsRepo = new TicketsRepository();
    }

    /**
     * Create a comment on a ticket
     */
    async createComment(data: CreateCommentDTO): Promise<Comment> {
        // Verify ticket exists
        const ticket = await this.ticketsRepo.findById(data.ticket_id);
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        return this.commentsRepo.createComment(data.ticket_id, data.user_id, data.content);
    }

    /**
     * Get all comments for a ticket
     */
    async getCommentsByTicket(ticketId: string): Promise<Comment[]> {
        // Verify ticket exists
        const ticket = await this.ticketsRepo.findById(ticketId);
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        return this.commentsRepo.findByTicket(ticketId);
    }

    /**
     * Get comment count for a ticket
     */
    async getCommentCount(ticketId: string): Promise<number> {
        return this.commentsRepo.countByTicket(ticketId);
    }
}
