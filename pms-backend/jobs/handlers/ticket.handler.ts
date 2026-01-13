import { NotificationsRepository } from '@modules/notifications/notifications.repository';

export async function handleTicketAssigned(event: any) {
    const notificationsRepo = new NotificationsRepository();

    const { ticket_id, ticket_title, user_id, priority } = event.payload;

    console.log(`[HANDLER] Processing TICKET_ASSIGNED for ticket ${ticket_id} to user ${user_id}`);

    // 1. Create In-App Notification
    await notificationsRepo.createNotification({
        user_id,
        title: 'New Ticket Assigned',
        message: `You have been assigned to ticket: "${ticket_title}" (Priority: ${priority})`,
        event_type: 'TICKET_ASSIGNED',
        entity_id: ticket_id
    });

    // 2. Slack Integration Placeholder
    console.log(`[SLACK] (MOCK) Sending message: 🎫 Ticket "${ticket_title}" assigned to <@${user_id}>`);

    // 3. Email Integration Placeholder
    // sendEmail(...)
}
