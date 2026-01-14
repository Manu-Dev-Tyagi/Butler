import { handleTicketAssigned } from './ticket.handler';
import { handleProjectCreated } from './project.handler';
import { handleIterationSubmitted, handleIterationApproved, handleIterationRejected } from './iteration.handler';

export const handlers: Record<string, (event: any) => Promise<void>> = {
    'TICKET_ASSIGNED': handleTicketAssigned,
    'PROJECT_CREATED': handleProjectCreated,
    'ITERATION_SUBMITTED': handleIterationSubmitted,
    'ITERATION_APPROVED': handleIterationApproved,
    'ITERATION_REJECTED': handleIterationRejected,
    // Add more handlers here
};

export async function processEvent(event: any) {
    const handler = handlers[event.event_type];
    if (handler) {
        await handler(event);
    } else {
        console.warn(`[EVENT-PROCESSOR] No handler found for event type: ${event.event_type}`);
    }
}
