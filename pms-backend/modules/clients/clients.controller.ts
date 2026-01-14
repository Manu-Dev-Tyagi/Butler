import { Router, Request, Response } from 'express';
import { ClientsService } from './clients.service';

const router = Router();
const clientsService = new ClientsService();

// Create Client
router.post('/clients', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            res.status(400).json({ error: 'Client name is required and must be a non-empty string' });
            return;
        }

        const client = await clientsService.createClient({ name: name.trim() });
        
        if (!client || !client.id) {
            res.status(500).json({ error: 'Failed to create client - invalid response from database' });
            return;
        }
        
        res.status(201).json(client);
    } catch (error: any) {
        console.error('[POST /clients] Error:', error);
        if (error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
        } else if (error.message.includes('required') || error.message.includes('empty')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message || 'Internal server error' });
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
