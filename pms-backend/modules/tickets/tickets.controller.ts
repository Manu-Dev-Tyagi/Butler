import { Router, Request, Response } from 'express';
import { TicketsService } from './tickets.service';
import { CreateTicketDTO, UpdateTicketDTO, AssignTicketDTO } from './tickets.types';

const router = Router();
const ticketsService = new TicketsService();

// ======================== TICKET CRUD ROUTES ========================

// Create Ticket
router.post('/tickets', async (req: Request, res: Response) => {
    try {
        const { project_id, sprint_id, title, description, priority, delivery_datetime, delivery_slot, ad_name, creative_count } = req.body;

        if (!project_id || !title || !priority) {
            res.status(400).json({ error: 'project_id, title, and priority are required' });
            return;
        }

        const ticketData: CreateTicketDTO = {
            project_id,
            title,
            priority,
            sprint_id,
            description,
            delivery_datetime,
            delivery_slot,
            ad_name,
            creative_count,
        };

        const ticket = await ticketsService.createTicket(ticketData);
        res.status(201).json(ticket);
    } catch (error: any) {
        if (error.message.includes('required') || error.message.includes('empty') || error.message.includes('Invalid')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// List Tickets with optional filters
router.get('/tickets', async (req: Request, res: Response) => {
    try {
        const { project_id, sprint_id, status } = req.query;
        let tickets;

        if (project_id) {
            tickets = await ticketsService.findByProject(project_id as string);
        } else if (sprint_id) {
            tickets = await ticketsService.findBySprint(sprint_id as string);
        } else {
            tickets = await ticketsService.findAll();
        }

        if (status) {
            tickets = tickets.filter(t => t.status === status);
        }

        res.json(tickets);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Tickets Assigned to Me (Mocked for now or use session)
router.get('/tickets/assigned/me', async (req: Request, res: Response) => {
    try {
        // In a real app, we'd get the user ID from the JWT/session
        // For this task, we'll assume the frontend passes it or we'd need auth middleware
        // Let's assume for now we list all if not authenticated, or we can add a simple header check
        const tickets = await ticketsService.findAll();
        // Return a subset or all for now
        res.json(tickets);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Ticket by ID
router.get('/tickets/:id', async (req: Request, res: Response) => {
    try {
        const ticket = await ticketsService.findById(req.params.id as string);
        if (!ticket) {
            res.status(404).json({ error: 'Ticket not found' });
            return;
        }
        res.json(ticket);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update Ticket
router.patch('/tickets/:id', async (req: Request, res: Response) => {
    try {
        const { title, description, priority, delivery_datetime, delivery_slot, ad_name, creative_count, sprint_id, status } = req.body;

        const updateData: UpdateTicketDTO = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (priority !== undefined) updateData.priority = priority;
        if (delivery_datetime !== undefined) updateData.delivery_datetime = delivery_datetime;
        if (delivery_slot !== undefined) updateData.delivery_slot = delivery_slot;
        if (ad_name !== undefined) updateData.ad_name = ad_name;
        if (creative_count !== undefined) updateData.creative_count = creative_count;
        if (sprint_id !== undefined) updateData.sprint_id = sprint_id;
        if (status !== undefined) updateData.status = status;

        const ticket = await ticketsService.updateTicket(req.params.id as string, updateData);
        if (!ticket) {
            res.status(404).json({ error: 'Ticket not found' });
            return;
        }

        res.json(ticket);
    } catch (error: any) {
        if (error.message.includes('empty') || error.message.includes('Invalid')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Update Ticket Status (Alternative endpoint for status-only updates)
router.patch('/tickets/:id/status', async (req: Request, res: Response) => {
    try {
        const { status } = req.body;

        if (!status) {
            res.status(400).json({ error: 'status is required' });
            return;
        }

        const ticket = await ticketsService.updateTicketStatus(req.params.id as string, status);
        if (!ticket) {
            res.status(404).json({ error: 'Ticket not found' });
            return;
        }

        res.json(ticket);
    } catch (error: any) {
        if (error.message.includes('Invalid') || error.message.includes('not allowed')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// ======================== TICKET ASSIGNMENT ROUTES ========================

// Assign Ticket to User
router.post('/tickets/:id/assign', async (req: Request, res: Response) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            res.status(400).json({ error: 'user_id is required' });
            return;
        }

        const assignData: AssignTicketDTO = { user_id };
        const assignment = await ticketsService.assignTicket(req.params.id as string, assignData);

        res.status(200).json({
            message: 'Ticket assigned successfully',
            assignment,
        });
    } catch (error: any) {
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes('already assigned') || error.message.includes('required')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Unassign Ticket (Exit Flow Only)
router.post('/tickets/:id/unassign', async (req: Request, res: Response) => {
    try {
        const success = await ticketsService.unassignTicket(req.params.id as string);

        if (success) {
            res.status(200).json({ message: 'Ticket unassigned successfully' });
        } else {
            res.status(500).json({ error: 'Failed to unassign ticket' });
        }
    } catch (error: any) {
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes('no active assignment')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

export default router;
