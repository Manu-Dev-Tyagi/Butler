import { BaseRepository } from '@database/base.repository';

export interface NotificationRecord {
    id: string;
    user_id: string;
    title: string;
    message: string;
    event_type?: string;
    entity_id?: string;
    is_read: boolean;
    created_at: Date;
}

export class NotificationsRepository extends BaseRepository<NotificationRecord> {
    constructor() {
        super('notifications');
    }

    /**
     * Create an in-app notification
     */
    async createNotification(data: {
        user_id: string;
        title: string;
        message: string;
        event_type?: string;
        entity_id?: string;
    }): Promise<NotificationRecord> {
        const result = await this.execute(
            `INSERT INTO notifications (user_id, title, message, event_type, entity_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [data.user_id, data.title, data.message, data.event_type || null, data.entity_id || null]
        );
        return result.rows[0];
    }

    /**
     * Get unread notifications for a user
     */
    async findUnreadByUser(userId: string): Promise<NotificationRecord[]> {
        const result = await this.execute(
            `SELECT * FROM notifications 
             WHERE user_id = $1 AND is_read = FALSE 
             ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    /**
     * Mark notification as read
     */
    async markAsRead(id: string): Promise<void> {
        await this.execute(
            `UPDATE notifications SET is_read = TRUE WHERE id = $1`,
            [id]
        );
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        const result = await this.execute(
            `SELECT COUNT(*) as count FROM notifications 
             WHERE user_id = $1 AND is_read = FALSE`,
            [userId]
        );
        return parseInt(result.rows[0].count);
    }

    /**
     * Get all notifications for a user
     */
    async findAllByUser(userId: string, limit: number = 50): Promise<NotificationRecord[]> {
        const result = await this.execute(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    }
}
