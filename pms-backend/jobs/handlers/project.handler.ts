import { pool } from '@database/connection';
import { SlackService } from '@integrations/slack.service';
import { EmailService } from '@integrations/email.service';

const slackService = new SlackService();
const emailService = new EmailService();

export async function handleProjectCreated(event: any) {
    const { project_id, project_name, client_id, pocs } = event.payload;

    console.log(`[PROJECT-HANDLER] Processing PROJECT_CREATED for project ${project_name} (${project_id})`);

    try {
        // Fetch client and member details
        const clientResult = await pool.query(
            'SELECT name FROM clients WHERE id = $1',
            [client_id]
        );

        const membersResult = await pool.query(
            `SELECT u.name, u.email
             FROM project_members pm
             JOIN users u ON pm.user_id = u.id
             WHERE pm.project_id = $1 AND pm.is_current = TRUE`,
            [project_id]
        );

        const client = clientResult.rows[0] || { name: 'Unknown Client' };
        const members = membersResult.rows || [];

        // 1. Send Slack Notification
        await slackService.notifyProjectCreated({
            projectName: project_name,
            projectId: project_id,
            clientName: client.name,
            memberCount: members.length,
        });

        // 2. Send Email Notifications to All Team Members
        if (members.length > 0) {
            const memberEmails = members.map((m: any) => m.email);
            await emailService.sendProjectCreatedEmail({
                to: memberEmails,
                projectName: project_name,
                projectId: project_id,
                clientName: client.name,
            });
        }

        // 3. Slack Channel Creation (Placeholder - requires Slack Bot Token)
        // Note: Creating actual Slack channels requires Slack Bot Token and conversations.create API
        // This is a placeholder for future implementation
        console.log(`[PROJECT-HANDLER] Slack channel creation for #project-${project_name.toLowerCase().replace(/\s+/g, '-')} (requires Slack Bot Token)`);

        console.log(`[PROJECT-HANDLER] Project ${project_id} creation successfully notified to ${members.length} members`);
    } catch (error: any) {
        console.error('[PROJECT-HANDLER] Error in handleProjectCreated:', error.message);
        throw error;
    }
}
