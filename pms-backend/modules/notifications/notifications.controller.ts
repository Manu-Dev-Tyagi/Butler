import { Request, Response, Router } from 'express';
import { NotificationsRepository } from './notifications.repository';

const router = Router();
const notificationsRepo = new NotificationsRepository();

/**
 * GET /notifications
 * Get all notifications for current user
 */
router.get('/notifications', async (req: Request, res: Response) => {
    try {
        const userId = req.query.user_id as string;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ status: 'error', message: 'user_id query param is required and must be a string' });
        }
        const notifications = await notificationsRepo.findAllByUser(userId);
        res.status(200).json(notifications);
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

/**
 * GET /notifications/unread/count
 */
router.get('/notifications/unread/count', async (req: Request, res: Response) => {
    try {
        const userId = req.query.user_id as string;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ status: 'error', message: 'user_id query param is required and must be a string' });
        }
        const count = await notificationsRepo.getUnreadCount(userId);
        res.status(200).json({ count });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

/**
 * PATCH /notifications/:id/read
 */
router.patch('/notifications/:id/read', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ status: 'error', message: 'Notification ID must be a string' });
        }
        await notificationsRepo.markAsRead(id);
        res.status(200).json({ status: 'success', message: 'Notification marked as read' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

export default router;
