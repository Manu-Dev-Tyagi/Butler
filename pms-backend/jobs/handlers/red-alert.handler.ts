import { RedAlertsService } from '@modules/red-alerts/red-alerts.service';
import { SlackService } from '@integrations/slack.service';
import { EmailService } from '@integrations/email.service';
import { pool } from '@database/connection';
import { AlertReason } from '@modules/red-alerts/red-alerts.types';

const redAlertsService = new RedAlertsService();
const slackService = new SlackService();
const emailService = new EmailService();

/**
 * Scan all tickets and trigger alerts where conditions are met
 * This should be called by cron job periodically (e.g., every 30 minutes)
 */
export async function scanAndTriggerRedAlerts() {
    console.log('[RED-ALERT-SCANNER] Starting periodic alert scan...');

    try {
        const result = await redAlertsService.scanAndTriggerAlerts();

        console.log(`[RED-ALERT-SCANNER] Scan complete:`, result);
        console.log(`  - Excessive Iterations: ${result.excessive_iterations}`);
        console.log(`  - SLA Breach: ${result.sla_breach}`);
        console.log(`  - Idle Tickets: ${result.idle_ticket}`);

        // If any new alerts were triggered, send summary notification
        const totalNewAlerts = result.excessive_iterations + result.sla_breach + result.idle_ticket;
        if (totalNewAlerts > 0) {
            await sendAlertSummaryNotification(result);
        }
    } catch (error: any) {
        console.error('[RED-ALERT-SCANNER] Error during alert scan:', error.message);
    }
}

/**
 * Send summary notification to Slack/Email about new alerts
 */
async function sendAlertSummaryNotification(result: {
    excessive_iterations: number;
    sla_breach: number;
    idle_ticket: number;
}) {
    const totalAlerts = result.excessive_iterations + result.sla_breach + result.idle_ticket;

    // Send Slack notification
    await slackService.sendMessage({
        text: '🚨 Red Alerts Triggered',
        username: 'Butler Alert Bot',
        icon_emoji: ':rotating_light:',
        attachments: [
            {
                color: 'danger',
                title: `${totalAlerts} New Red Alert${totalAlerts > 1 ? 's' : ''} Detected`,
                fields: [
                    {
                        title: '🔄 Excessive Iterations',
                        value: `${result.excessive_iterations} ticket${result.excessive_iterations !== 1 ? 's' : ''}`,
                        short: true,
                    },
                    {
                        title: '⏰ SLA Breach',
                        value: `${result.sla_breach} ticket${result.sla_breach !== 1 ? 's' : ''}`,
                        short: true,
                    },
                    {
                        title: '💤 Idle Tickets',
                        value: `${result.idle_ticket} ticket${result.idle_ticket !== 1 ? 's' : ''}`,
                        short: true,
                    },
                ],
                footer: 'Butler PMS Alert System',
                ts: Math.floor(Date.now() / 1000),
            },
        ],
    });

    // Get admin/PM emails to notify
    const adminResult = await pool.query(
        `SELECT DISTINCT email FROM users WHERE role IN ('ADMIN', 'PM') AND employment_status = 'ACTIVE'`
    );

    if (adminResult.rows.length > 0) {
        const adminEmails = adminResult.rows.map((row: any) => row.email);

        await emailService.sendEmail({
            to: adminEmails,
            subject: `🚨 ${totalAlerts} Red Alert${totalAlerts > 1 ? 's' : ''} Triggered`,
            html: generateAlertSummaryEmail(result, totalAlerts),
        });
    }
}

/**
 * Generate HTML email for alert summary
 */
function generateAlertSummaryEmail(
    result: {
        excessive_iterations: number;
        sla_breach: number;
        idle_ticket: number;
    },
    totalAlerts: number
): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #D32F2F; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
        .alert-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #D32F2F; }
        .alert-count { font-size: 24px; font-weight: bold; color: #D32F2F; }
        .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Red Alerts Triggered</h1>
        </div>
        <div class="content">
            <p><strong>${totalAlerts} new red alert${totalAlerts > 1 ? 's have' : ' has'} been detected</strong> in the Butler PMS system:</p>

            ${
                result.excessive_iterations > 0
                    ? `<div class="alert-box">
                <h3>🔄 Excessive Iterations</h3>
                <p class="alert-count">${result.excessive_iterations}</p>
                <p>Ticket${result.excessive_iterations > 1 ? 's have' : ' has'} exceeded the iteration threshold (> 2 iterations).</p>
            </div>`
                    : ''
            }

            ${
                result.sla_breach > 0
                    ? `<div class="alert-box">
                <h3>⏰ SLA Breach</h3>
                <p class="alert-count">${result.sla_breach}</p>
                <p>Ticket${result.sla_breach > 1 ? 's have' : ' has'} missed delivery deadline${result.sla_breach > 1 ? 's' : ''}.</p>
            </div>`
                    : ''
            }

            ${
                result.idle_ticket > 0
                    ? `<div class="alert-box">
                <h3>💤 Idle Tickets</h3>
                <p class="alert-count">${result.idle_ticket}</p>
                <p>Ticket${result.idle_ticket > 1 ? 's have' : ' has'} been idle for more than 48 hours without updates.</p>
            </div>`
                    : ''
            }

            <p style="margin-top: 20px;">Please review these tickets in the Butler PMS dashboard and take appropriate action.</p>
        </div>
        <div class="footer">
            <p>This is an automated alert from Butler PMS</p>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Handle specific red alert event (when individual alert is triggered)
 * This is called when an event is published for a specific alert
 */
export async function handleRedAlertTriggered(event: any) {
    const { ticket_id, reason, alert_id } = event.payload;

    console.log(`[RED-ALERT-HANDLER] Handling alert for ticket ${ticket_id}: ${reason}`);

    try {
        // Fetch ticket and assignment details
        const ticketResult = await pool.query(
            `SELECT
                t.id, t.title, t.priority, t.status,
                t.project_id, p.name as project_name,
                ta.user_id as assigned_to,
                u.name as assignee_name, u.email as assignee_email,
                pm.email as pm_email, pm.name as pm_name
             FROM tickets t
             JOIN projects p ON t.project_id = p.id
             LEFT JOIN (
                 SELECT DISTINCT ON (ticket_id) ticket_id, user_id
                 FROM ticket_assignments
                 WHERE assignment_status = 'ACTIVE'
                 ORDER BY ticket_id, assigned_at DESC
             ) ta ON t.id = ta.ticket_id
             LEFT JOIN users u ON ta.user_id = u.id
             LEFT JOIN users pm ON p.id IN (
                 SELECT project_id FROM project_members WHERE user_id = pm.id AND is_current = TRUE
             ) AND pm.role = 'PM'
             WHERE t.id = $1
             LIMIT 1`,
            [ticket_id]
        );

        if (ticketResult.rows.length === 0) {
            console.warn('[RED-ALERT-HANDLER] Ticket not found');
            return;
        }

        const ticket = ticketResult.rows[0];

        // Send notification based on reason
        const reasonText = getReasonText(reason);

        // Slack notification
        await slackService.sendMessage({
            text: '🚨 Red Alert Triggered',
            username: 'Butler Alert Bot',
            icon_emoji: ':rotating_light:',
            attachments: [
                {
                    color: 'danger',
                    title: ticket.title,
                    fields: [
                        { title: 'Reason', value: reasonText, short: false },
                        { title: 'Priority', value: ticket.priority, short: true },
                        { title: 'Status', value: ticket.status, short: true },
                        { title: 'Project', value: ticket.project_name, short: true },
                        { title: 'Assigned To', value: ticket.assignee_name || 'Unassigned', short: true },
                    ],
                    footer: 'Butler PMS Alert System',
                    ts: Math.floor(Date.now() / 1000),
                },
            ],
        });

        // Email notification to PM and assignee
        const emailRecipients = [];
        if (ticket.pm_email) emailRecipients.push(ticket.pm_email);
        if (ticket.assignee_email) emailRecipients.push(ticket.assignee_email);

        if (emailRecipients.length > 0) {
            await emailService.sendEmail({
                to: emailRecipients,
                subject: `🚨 Red Alert: ${ticket.title}`,
                html: generateAlertEmail(ticket, reasonText),
            });
        }

        console.log(`[RED-ALERT-HANDLER] Alert notifications sent for ticket ${ticket_id}`);
    } catch (error: any) {
        console.error('[RED-ALERT-HANDLER] Error handling red alert:', error.message);
    }
}

function getReasonText(reason: string): string {
    switch (reason) {
        case AlertReason.EXCESSIVE_ITERATIONS:
            return '🔄 Excessive Iterations (> 2)';
        case AlertReason.SLA_BREACH:
            return '⏰ SLA Breach - Delivery deadline crossed';
        case AlertReason.IDLE_TICKET:
            return '💤 Idle Ticket - No updates for > 48 hours';
        default:
            return reason;
    }
}

function generateAlertEmail(ticket: any, reasonText: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #D32F2F; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
        .alert-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #D32F2F; }
        .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Red Alert Triggered</h1>
        </div>
        <div class="content">
            <div class="alert-box">
                <h2>${ticket.title}</h2>
                <p><strong>Reason:</strong> ${reasonText}</p>
                <p><strong>Priority:</strong> ${ticket.priority}</p>
                <p><strong>Status:</strong> ${ticket.status}</p>
                <p><strong>Project:</strong> ${ticket.project_name}</p>
                ${ticket.assignee_name ? `<p><strong>Assigned To:</strong> ${ticket.assignee_name}</p>` : ''}
            </div>
            <p style="margin-top: 20px;">This ticket requires immediate attention. Please review and take appropriate action.</p>
        </div>
        <div class="footer">
            <p>This is an automated alert from Butler PMS</p>
        </div>
    </div>
</body>
</html>
    `;
}
