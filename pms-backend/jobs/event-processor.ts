import { EventsService } from '@modules/events/events.service';
import { processEvent } from './handlers';

export class EventProcessor {
    private eventsService: EventsService;

    constructor() {
        this.eventsService = new EventsService();
    }

    /**
     * Run a processing cycle
     */
    async processCycle() {
        const pending = await this.eventsService.getPendingEvents(20);

        if (pending.length === 0) return;

        console.log(`[EVENT-PROCESSOR] Found ${pending.length} pending events`);

        for (const event of pending) {
            try {
                // Mark as processing
                await this.eventsService.markAsProcessing(event.id);

                // Handle the event
                await processEvent(event);

                // Mark as done
                await this.eventsService.markAsDone(event.id);
            } catch (error: any) {
                console.error(`[EVENT-PROCESSOR] Failed to process event ${event.id}:`, error.message);

                // Mark as failed or retry
                await this.eventsService.markAsFailed(event.id, error.message, event.retry_count);
            }
        }
    }
}
