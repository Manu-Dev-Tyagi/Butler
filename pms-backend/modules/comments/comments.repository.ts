import { BaseRepository } from '@database/base.repository';
import { Comment } from './comments.types';

export class CommentsRepository extends BaseRepository<Comment> {
    constructor() {
        super('comments');
    }

    /**
     * Create a new comment
     */
    async createComment(ticketId: string, userId: string, content: string): Promise<Comment> {
        const result = await this.execute(
            `INSERT INTO comments (ticket_id, user_id, content)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [ticketId, userId, content]
        );
        return result.rows[0];
    }

    /**
     * Get all comments for a ticket (with user details)
     */
    async findByTicket(ticketId: string): Promise<Comment[]> {
        const result = await this.execute(
            `SELECT c.*, u.name as user_name, u.email as user_email
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.ticket_id = $1
             ORDER BY c.created_at ASC`,
            [ticketId]
        );
        return result.rows;
    }

    /**
     * Get comment count for a ticket
     */
    async countByTicket(ticketId: string): Promise<number> {
        const result = await this.execute(
            'SELECT COUNT(*) as count FROM comments WHERE ticket_id = $1',
            [ticketId]
        );
        return parseInt(result.rows[0].count);
    }
}
