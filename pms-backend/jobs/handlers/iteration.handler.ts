import { pool } from '@database/connection';
import { NotificationsRepository } from '@modules/notifications/notifications.repository';
import { IterationEventType, IterationEventPayload } from '@events/publishers/iteration.publisher';
import { SlackService } from '@integrations/slack.service';
import { EmailService } from '@integrations/email.service';

const slackService = new SlackService();
const emailService = new EmailService();

export async function handleIterationSubmitted(event: any) {
    const payload = event.payload as IterationEventPayload;
    const notificationsRepo = new NotificationsRepository();

    console.log(`[ITERATION-HANDLER] Handling ITERATION_SUBMITTED for ticket: ${payload.ticketId}`);

    try {
        // Fetch ticket and user details
        const ticketResult = await pool.query(
            'SELECT t.title, t.project_id, p.name as project_name FROM tickets t JOIN projects p ON t.project_id = p.id WHERE t.id = $1',
            [payload.ticketId]
        );

        const userResult = await pool.query(
            'SELECT name, email FROM users WHERE id = $1',
            [payload.actedByUserId]
        );

        const iterationResult = await pool.query(
            'SELECT iteration_number FROM ticket_iterations WHERE id = $1',
            [payload.iterationId]
        );

        if (ticketResult.rows.length === 0 || userResult.rows.length === 0) {
            console.warn('[ITERATION-HANDLER] Ticket or user not found, skipping notifications');
            return;
        }

        const ticket = ticketResult.rows[0];
        const user = userResult.rows[0];
        const iteration = iterationResult.rows[0];

        // Create in-app notification
        await notificationsRepo.createNotification({
            user_id: payload.actedByUserId,
            title: 'Draft Submitted 📝',
            message: `Your iteration #${iteration.iteration_number} for "${ticket.title}" has been submitted for review.`,
            event_type: IterationEventType.ITERATION_SUBMITTED,
            entity_id: payload.iterationId,
        });

        // Send Slack notification
        await slackService.notifyIterationSubmitted({
            ticketTitle: ticket.title,
            ticketId: payload.ticketId,
            iterationNumber: iteration.iteration_number,
            submittedBy: user.name,
        });

        // Send Email notification
        await emailService.sendIterationSubmittedEmail({
            to: user.email,
            assigneeName: user.name,
            ticketTitle: ticket.title,
            ticketId: payload.ticketId,
            iterationNumber: iteration.iteration_number,
        });

        console.log(`[ITERATION-HANDLER] Iteration ${payload.iterationId} submitted successfully notified`);
    } catch (error: any) {
        console.error('[ITERATION-HANDLER] Error in handleIterationSubmitted:', error.message);
        throw error;
    }
}

export async function handleIterationApproved(event: any) {
    const payload = event.payload as IterationEventPayload;
    const notificationsRepo = new NotificationsRepository();

    console.log(`[ITERATION-HANDLER] Handling ITERATION_APPROVED for ticket: ${payload.ticketId}`);

    try {
        // Fetch ticket, user, approver, and FTR details
        const ticketResult = await pool.query(
            'SELECT t.title, t.project_id FROM tickets t WHERE t.id = $1',
            [payload.ticketId]
        );

        const userResult = await pool.query(
            'SELECT name, email FROM users WHERE id = $1',
            [payload.actedByUserId]
        );

        const approverResult = await pool.query(
            'SELECT name, email FROM users WHERE id = $1',
            [payload.approverUserId]
        );

        const iterationResult = await pool.query(
            'SELECT iteration_number FROM ticket_iterations WHERE id = $1',
            [payload.iterationId]
        );

        const ftrResult = await pool.query(
            'SELECT first_time_right FROM ftr_metrics WHERE ticket_id = $1',
            [payload.ticketId]
        );

        if (ticketResult.rows.length === 0 || userResult.rows.length === 0) {
            console.warn('[ITERATION-HANDLER] Ticket or user not found, skipping notifications');
            return;
        }

        const ticket = ticketResult.rows[0];
        const user = userResult.rows[0];
        const approver = approverResult.rows[0] || { name: 'Project Manager', email: '' };
        const iteration = iterationResult.rows[0];
        const ftr = ftrResult.rows[0]?.first_time_right || false;

        // Create in-app notification
        await notificationsRepo.createNotification({
            user_id: payload.actedByUserId,
            title: 'Ticket Approved! 🎉',
            message: `Your iteration #${iteration.iteration_number} for "${ticket.title}" has been approved by ${approver.name}.`,
            event_type: IterationEventType.ITERATION_APPROVED,
            entity_id: payload.iterationId,
        });

        // Send Slack notification
        await slackService.notifyIterationApproved({
            ticketTitle: ticket.title,
            ticketId: payload.ticketId,
            iterationNumber: iteration.iteration_number,
            approvedBy: approver.name,
            ftr,
        });

        // Send Email notification
        await emailService.sendIterationApprovedEmail({
            to: user.email,
            assigneeName: user.name,
            ticketTitle: ticket.title,
            ticketId: payload.ticketId,
            iterationNumber: iteration.iteration_number,
            approverName: approver.name,
            ftr,
        });

        console.log(`[ITERATION-HANDLER] Iteration ${payload.iterationId} approval successfully notified`);
    } catch (error: any) {
        console.error('[ITERATION-HANDLER] Error in handleIterationApproved:', error.message);
        throw error;
    }
}

export async function handleIterationRejected(event: any) {
    const payload = event.payload as IterationEventPayload;
    const notificationsRepo = new NotificationsRepository();

    console.log(`[ITERATION-HANDLER] Handling ITERATION_REJECTED for ticket: ${payload.ticketId}`);

    try {
        // Fetch ticket, user, and approver details
        const ticketResult = await pool.query(
            'SELECT t.title, t.project_id FROM tickets t WHERE t.id = $1',
            [payload.ticketId]
        );

        const userResult = await pool.query(
            'SELECT name, email FROM users WHERE id = $1',
            [payload.actedByUserId]
        );

        const approverResult = await pool.query(
            'SELECT name, email FROM users WHERE id = $1',
            [payload.approverUserId]
        );

        const iterationResult = await pool.query(
            'SELECT iteration_number FROM ticket_iterations WHERE id = $1',
            [payload.iterationId]
        );

        if (ticketResult.rows.length === 0 || userResult.rows.length === 0) {
            console.warn('[ITERATION-HANDLER] Ticket or user not found, skipping notifications');
            return;
        }

        const ticket = ticketResult.rows[0];
        const user = userResult.rows[0];
        const approver = approverResult.rows[0] || { name: 'Project Manager', email: '' };
        const iteration = iterationResult.rows[0];

        // Create in-app notification
        await notificationsRepo.createNotification({
            user_id: payload.actedByUserId,
            title: 'Revision Required ✍️',
            message: `Revision required for iteration #${iteration.iteration_number} of "${ticket.title}". Reason: ${payload.remarks || 'No reason provided'}`,
            event_type: IterationEventType.ITERATION_REJECTED,
            entity_id: payload.iterationId,
        });

        // Send Slack notification
        await slackService.notifyIterationRejected({
            ticketTitle: ticket.title,
            ticketId: payload.ticketId,
            iterationNumber: iteration.iteration_number,
            rejectedBy: approver.name,
            reason: payload.remarks,
        });

        // Send Email notification
        await emailService.sendIterationRejectedEmail({
            to: user.email,
            assigneeName: user.name,
            ticketTitle: ticket.title,
            ticketId: payload.ticketId,
            iterationNumber: iteration.iteration_number,
            approverName: approver.name,
            reason: payload.remarks,
        });

        console.log(`[ITERATION-HANDLER] Iteration ${payload.iterationId} rejection successfully notified`);
    } catch (error: any) {
        console.error('[ITERATION-HANDLER] Error in handleIterationRejected:', error.message);
        throw error;
    }
}
