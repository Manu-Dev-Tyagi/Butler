import { EventEmitter } from 'events';
import { TicketPriority } from '@modules/tickets/tickets.types';

export interface TicketAssignedEvent {
    ticket_id: string;
    ticket_title: string;
    user_id: string;
    project_id: string;
    priority: TicketPriority;
}

// Global Event Emitter Instance for Ticket Events
export const ticketEventEmitter = new EventEmitter();

export class TicketEventPublisher {
    /**
     * Emit TICKET_ASSIGNED event
     * Triggers async operations like Slack + Email notifications
     */
    emitTicketAssigned(event: TicketAssignedEvent): void {
        console.log('[EVENT] TICKET_ASSIGNED emitted:', event.ticket_id);
        ticketEventEmitter.emit('TICKET_ASSIGNED', event);
    }
}
