import { Router, Request, Response } from 'express';
import { CommentsService } from './comments.service';

const router = Router();
const commentsService = new CommentsService();

// ======================== COMMENT ROUTES ========================

// Create Comment on Ticket
router.post('/tickets/:id/comments', async (req: Request, res: Response) => {
    try {
        const ticketId = req.params.id as string;
        const { user_id, content } = req.body;

        if (!user_id) {
            res.status(400).json({ error: 'user_id is required' });
            return;
        }

        if (!content || content.trim() === '') {
            res.status(400).json({ error: 'content is required and cannot be empty' });
            return;
        }

        const comment = await commentsService.createComment({
            ticket_id: ticketId,
            user_id,
            content: content.trim(),
        });

        res.status(201).json(comment);
    } catch (error: any) {
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Get All Comments for Ticket
router.get('/tickets/:id/comments', async (req: Request, res: Response) => {
    try {
        const ticketId = req.params.id as string;
        const comments = await commentsService.getCommentsByTicket(ticketId);

        res.json(comments);
    } catch (error: any) {
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

export default router;
