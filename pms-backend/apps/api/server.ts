import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from '@modules/auth/auth.controller';
import usersRoutes from '@modules/users/users.controller';
import departmentsRoutes from '@modules/departments/departments.controller';
import clientsRoutes from '@modules/clients/clients.controller';
import projectsRoutes from '@modules/projects/projects.controller';
import sprintsRoutes from '@modules/sprints/sprints.controller';
import ticketsRoutes from '@modules/tickets/tickets.controller';
import iterationsRoutes from '@modules/iterations/iterations.controller';

// Initialize Event Subscribers
import '@events/subscribers/project.subscriber';
import '@events/subscribers/ticket.subscriber';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Request logger

// Routes
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/', departmentsRoutes); // Departments controller handles both /departments and /sub-departments paths internally
app.use('/', clientsRoutes); // Clients controller handles /clients routes
app.use('/', projectsRoutes); // Projects controller handles /projects routes
app.use('/', sprintsRoutes); // Sprints controller handles /sprints routes
app.use('/', ticketsRoutes); // Tickets controller handles /tickets routes
app.use('/', iterationsRoutes); // Iterations controller handles /tickets/:id/iterations and approval routes

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[ERROR]', err.stack);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
    });
});

// Start Server
const server = app.listen(PORT, () => {
    console.log(`[PMS-BACKEND] 🚀 Server running on http://localhost:${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

export default app;
