import { TicketPriority } from '@modules/tickets/tickets.types';
import { EventsService } from '@modules/events/events.service';

export interface TicketAssignedEvent {
    ticket_id: string;
    ticket_title: string;
    user_id: string;
    project_id: string;
    priority: TicketPriority;
}

export class TicketEventPublisher {
    private eventsService: EventsService;

    constructor() {
        this.eventsService = new EventsService();
    }

    /**
     * Emit TICKET_ASSIGNED event
     * Inserts into DB queue for async cron processing
     */
    async emitTicketAssigned(event: TicketAssignedEvent): Promise<void> {
        await this.eventsService.publishEvent(
            'TICKET_ASSIGNED',
            'ticket',
            event.ticket_id,
            event
        );
    }
}
