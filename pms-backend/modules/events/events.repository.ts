import { BaseRepository } from '@database/base.repository';

export type EventStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface EventRecord {
    id: string;
    event_type: string;
    entity_type: string;
    entity_id: string;
    payload: any;
    status: EventStatus;
    retry_count: number;
    error_message?: string;
    created_at: Date;
    processed_at?: Date;
}

export class EventsRepository extends BaseRepository<EventRecord> {
    constructor() {
        super('events');
    }

    /**
     * Insert a new event into the queue
     */
    async createEvent(
        eventType: string,
        entityType: string,
        entityId: string,
        payload: any
    ): Promise<EventRecord> {
        const result = await this.execute(
            `INSERT INTO events (event_type, entity_type, entity_id, payload)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [eventType, entityType, entityId, JSON.stringify(payload)]
        );
        return result.rows[0];
    }

    /**
     * Fetch pending events for processing
     */
    async findPending(limit: number = 20): Promise<EventRecord[]> {
        const result = await this.execute(
            `SELECT * FROM events 
             WHERE status = 'PENDING' 
             ORDER BY created_at ASC 
             LIMIT $1`,
            [limit]
        );
        return result.rows;
    }

    /**
     * Update event status and details
     */
    async updateStatus(
        id: string,
        status: EventStatus,
        updates: { error_message?: string; retry_count?: number; processed_at?: Date } = {}
    ): Promise<EventRecord> {
        const { error_message, retry_count, processed_at } = updates;

        const result = await this.execute(
            `UPDATE events 
             SET status = $1, 
                 error_message = COALESCE($2, error_message),
                 retry_count = COALESCE($3, retry_count),
                 processed_at = COALESCE($4, processed_at)
             WHERE id = $5
             RETURNING *`,
            [status, error_message || null, retry_count ?? null, processed_at || null, id]
        );
        return result.rows[0];
    }
}
