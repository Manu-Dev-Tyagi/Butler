import { EventsRepository, EventRecord } from './events.repository';

export class EventsService {
    private eventsRepo: EventsRepository;

    constructor() {
        this.eventsRepo = new EventsRepository();
    }

    /**
     * Publish an event to the queue
     */
    async publishEvent(
        eventType: string,
        entityType: string,
        entityId: string,
        payload: any
    ): Promise<EventRecord> {
        console.log(`[EVENTS-SERVICE] Publishing ${eventType} for ${entityType}:${entityId}`);
        return this.eventsRepo.createEvent(eventType, entityType, entityId, payload);
    }

    /**
     * Get pending events for the cron job
     */
    async getPendingEvents(limit: number = 20): Promise<EventRecord[]> {
        return this.eventsRepo.findPending(limit);
    }

    /**
     * Process an event (mark as processing)
     */
    async markAsProcessing(id: string): Promise<EventRecord> {
        return this.eventsRepo.updateStatus(id, 'PROCESSING');
    }

    /**
     * Mark event as completed
     */
    async markAsDone(id: string): Promise<EventRecord> {
        return this.eventsRepo.updateStatus(id, 'DONE', { processed_at: new Date() });
    }

    /**
     * Mark event as failed or retry
     */
    async markAsFailed(id: string, errorMessage: string, retryCount: number): Promise<EventRecord> {
        const status = retryCount >= 3 ? 'FAILED' : 'PENDING';
        return this.eventsRepo.updateStatus(id, status, {
            error_message: errorMessage,
            retry_count: retryCount + 1
        });
    }
}
