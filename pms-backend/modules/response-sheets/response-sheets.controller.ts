import { Router, Request, Response } from 'express';
import { ResponseSheetsService } from './response-sheets.service';
import { authGuard as authenticateToken } from '@common/guards/auth.guard';
import { CreateResponseSheetDTO, SendResponseSheetDTO } from './response-sheets.types';

const router = Router();
const responseSheetsService = new ResponseSheetsService();

// ==================== GENERATE RESPONSE SHEET ====================
// POST /response-sheets
router.post('/response-sheets', authenticateToken, async (req: Request, res: Response) => {
    try {
        const dto: CreateResponseSheetDTO = req.body;

        if (!dto.project_id) {
            res.status(400).json({
                status: 'error',
                message: 'project_id is required',
            });
            return;
        }

        const sheet = await responseSheetsService.generateSheet(dto.project_id);

        res.status(201).json({
            status: 'success',
            message: 'Response sheet generated successfully',
            data: {
                id: sheet.id,
                project_id: sheet.project_id,
                generated_at: sheet.generated_at,
                snapshot_data: sheet.snapshot_data,
            },
        });
    } catch (error) {
        console.error('[POST /response-sheets] Error:', error);

        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({
                status: 'error',
                message: error.message,
            });
            return;
        }

        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to generate response sheet',
        });
    }
});

// ==================== SEND RESPONSE SHEET ====================
// POST /response-sheets/:id/send
router.post('/response-sheets/:id/send', authenticateToken, async (req: Request, res: Response) => {
    try {
        const sheetId = req.params.id as string;
        const { recipients, subject, message } = req.body;

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            res.status(400).json({
                status: 'error',
                message: 'recipients array is required and must not be empty',
            });
            return;
        }

        const dto: SendResponseSheetDTO = {
            sheet_id: sheetId,
            recipients,
            subject,
            message,
        };

        await responseSheetsService.sendSheet(dto);

        res.status(200).json({
            status: 'success',
            message: `Response sheet sent successfully to ${recipients.length} recipient(s)`,
            data: {
                sheet_id: sheetId,
                sent_to: recipients,
                sent_at: new Date(),
            },
        });
    } catch (error) {
        console.error(`[POST /response-sheets/${req.params.id}/send] Error:`, error);

        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({
                status: 'error',
                message: error.message,
            });
            return;
        }

        if (error instanceof Error && error.message.includes('Invalid email')) {
            res.status(400).json({
                status: 'error',
                message: error.message,
            });
            return;
        }

        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to send response sheet',
        });
    }
});

// ==================== GET RESPONSE SHEETS ====================
// GET /response-sheets/:id
router.get('/response-sheets/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const sheetId = req.params.id as string;
        const sheet = await responseSheetsService.getSheetById(sheetId);

        res.status(200).json({
            status: 'success',
            data: sheet,
        });
    } catch (error) {
        console.error(`[GET /response-sheets/${req.params.id}] Error:`, error);

        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({
                status: 'error',
                message: error.message,
            });
            return;
        }

        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to fetch response sheet',
        });
    }
});

// GET /response-sheets (all sheets or filtered by project_id)
router.get('/response-sheets', authenticateToken, async (req: Request, res: Response) => {
    try {
        const projectId = req.query.project_id as string;

        const sheets = projectId
            ? await responseSheetsService.getSheetsByProjectId(projectId)
            : await responseSheetsService.getAllSheets();

        res.status(200).json({
            status: 'success',
            data: sheets,
        });
    } catch (error) {
        console.error('[GET /response-sheets] Error:', error);

        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to fetch response sheets',
        });
    }
});

export default router;
