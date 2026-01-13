import { ticketEventEmitter, TicketAssignedEvent } from '../publishers/ticket.publisher';

/**
 * TICKET_ASSIGNED Event Subscriber
 * Handles async operations triggered by ticket assignment
 */
class TicketSubscriber {
    constructor() {
        this.subscribeToTicketAssigned();
    }

    private subscribeToTicketAssigned(): void {
        ticketEventEmitter.on('TICKET_ASSIGNED', this.handleTicketAssigned.bind(this));
    }

    private async handleTicketAssigned(event: TicketAssignedEvent): Promise<void> {
        console.log('[SUBSCRIBER] Handling TICKET_ASSIGNED:', event.ticket_id);

        try {
            // 1. Send Slack notification (Placeholder - will integrate with Slack API)
            await this.sendSlackNotification(event);

            // 2. Send Email notification (Placeholder - will integrate with Email service)
            await this.sendEmailNotification(event);

            console.log('[SUBSCRIBER] TICKET_ASSIGNED handled successfully:', event.ticket_id);
        } catch (error: any) {
            console.error('[SUBSCRIBER] Error handling TICKET_ASSIGNED:', error.message);
        }
    }

    /**
     * Placeholder for Slack Notification
     * TODO: Integrate with actual Slack API (@integrations/slack/slack.client.ts)
     */
    private async sendSlackNotification(event: TicketAssignedEvent): Promise<void> {
        console.log(`[SLACK] (Simulated) Ticket assigned notification:`);
        console.log(`  - Ticket: ${event.ticket_title}`);
        console.log(`  - Priority: ${event.priority}`);
        console.log(`  - Assigned to User: ${event.user_id}`);

        // In production, this would call:
        // const slackClient = new SlackClient();
        // await slackClient.sendTicketAssignedNotification(event);
    }

    /**
     * Placeholder for Email Notification
     * TODO: Integrate with actual Email service (@integrations/email/email.client.ts)
     */
    private async sendEmailNotification(event: TicketAssignedEvent): Promise<void> {
        console.log(`[EMAIL] (Simulated) Ticket assigned email:`);
        console.log(`  - To User: ${event.user_id}`);
        console.log(`  - Subject: New Ticket Assigned: ${event.ticket_title}`);
        console.log(`  - Priority: ${event.priority}`);

        // In production, this would call:
        // const emailClient = new EmailClient();
        // await emailClient.sendTicketAssignedEmail(event);
    }
}

// Initialize subscriber on module load
export const ticketSubscriber = new TicketSubscriber();
