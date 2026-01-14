import nodemailer, { Transporter } from 'nodemailer';

/**
 * Email Integration Service
 * Uses Nodemailer for sending emails
 *
 * Supports multiple providers:
 * - SMTP (Generic)
 * - Gmail
 * - SendGrid
 * - AWS SES
 * - Mailgun
 *
 * Setup:
 * 1. Configure EMAIL_* variables in .env
 * 2. For Gmail: Enable "Less secure app access" or use App Password
 * 3. For SendGrid: Use API key as password
 */

export interface EmailPayload {
    to: string | string[];
    subject: string;
    html: string;
    text?: string; // Plain text fallback
    cc?: string | string[];
    bcc?: string | string[];
}

export class EmailService {
    private transporter: Transporter | null = null;
    private enabled: boolean;
    private fromEmail: string;
    private fromName: string;

    constructor() {
        this.fromEmail = process.env.EMAIL_FROM || 'noreply@butler.com';
        this.fromName = process.env.EMAIL_FROM_NAME || 'Butler PMS';
        this.enabled = process.env.EMAIL_ENABLED === 'true';

        if (this.enabled) {
            this.initializeTransporter();
        } else {
            console.warn('[EMAIL] Email integration is disabled. Set EMAIL_ENABLED=true to enable.');
        }
    }

    /**
     * Initialize email transporter based on configuration
     */
    private initializeTransporter(): void {
        const provider = process.env.EMAIL_PROVIDER || 'smtp'; // smtp, gmail, sendgrid

        try {
            switch (provider.toLowerCase()) {
                case 'gmail':
                    this.transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASSWORD, // Use App Password
                        },
                    });
                    break;

                case 'sendgrid':
                    this.transporter = nodemailer.createTransport({
                        host: 'smtp.sendgrid.net',
                        port: 587,
                        secure: false,
                        auth: {
                            user: 'apikey',
                            pass: process.env.SENDGRID_API_KEY,
                        },
                    });
                    break;

                case 'smtp':
                default:
                    this.transporter = nodemailer.createTransport({
                        host: process.env.SMTP_HOST || 'localhost',
                        port: parseInt(process.env.SMTP_PORT || '587'),
                        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
                        auth: process.env.SMTP_USER
                            ? {
                                  user: process.env.SMTP_USER,
                                  pass: process.env.SMTP_PASSWORD,
                              }
                            : undefined,
                    });
                    break;
            }

            console.log(`[EMAIL] Initialized with provider: ${provider}`);
        } catch (error: any) {
            console.error('[EMAIL] Failed to initialize transporter:', error.message);
            this.enabled = false;
        }
    }

    /**
     * Send an email
     */
    async sendEmail(payload: EmailPayload): Promise<void> {
        if (!this.enabled || !this.transporter) {
            console.log('[EMAIL] Skipped (disabled):', payload.subject, 'to', payload.to);
            return;
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
                subject: payload.subject,
                html: payload.html,
                text: payload.text || this.stripHtml(payload.html),
                cc: payload.cc,
                bcc: payload.bcc,
            });

            console.log('[EMAIL] Message sent successfully:', info.messageId);
        } catch (error: any) {
            console.error('[EMAIL] Failed to send email:', error.message);
            // Don't throw - we don't want email failures to break business logic
        }
    }

    /**
     * Send ticket assignment notification email
     */
    async sendTicketAssignedEmail(data: {
        to: string;
        assigneeName: string;
        ticketTitle: string;
        ticketId: string;
        priority: string;
        projectName?: string;
    }): Promise<void> {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
        .ticket-info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
        .priority-${data.priority.toLowerCase()} { color: ${this.getPriorityEmailColor(data.priority)}; font-weight: bold; }
        .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        .button { background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 New Ticket Assigned</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${data.assigneeName}</strong>,</p>
            <p>You have been assigned a new ticket:</p>

            <div class="ticket-info">
                <h2>${data.ticketTitle}</h2>
                <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
                <p><strong>Priority:</strong> <span class="priority-${data.priority.toLowerCase()}">${data.priority}</span></p>
                ${data.projectName ? `<p><strong>Project:</strong> ${data.projectName}</p>` : ''}
            </div>

            <p>Please review the ticket details and start working on it at your earliest convenience.</p>
        </div>
        <div class="footer">
            <p>This is an automated notification from Butler PMS</p>
        </div>
    </div>
</body>
</html>
        `;

        await this.sendEmail({
            to: data.to,
            subject: `New Ticket Assigned: ${data.ticketTitle}`,
            html,
        });
    }

    /**
     * Send iteration submitted notification email
     */
    async sendIterationSubmittedEmail(data: {
        to: string;
        assigneeName: string;
        ticketTitle: string;
        ticketId: string;
        iterationNumber: number;
    }): Promise<void> {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
        .iteration-info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
        .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 Iteration Submitted</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${data.assigneeName}</strong>,</p>
            <p>Your iteration has been successfully submitted for review:</p>

            <div class="iteration-info">
                <h2>${data.ticketTitle}</h2>
                <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
                <p><strong>Iteration:</strong> #${data.iterationNumber}</p>
            </div>

            <p>Your Project Manager will review the submission shortly. You'll be notified once a decision is made.</p>
        </div>
        <div class="footer">
            <p>This is an automated notification from Butler PMS</p>
        </div>
    </div>
</body>
</html>
        `;

        await this.sendEmail({
            to: data.to,
            subject: `Iteration #${data.iterationNumber} Submitted: ${data.ticketTitle}`,
            html,
        });
    }

    /**
     * Send iteration approved notification email
     */
    async sendIterationApprovedEmail(data: {
        to: string;
        assigneeName: string;
        ticketTitle: string;
        ticketId: string;
        iterationNumber: number;
        approverName: string;
        ftr: boolean;
    }): Promise<void> {
        const ftrBadge = data.ftr
            ? '<div style="background: #4CAF50; color: white; padding: 10px; border-radius: 5px; text-align: center; margin: 10px 0;">✅ First Time Right! Excellent work!</div>'
            : '<div style="background: #FFC107; color: #333; padding: 10px; border-radius: 5px; text-align: center; margin: 10px 0;">⚠️ Approved after revisions</div>';

        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
        .iteration-info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
        .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Iteration Approved!</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${data.assigneeName}</strong>,</p>
            <p>Great news! Your iteration has been approved:</p>

            <div class="iteration-info">
                <h2>${data.ticketTitle}</h2>
                <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
                <p><strong>Iteration:</strong> #${data.iterationNumber}</p>
                <p><strong>Approved By:</strong> ${data.approverName}</p>
            </div>

            ${ftrBadge}

            <p>The ticket is now ready for delivery. Keep up the excellent work!</p>
        </div>
        <div class="footer">
            <p>This is an automated notification from Butler PMS</p>
        </div>
    </div>
</body>
</html>
        `;

        await this.sendEmail({
            to: data.to,
            subject: `✅ Iteration Approved: ${data.ticketTitle}`,
            html,
        });
    }

    /**
     * Send iteration rejected notification email
     */
    async sendIterationRejectedEmail(data: {
        to: string;
        assigneeName: string;
        ticketTitle: string;
        ticketId: string;
        iterationNumber: number;
        approverName: string;
        reason?: string;
    }): Promise<void> {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
        .iteration-info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FF9800; }
        .reason-box { background: #FFF3E0; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✍️ Revision Required</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${data.assigneeName}</strong>,</p>
            <p>Your iteration requires revision:</p>

            <div class="iteration-info">
                <h2>${data.ticketTitle}</h2>
                <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
                <p><strong>Iteration:</strong> #${data.iterationNumber}</p>
                <p><strong>Reviewed By:</strong> ${data.approverName}</p>
            </div>

            ${
                data.reason
                    ? `<div class="reason-box">
                <p><strong>Reason for Revision:</strong></p>
                <p>${data.reason}</p>
            </div>`
                    : ''
            }

            <p>A new iteration (#${data.iterationNumber + 1}) has been created. Please address the feedback and resubmit.</p>
        </div>
        <div class="footer">
            <p>This is an automated notification from Butler PMS</p>
        </div>
    </div>
</body>
</html>
        `;

        await this.sendEmail({
            to: data.to,
            subject: `✍️ Revision Required: ${data.ticketTitle}`,
            html,
        });
    }

    /**
     * Send project created notification email
     */
    async sendProjectCreatedEmail(data: {
        to: string[];
        projectName: string;
        projectId: string;
        clientName: string;
    }): Promise<void> {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
        .project-info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
        .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 New Project Created</h1>
        </div>
        <div class="content">
            <p>Hello Team,</p>
            <p>You have been assigned to a new project:</p>

            <div class="project-info">
                <h2>${data.projectName}</h2>
                <p><strong>Project ID:</strong> ${data.projectId}</p>
                <p><strong>Client:</strong> ${data.clientName}</p>
            </div>

            <p>Check your Butler PMS dashboard for more details and upcoming tickets.</p>
        </div>
        <div class="footer">
            <p>This is an automated notification from Butler PMS</p>
        </div>
    </div>
</body>
</html>
        `;

        await this.sendEmail({
            to: data.to,
            subject: `New Project: ${data.projectName}`,
            html,
        });
    }

    // ==================== HELPER METHODS ====================

    private stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    private getPriorityEmailColor(priority: string): string {
        const colorMap: Record<string, string> = {
            'URGENT': '#F44336',
            'HIGH': '#FF9800',
            'MEDIUM': '#FFC107',
            'LOW': '#4CAF50',
        };
        return colorMap[priority.toUpperCase()] || '#9E9E9E';
    }

    /**
     * Verify email configuration (for testing)
     */
    async verifyConnection(): Promise<boolean> {
        if (!this.enabled || !this.transporter) {
            return false;
        }

        try {
            await this.transporter.verify();
            console.log('[EMAIL] Connection verified successfully');
            return true;
        } catch (error: any) {
            console.error('[EMAIL] Connection verification failed:', error.message);
            return false;
        }
    }
}
