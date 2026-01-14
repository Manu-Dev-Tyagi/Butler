import { EventsService } from '@modules/events/events.service';

export enum IterationEventType {
    ITERATION_SUBMITTED = 'ITERATION_SUBMITTED',
    ITERATION_APPROVED = 'ITERATION_APPROVED',
    ITERATION_REJECTED = 'ITERATION_REJECTED',
}

export interface IterationEventPayload {
    iterationId: string;
    ticketId: string;
    actedByUserId: string;
    approverUserId?: string;
    status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
    remarks?: string;
    occurredAt: Date;
}

export class IterationEventPublisher {
    private eventsService: EventsService;

    constructor() {
        this.eventsService = new EventsService();
    }

    /**
     * Emit Iteration Domain Event
     */
    async emitIterationEvent(type: IterationEventType, event: IterationEventPayload): Promise<void> {
        try {
            await this.eventsService.publishEvent(
                type,
                'ticket_iteration',
                event.iterationId,
                event
            );
        } catch (err) {
            console.error(`[ITERATION-PUBLISHER] Failed to emit ${type} event:`, err);
            // Log and swallow as per requirements
        }
    }
}
