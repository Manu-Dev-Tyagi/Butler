import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { checkConnection } from '@database/connection';

// Validate environment variables
if (!process.env.DATABASE_URL) {
    console.error('[FATAL] DATABASE_URL is not set in environment variables');
    console.error('Please create a .env file with DATABASE_URL=postgresql://...');
    process.exit(1);
}

if (!process.env.JWT_SECRET) {
    console.warn('[WARNING] JWT_SECRET is not set. Using default (NOT SECURE FOR PRODUCTION)');
    process.env.JWT_SECRET = 'default-jwt-secret-change-in-production';
}

import authRoutes from '@modules/auth/auth.controller';
import usersRoutes from '@modules/users/users.controller';
import departmentsRoutes from '@modules/departments/departments.controller';
import clientsRoutes from '@modules/clients/clients.controller';
import projectsRoutes from '@modules/projects/projects.controller';
import sprintsRoutes from '@modules/sprints/sprints.controller';
import ticketsRoutes from '@modules/tickets/tickets.controller';
import iterationsRoutes from '@modules/iterations/iterations.controller';
import notificationsRoutes from '@modules/notifications/notifications.controller';
import commentsRoutes from '@modules/comments/comments.controller';
import filesRoutes from '@modules/files/files.controller';
import analyticsRoutes from '@modules/analytics/analytics.controller';
import responseSheetsRoutes from '@modules/response-sheets/response-sheets.controller';
import redAlertsRoutes from '@modules/red-alerts/red-alerts.controller';

// Initialize Event Subscribers
// Note: We are now using a separate Worker process for event handling.
// The API only handles row creation (ProjectEventPublisher, TicketEventPublisher).

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
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
app.use('/', commentsRoutes); // Comments controller handles /tickets/:id/comments routes
app.use('/', filesRoutes); // Files controller handles /files/upload and /tickets/:id/files routes
app.use('/', notificationsRoutes); // Notifications controller handles /notifications routes
app.use('/', analyticsRoutes); // Analytics controller handles /analytics/* routes
app.use('/', responseSheetsRoutes); // Response Sheets controller handles /response-sheets/* routes
app.use('/', redAlertsRoutes); // Red Alerts controller handles /alerts/* and /tickets/:id/alerts routes

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

// Start Server with Database Check
async function startServer() {
    try {
        // Check database connection before starting server
        console.log('[API] Checking database connection...');
        const dbConnected = await checkConnection();
        
        if (!dbConnected) {
            console.error('[FATAL] Cannot connect to database. Please check:');
            console.error('1. PostgreSQL is running');
            console.error('2. DATABASE_URL is correct in .env file');
            console.error('3. Database exists and migrations are run');
            process.exit(1);
        }

        // Start HTTP server
        const server = app.listen(PORT, () => {
            console.log(`[PMS-BACKEND-API] 🚀 Server running on http://localhost:${PORT}`);
            console.log(`[PMS-BACKEND-API] Health check: http://localhost:${PORT}/health`);
        });

        // Handle server errors (before 'listening' event)
        server.on('error', (error: any) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`[FATAL] Port ${PORT} is already in use.`);
                console.error(`[FATAL] Process using port: ${error.syscall || 'unknown'}`);
                console.error('Solution: Change PORT in .env or kill the process using port', PORT);
                console.error(`Quick fix: lsof -ti:${PORT} | xargs kill -9`);
                process.exit(1);
            } else {
                console.error('[FATAL] Server error:', error);
                process.exit(1);
            }
        });

        return server;
    } catch (error: any) {
        console.error('[FATAL] Failed to start server:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Graceful Shutdown handlers
let serverInstance: any = null;

// Start the server
startServer()
    .then((server) => {
        serverInstance = server;
        
        process.on('SIGTERM', () => {
            console.log('SIGTERM signal received: closing HTTP server');
            if (serverInstance) {
                serverInstance.close(() => {
                    console.log('HTTP server closed');
                    process.exit(0);
                });
            }
        });

        process.on('SIGINT', () => {
            console.log('SIGINT signal received: closing HTTP server');
            if (serverInstance) {
                serverInstance.close(() => {
                    console.log('HTTP server closed');
                    process.exit(0);
                });
            }
        });
    })
    .catch((error) => {
        console.error('[FATAL] Unhandled error during server startup:', error);
        process.exit(1);
    });

export default app;
