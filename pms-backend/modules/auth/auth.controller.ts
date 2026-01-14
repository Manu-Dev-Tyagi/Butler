import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service';

const router = Router();
const authService = new AuthService();

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password required' });
            return;
        }

        const user = await authService.validateUser(email, password);
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const result = await authService.login(user);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/signup', async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            res.status(400).json({ message: 'Name, email, password and role required' });
            return;
        }

        const validRoles = ['ADMIN', 'PM', 'EMPLOYEE'];
        if (!validRoles.includes(role)) {
            res.status(400).json({ message: 'Invalid role' });
            return;
        }

        const result = await authService.signup({ name, email, password, role });
        res.status(201).json(result);
    } catch (error: any) {
        console.error(error);
        if (error.message.includes('unique')) {
            res.status(400).json({ message: 'Email already registered' });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
});

export default router;
