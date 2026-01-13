import { Router, Request, Response } from 'express';
import { SprintsService } from './sprints.service';

const router = Router();
const sprintsService = new SprintsService();

// Create Sprint
router.post('/sprints', async (req: Request, res: Response) => {
    try {
        const { name, start_date, end_date } = req.body;

        if (!name || !start_date || !end_date) {
            res.status(400).json({ error: 'name, start_date, and end_date are required' });
            return;
        }

        const sprint = await sprintsService.createSprint({ name, start_date, end_date });
        res.status(201).json(sprint);
    } catch (error: any) {
        if (error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
        } else if (
            error.message.includes('required') ||
            error.message.includes('Invalid date') ||
            error.message.includes('must be after')
        ) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// List All Sprints (ordered by start_date DESC)
router.get('/sprints', async (req: Request, res: Response) => {
    try {
        const sprints = await sprintsService.findAll();
        res.json(sprints);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Sprint by ID
router.get('/sprints/:id', async (req: Request, res: Response) => {
    try {
        const sprint = await sprintsService.findById(req.params.id as string);
        if (!sprint) {
            res.status(404).json({ error: 'Sprint not found' });
            return;
        }
        res.json(sprint);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
