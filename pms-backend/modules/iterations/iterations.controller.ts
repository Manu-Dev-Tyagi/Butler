import { Router, Request, Response } from 'express';
import { IterationsService } from './iterations.service';
import { ApproveTicketDTO, RejectTicketDTO } from './iterations.types';

const router = Router();
const iterationsService = new IterationsService();

// ======================== ITERATION ROUTES ========================

// Create Iteration for Ticket (Manual)
router.post('/tickets/:id/iterations', async (req: Request, res: Response) => {
    try {
        const ticketId = req.params.id as string;
        const iteration = await iterationsService.createIteration(ticketId);

        res.status(201).json(iteration);
    } catch (error: any) {
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Get All Iterations for a Ticket
router.get('/tickets/:id/iterations', async (req: Request, res: Response) => {
    try {
        const ticketId = req.params.id as string;
        const iterations = await iterationsService.getIterations(ticketId);

        res.json(iterations);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ======================== APPROVAL ROUTES ========================

// Approve Ticket
router.post('/tickets/:id/approve', async (req: Request, res: Response) => {
    try {
        const ticketId = req.params.id as string;
        const { approved_by } = req.body;

        if (!approved_by) {
            res.status(400).json({ error: 'approved_by is required' });
            return;
        }

        const approveData: ApproveTicketDTO = { approved_by };
        const result = await iterationsService.approveTicket(ticketId, approveData);

        res.json({
            message: 'Ticket approved successfully',
            iteration: result.iteration,
            approval: result.approval,
            ftr: result.ftr,
        });
    } catch (error: any) {
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: error.message });
        } else if (
            error.message.includes('No iteration') ||
            error.message.includes('not pending') ||
            error.message.includes('Cannot approve')
        ) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Reject Ticket / Request Revision
router.post('/tickets/:id/reject', async (req: Request, res: Response) => {
    try {
        const ticketId = req.params.id as string;
        const { approved_by, reason } = req.body;

        if (!approved_by) {
            res.status(400).json({ error: 'approved_by is required' });
            return;
        }

        const rejectData: RejectTicketDTO = { approved_by, reason };
        const result = await iterationsService.rejectTicket(ticketId, rejectData);

        res.json({
            message: 'Ticket rejected. Revision required. New iteration created.',
            old_iteration: result.oldIteration,
            new_iteration: result.newIteration,
            approval: result.approval,
            ftr: result.ftr,
        });
    } catch (error: any) {
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: error.message });
        } else if (
            error.message.includes('No iteration') ||
            error.message.includes('not pending') ||
            error.message.includes('Cannot reject')
        ) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Request Revision (Alias for reject with more business-friendly naming)
router.post('/tickets/:id/revision', async (req: Request, res: Response) => {
    try {
        const ticketId = req.params.id as string;
        const { reviewer_id, comments } = req.body;

        if (!reviewer_id) {
            res.status(400).json({ error: 'reviewer_id is required' });
            return;
        }

        const rejectData: RejectTicketDTO = { approved_by: reviewer_id, reason: comments };
        const result = await iterationsService.rejectTicket(ticketId, rejectData);

        res.json({
            message: 'Revision requested. Ticket moved to REVISION_REQUIRED status.',
            revision: {
                old_iteration: result.oldIteration,
                new_iteration: result.newIteration,
                comments: comments, // Include the revision comments
            },
            approval: result.approval,
            ftr: result.ftr,
        });
    } catch (error: any) {
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: error.message });
        } else if (
            error.message.includes('No iteration') ||
            error.message.includes('not pending') ||
            error.message.includes('Cannot reject')
        ) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Get FTR Metric for Ticket
router.get('/tickets/:id/ftr', async (req: Request, res: Response) => {
    try {
        const ticketId = req.params.id as string;
        const ftr = await iterationsService.getFTR(ticketId);

        if (!ftr) {
            res.status(404).json({ error: 'FTR record not found for this ticket' });
            return;
        }

        res.json(ftr);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
