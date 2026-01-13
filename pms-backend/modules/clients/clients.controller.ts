import { Router, Request, Response } from 'express';
import { ClientsService } from './clients.service';

const router = Router();
const clientsService = new ClientsService();

// Create Client
router.post('/clients', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === '') {
            res.status(400).json({ error: 'Client name is required' });
            return;
        }

        const client = await clientsService.createClient({ name });
        res.status(201).json(client);
    } catch (error: any) {
        if (error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// List All Clients
router.get('/clients', async (req: Request, res: Response) => {
    try {
        const clients = await clientsService.findAll();
        res.json(clients);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
