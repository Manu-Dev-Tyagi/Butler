import { pool } from '@database/connection';
import { NotificationsRepository } from '@modules/notifications/notifications.repository';
import { SlackService } from '@integrations/slack.service';
import { EmailService } from '@integrations/email.service';

const slackService = new SlackService();
const emailService = new EmailService();

export async function handleTicketAssigned(event: any) {
    const notificationsRepo = new NotificationsRepository();

    const { ticket_id, ticket_title, user_id, priority, project_id } = event.payload;

    console.log(`[TICKET-HANDLER] Processing TICKET_ASSIGNED for ticket ${ticket_id} to user ${user_id}`);

    try {
        // Fetch user and project details
        const userResult = await pool.query(
            'SELECT name, email FROM users WHERE id = $1',
            [user_id]
        );

        const projectResult = await pool.query(
            'SELECT p.name as project_name, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = $1',
            [project_id]
        );

        if (userResult.rows.length === 0) {
            console.warn('[TICKET-HANDLER] User not found, skipping notifications');
            return;
        }

        const user = userResult.rows[0];
        const project = projectResult.rows[0] || { project_name: 'Unknown Project', client_name: 'Unknown Client' };

        // 1. Create In-App Notification
        await notificationsRepo.createNotification({
            user_id,
            title: 'New Ticket Assigned',
            message: `You have been assigned to ticket: "${ticket_title}" (Priority: ${priority})`,
            event_type: 'TICKET_ASSIGNED',
            entity_id: ticket_id,
        });

        // 2. Send Slack Notification
        await slackService.notifyTicketAssigned({
            ticketTitle: ticket_title,
            ticketId: ticket_id,
            assigneeName: user.name,
            assigneeEmail: user.email,
            priority: priority,
            projectName: project.project_name,
        });

        // 3. Send Email Notification
        await emailService.sendTicketAssignedEmail({
            to: user.email,
            assigneeName: user.name,
            ticketTitle: ticket_title,
            ticketId: ticket_id,
            priority: priority,
            projectName: project.project_name,
        });

        console.log(`[TICKET-HANDLER] Ticket ${ticket_id} assignment successfully notified`);
    } catch (error: any) {
        console.error('[TICKET-HANDLER] Error in handleTicketAssigned:', error.message);
        throw error;
    }
}
