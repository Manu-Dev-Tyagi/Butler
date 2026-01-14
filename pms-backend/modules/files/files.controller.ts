import { Router, Request, Response } from 'express';
import { FilesService } from './files.service';

const router = Router();
const filesService = new FilesService();

// ======================== FILE ROUTES ========================

// Upload File (POST /files/upload)
// NOTE: This stores file METADATA only. Actual blob storage is abstracted (per to-do.md).
router.post('/files/upload', async (req: Request, res: Response) => {
    try {
        const { ticket_id, iteration_id, file_url, file_type, uploaded_by } = req.body;

        // Validation
        if (!ticket_id) {
            res.status(400).json({ error: 'ticket_id is required' });
            return;
        }

        if (!iteration_id) {
            res.status(400).json({ error: 'iteration_id is required - files must be linked to an iteration' });
            return;
        }

        if (!file_url || file_url.trim() === '') {
            res.status(400).json({ error: 'file_url is required and cannot be empty' });
            return;
        }

        if (!uploaded_by) {
            res.status(400).json({ error: 'uploaded_by (user_id) is required' });
            return;
        }

        const file = await filesService.uploadFile({
            ticket_id,
            iteration_id,
            file_url: file_url.trim(),
            file_type,
            uploaded_by,
        });

        // TODO: Emit Slack update event (per to-do.md: "Upload emits Slack update")
        // This would follow the same event pattern as PROJECT_CREATED and TICKET_ASSIGNED

        res.status(201).json(file);
    } catch (error: any) {
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes('iteration_id is required')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Get All Files for Ticket (GET /tickets/:id/files)
router.get('/tickets/:id/files', async (req: Request, res: Response) => {
    try {
        const ticketId = req.params.id as string;
        const files = await filesService.getFilesByTicket(ticketId);

        res.json(files);
    } catch (error: any) {
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Delete File (DELETE /files/:id)
router.delete('/files/:id', async (req: Request, res: Response) => {
    try {
        const fileId = req.params.id as string;
        const success = await filesService.deleteFile(fileId);

        if (success) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error: any) {
        if (error.message === 'File not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

export default router;
