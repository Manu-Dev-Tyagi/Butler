import { Router, Request, Response } from 'express';
import { UsersService } from './users.service';

const router = Router();
const usersService = new UsersService();

// Create User
router.post('/', async (req: Request, res: Response) => {
    try {
        const user = await usersService.createUser(req.body);
        res.status(201).json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// List Users
router.get('/', async (req: Request, res: Response) => {
    try {
        const users = await usersService.findAll();
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// List Exits (Initated)
router.get('/exits', async (req: Request, res: Response) => {
    try {
        const users = await usersService.getExits();
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get User Profile
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const user = await usersService.findById(req.params.id as string);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update User
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const user = await usersService.updateProfile(req.params.id as string, req.body);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Initiate Exit
router.post('/:id/exit', async (req: Request, res: Response) => {
    try {
        const user = await usersService.initiateExit(req.params.id as string);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Offboard User
router.post('/:id/offboard', async (req: Request, res: Response) => {
    try {
        const user = await usersService.offboardUser(req.params.id as string);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    } catch (error: any) {
        if (error.message.includes('Active tickets')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

export default router;
