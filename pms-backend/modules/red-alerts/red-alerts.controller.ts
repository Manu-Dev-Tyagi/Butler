import { Router, Request, Response } from 'express';
import { RedAlertsService } from './red-alerts.service';
import { AlertReason, AlertFilters } from './red-alerts.types';

const router = Router();
const redAlertsService = new RedAlertsService();

// ======================== RED ALERTS ROUTES ========================

/**
 * GET /alerts
 * Get all alerts with filtering options
 * Query params:
 *   - reason: AlertReason (optional)
 *   - project_id: UUID (optional)
 *   - ticket_id: UUID (optional)
 *   - from_date: ISO date string (optional)
 *   - to_date: ISO date string (optional)
 */
router.get('/alerts', async (req: Request, res: Response) => {
    try {
        const filters: AlertFilters = {};

        if (req.query.reason) {
            filters.reason = req.query.reason as AlertReason;
        }
        if (req.query.project_id) {
            filters.project_id = req.query.project_id as string;
        }
        if (req.query.ticket_id) {
            filters.ticket_id = req.query.ticket_id as string;
        }
        if (req.query.from_date) {
            filters.from_date = new Date(req.query.from_date as string);
        }
        if (req.query.to_date) {
            filters.to_date = new Date(req.query.to_date as string);
        }

        const alerts = await redAlertsService.getAllAlerts(filters);

        res.json(alerts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /alerts/statistics
 * Get alert statistics for dashboards
 */
router.get('/alerts/statistics', async (req: Request, res: Response) => {
    try {
        const statistics = await redAlertsService.getStatistics();

        res.json(statistics);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /alerts/recent
 * Get recent alerts (last 24 hours by default)
 * Query params:
 *   - hours: number (optional, default 24)
 */
router.get('/alerts/recent', async (req: Request, res: Response) => {
    try {
        const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
        const alerts = await redAlertsService.getRecentAlerts(hours);

        res.json(alerts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /alerts/count
 * Get active alerts count (for dashboard badges)
 */
router.get('/alerts/count', async (req: Request, res: Response) => {
    try {
        const count = await redAlertsService.getActiveAlertsCount();

        res.json({ count });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /tickets/:id/alerts
 * Get all alerts for a specific ticket
 */
router.get('/tickets/:id/alerts', async (req: Request, res: Response) => {
    try {
        const ticketId = req.params.id as string;
        const alerts = await redAlertsService.getAlertsByTicket(ticketId);

        res.json(alerts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /projects/:id/alerts
 * Get all alerts for a specific project
 */
router.get('/projects/:id/alerts', async (req: Request, res: Response) => {
    try {
        const projectId = req.params.id as string;
        const alerts = await redAlertsService.getAlertsByProject(projectId);

        res.json(alerts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /alerts/scan
 * Manually trigger alert scan (Admin only)
 * Checks all tickets and creates alerts where conditions are met
 */
router.post('/alerts/scan', async (req: Request, res: Response) => {
    try {
        const result = await redAlertsService.scanAndTriggerAlerts();

        res.json({
            message: 'Alert scan completed',
            new_alerts: result,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /tickets/:id/alerts/resolve
 * Manually resolve alerts for a ticket (Admin only)
 */
router.post('/tickets/:id/alerts/resolve', async (req: Request, res: Response) => {
    try {
        const ticketId = req.params.id as string;
        await redAlertsService.resolveAlertsForTicket(ticketId);

        res.json({ message: 'Alerts resolved successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
