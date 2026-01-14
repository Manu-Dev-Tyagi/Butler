import { Router, Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { authGuard as authenticateToken } from '@common/guards/auth.guard';

const router = Router();
const analyticsService = new AnalyticsService();

// ==================== OVERVIEW ANALYTICS ====================
// GET /analytics/overview
router.get('/analytics/overview', authenticateToken, async (req: Request, res: Response) => {
    try {
        const analytics = await analyticsService.getOverviewAnalytics();
        res.status(200).json({
            status: 'success',
            data: analytics,
        });
    } catch (error) {
        console.error('[GET /analytics/overview] Error:', error);
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to fetch overview analytics',
        });
    }
});

// ==================== SPRINT ANALYTICS ====================
// GET /analytics/sprints/:sprintId
router.get('/analytics/sprints/:sprintId', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { sprintId } = req.params as { sprintId: string };
        const analytics = await analyticsService.getSprintAnalytics(sprintId);
        res.status(200).json({
            status: 'success',
            data: analytics,
        });
    } catch (error) {
        console.error(`[GET /analytics/sprints/${req.params.sprintId}] Error:`, error);

        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({
                status: 'error',
                message: error.message,
            });
            return;
        }

        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to fetch sprint analytics',
        });
    }
});

// ==================== USER ANALYTICS ====================
// GET /analytics/users (All users analytics with leaderboard)
router.get('/analytics/users', authenticateToken, async (req: Request, res: Response) => {
    try {
        const analytics = await analyticsService.getUsersAnalytics();
        res.status(200).json({
            status: 'success',
            data: analytics,
        });
    } catch (error) {
        console.error('[GET /analytics/users] Error:', error);
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to fetch users analytics',
        });
    }
});

// GET /analytics/users/:userId (Individual user performance)
router.get('/analytics/users/:userId', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { userId } = req.params as { userId: string };
        const performance = await analyticsService.getUserPerformance(userId);
        res.status(200).json({
            status: 'success',
            data: performance,
        });
    } catch (error) {
        console.error(`[GET /analytics/users/${req.params.userId}] Error:`, error);

        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({
                status: 'error',
                message: error.message,
            });
            return;
        }

        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to fetch user performance',
        });
    }
});

export default router;
