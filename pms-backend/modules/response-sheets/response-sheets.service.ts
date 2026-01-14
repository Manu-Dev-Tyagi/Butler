import { ResponseSheetsRepository } from './response-sheets.repository';
import { ResponseSheet, ResponseSheetListItem, SendResponseSheetDTO } from './response-sheets.types';

export class ResponseSheetsService {
    private repository: ResponseSheetsRepository;

    constructor() {
        this.repository = new ResponseSheetsRepository();
    }

    // ==================== GENERATE RESPONSE SHEET ====================

    async generateSheet(projectId: string): Promise<ResponseSheet> {
        if (!projectId) {
            throw new Error('Project ID is required');
        }

        try {
            // Step 1: Generate snapshot (captures current state)
            console.log(`[ResponseSheetsService] Generating snapshot for project ${projectId}...`);
            const snapshot = await this.repository.generateSnapshot(projectId);

            // Step 2: Persist snapshot to database (NEVER recomputed)
            console.log(`[ResponseSheetsService] Persisting snapshot to database...`);
            const sheet = await this.repository.createSheet(projectId, snapshot);

            console.log(`[ResponseSheetsService] Response sheet ${sheet.id} created successfully`);
            return sheet;
        } catch (error) {
            console.error('[ResponseSheetsService] Error generating sheet:', error);
            if (error instanceof Error && error.message.includes('not found')) {
                throw error; // Re-throw 404 errors
            }
            throw new Error('Failed to generate response sheet');
        }
    }

    // ==================== GET RESPONSE SHEETS ====================

    async getSheetById(sheetId: string): Promise<ResponseSheet> {
        if (!sheetId) {
            throw new Error('Sheet ID is required');
        }

        try {
            const sheet = await this.repository.getSheetById(sheetId);

            if (!sheet) {
                throw new Error(`Response sheet with ID ${sheetId} not found`);
            }

            return sheet;
        } catch (error) {
            console.error(`[ResponseSheetsService] Error fetching sheet ${sheetId}:`, error);
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw new Error('Failed to fetch response sheet');
        }
    }

    async getSheetsByProjectId(projectId: string): Promise<ResponseSheetListItem[]> {
        if (!projectId) {
            throw new Error('Project ID is required');
        }

        try {
            return await this.repository.getSheetsByProjectId(projectId);
        } catch (error) {
            console.error(`[ResponseSheetsService] Error fetching sheets for project ${projectId}:`, error);
            throw new Error('Failed to fetch project response sheets');
        }
    }

    async getAllSheets(): Promise<ResponseSheetListItem[]> {
        try {
            return await this.repository.getAllSheets();
        } catch (error) {
            console.error('[ResponseSheetsService] Error fetching all sheets:', error);
            throw new Error('Failed to fetch response sheets');
        }
    }

    // ==================== SEND RESPONSE SHEET ====================

    async sendSheet(dto: SendResponseSheetDTO): Promise<void> {
        // Validate input
        if (!dto.sheet_id) {
            throw new Error('Sheet ID is required');
        }

        if (!dto.recipients || dto.recipients.length === 0) {
            throw new Error('At least one recipient is required');
        }

        // Validate email addresses
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const email of dto.recipients) {
            if (!emailRegex.test(email)) {
                throw new Error(`Invalid email address: ${email}`);
            }
        }

        try {
            // Fetch the sheet
            const sheet = await this.getSheetById(dto.sheet_id);

            // Send email (placeholder - replace with actual email service)
            await this.sendEmail(sheet, dto.recipients, dto.subject, dto.message);

            // Mark as sent in database
            await this.repository.markAsSent(dto.sheet_id, dto.recipients);

            console.log(`[ResponseSheetsService] Sheet ${dto.sheet_id} sent to ${dto.recipients.join(', ')}`);
        } catch (error) {
            console.error(`[ResponseSheetsService] Error sending sheet ${dto.sheet_id}:`, error);
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw new Error('Failed to send response sheet');
        }
    }

    // ==================== EMAIL HELPER (PLACEHOLDER) ====================

    private async sendEmail(
        sheet: ResponseSheet,
        recipients: string[],
        subject?: string,
        message?: string
    ): Promise<void> {
        // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)

        const snapshot = sheet.snapshot_data;
        const defaultSubject = `Project Response Sheet - ${snapshot.project.name}`;
        const defaultMessage = `
            Dear Client,

            Please find attached the response sheet for project "${snapshot.project.name}".

            Summary:
            - Total Tickets: ${snapshot.summary.total_tickets}
            - Completed: ${snapshot.summary.completed_tickets}
            - FTR%: ${snapshot.summary.ftr_percentage}%
            - Avg Resolution Time: ${snapshot.summary.avg_resolution_hours} hours

            Generated on: ${new Date(snapshot.generated_at).toLocaleString()}

            Best regards,
            ${snapshot.project.name} Team
        `;

        console.log('[EMAIL PLACEHOLDER] Sending email:');
        console.log('  To:', recipients);
        console.log('  Subject:', subject || defaultSubject);
        console.log('  Message:', message || defaultMessage);
        console.log('  Sheet Data:', JSON.stringify(snapshot, null, 2));

        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // TODO: Replace with actual email service call
        // Example with SendGrid:
        // await sendgrid.send({
        //     to: recipients,
        //     from: process.env.FROM_EMAIL,
        //     subject: subject || defaultSubject,
        //     html: generateEmailHTML(sheet, message || defaultMessage),
        // });
    }
}
