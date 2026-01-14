import axios from 'axios';

/**
 * Slack Integration Service
 * Uses Slack Incoming Webhooks for sending notifications
 *
 * Setup:
 * 1. Create a Slack App: https://api.slack.com/apps
 * 2. Enable Incoming Webhooks
 * 3. Add webhook to workspace and get the webhook URL
 * 4. Set SLACK_WEBHOOK_URL in .env
 */

export interface SlackMessagePayload {
    text: string;
    channel?: string; // Optional: Override default channel
    username?: string; // Optional: Bot display name
    icon_emoji?: string; // Optional: Bot icon
    attachments?: SlackAttachment[];
}

export interface SlackAttachment {
    color?: 'good' | 'warning' | 'danger' | string; // Hex color or preset
    title?: string;
    text?: string;
    fields?: SlackField[];
    footer?: string;
    ts?: number; // Timestamp
}

export interface SlackField {
    title: string;
    value: string;
    short?: boolean; // Display side-by-side
}

export class SlackService {
    private webhookUrl: string;
    private enabled: boolean;

    constructor() {
        this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
        this.enabled = !!this.webhookUrl && process.env.SLACK_ENABLED !== 'false';

        if (!this.enabled) {
            console.warn('[SLACK] Slack integration is disabled. Set SLACK_WEBHOOK_URL and SLACK_ENABLED=true to enable.');
        }
    }

    /**
     * Send a message to Slack
     */
    async sendMessage(payload: SlackMessagePayload): Promise<void> {
        if (!this.enabled) {
            console.log('[SLACK] Skipped (disabled):', payload.text);
            return;
        }

        try {
            await axios.post(this.webhookUrl, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000, // 5 second timeout
            });
            console.log('[SLACK] Message sent successfully:', payload.text);
        } catch (error: any) {
            console.error('[SLACK] Failed to send message:', error.response?.data || error.message);
            // Don't throw - we don't want Slack failures to break business logic
        }
    }

    /**
     * Send a simple text notification
     */
    async sendNotification(message: string, channel?: string): Promise<void> {
        await this.sendMessage({
            text: message,
            channel,
            username: 'Butler Bot',
            icon_emoji: ':robot_face:',
        });
    }

    /**
     * Send a ticket assignment notification
     */
    async notifyTicketAssigned(data: {
        ticketTitle: string;
        ticketId: string;
        assigneeName: string;
        assigneeEmail: string;
        priority: string;
        projectName?: string;
    }): Promise<void> {
        const priorityEmoji = this.getPriorityEmoji(data.priority);
        const priorityColor = this.getPriorityColor(data.priority);

        await this.sendMessage({
            text: `${priorityEmoji} New Ticket Assigned`,
            username: 'Butler Bot',
            icon_emoji: ':clipboard:',
            attachments: [
                {
                    color: priorityColor,
                    title: data.ticketTitle,
                    fields: [
                        { title: 'Assigned To', value: `${data.assigneeName} (${data.assigneeEmail})`, short: true },
                        { title: 'Priority', value: data.priority, short: true },
                        { title: 'Project', value: data.projectName || 'N/A', short: true },
                        { title: 'Ticket ID', value: data.ticketId, short: true },
                    ],
                    footer: 'Butler PMS',
                    ts: Math.floor(Date.now() / 1000),
                },
            ],
        });
    }

    /**
     * Send iteration submitted notification
     */
    async notifyIterationSubmitted(data: {
        ticketTitle: string;
        ticketId: string;
        iterationNumber: number;
        submittedBy: string;
    }): Promise<void> {
        await this.sendMessage({
            text: '📝 Iteration Submitted for Review',
            username: 'Butler Bot',
            icon_emoji: ':memo:',
            attachments: [
                {
                    color: '#2196F3', // Blue
                    title: data.ticketTitle,
                    fields: [
                        { title: 'Iteration', value: `#${data.iterationNumber}`, short: true },
                        { title: 'Submitted By', value: data.submittedBy, short: true },
                        { title: 'Ticket ID', value: data.ticketId, short: false },
                    ],
                    footer: 'Awaiting PM approval',
                    ts: Math.floor(Date.now() / 1000),
                },
            ],
        });
    }

    /**
     * Send iteration approved notification
     */
    async notifyIterationApproved(data: {
        ticketTitle: string;
        ticketId: string;
        iterationNumber: number;
        approvedBy: string;
        ftr: boolean;
    }): Promise<void> {
        const ftrText = data.ftr ? '✅ First Time Right!' : '⚠️ Multiple iterations required';

        await this.sendMessage({
            text: '🎉 Iteration Approved!',
            username: 'Butler Bot',
            icon_emoji: ':white_check_mark:',
            attachments: [
                {
                    color: 'good', // Green
                    title: data.ticketTitle,
                    fields: [
                        { title: 'Iteration', value: `#${data.iterationNumber}`, short: true },
                        { title: 'Approved By', value: data.approvedBy, short: true },
                        { title: 'FTR Status', value: ftrText, short: false },
                        { title: 'Ticket ID', value: data.ticketId, short: false },
                    ],
                    footer: 'Butler PMS',
                    ts: Math.floor(Date.now() / 1000),
                },
            ],
        });
    }

    /**
     * Send iteration rejected notification
     */
    async notifyIterationRejected(data: {
        ticketTitle: string;
        ticketId: string;
        iterationNumber: number;
        rejectedBy: string;
        reason?: string;
    }): Promise<void> {
        await this.sendMessage({
            text: '✍️ Revision Required',
            username: 'Butler Bot',
            icon_emoji: ':warning:',
            attachments: [
                {
                    color: 'warning', // Orange
                    title: data.ticketTitle,
                    fields: [
                        { title: 'Iteration', value: `#${data.iterationNumber}`, short: true },
                        { title: 'Rejected By', value: data.rejectedBy, short: true },
                        { title: 'Reason', value: data.reason || 'No reason provided', short: false },
                        { title: 'Ticket ID', value: data.ticketId, short: false },
                    ],
                    footer: 'New iteration created',
                    ts: Math.floor(Date.now() / 1000),
                },
            ],
        });
    }

    /**
     * Send project created notification
     */
    async notifyProjectCreated(data: {
        projectName: string;
        projectId: string;
        clientName: string;
        memberCount: number;
    }): Promise<void> {
        await this.sendMessage({
            text: '🚀 New Project Created',
            username: 'Butler Bot',
            icon_emoji: ':rocket:',
            attachments: [
                {
                    color: '#4CAF50', // Green
                    title: data.projectName,
                    fields: [
                        { title: 'Client', value: data.clientName, short: true },
                        { title: 'Team Members', value: `${data.memberCount}`, short: true },
                        { title: 'Project ID', value: data.projectId, short: false },
                    ],
                    footer: 'Butler PMS',
                    ts: Math.floor(Date.now() / 1000),
                },
            ],
        });
    }

    // ==================== HELPER METHODS ====================

    private getPriorityEmoji(priority: string): string {
        const emojiMap: Record<string, string> = {
            'URGENT': '🔴',
            'HIGH': '🟠',
            'MEDIUM': '🟡',
            'LOW': '🟢',
        };
        return emojiMap[priority.toUpperCase()] || '⚪';
    }

    private getPriorityColor(priority: string): string {
        const colorMap: Record<string, string> = {
            'URGENT': 'danger', // Red
            'HIGH': '#FF9800', // Orange
            'MEDIUM': '#FFC107', // Amber
            'LOW': 'good', // Green
        };
        return colorMap[priority.toUpperCase()] || '#9E9E9E'; // Grey
    }
}
