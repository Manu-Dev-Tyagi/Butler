import 'dotenv/config';
import { pool } from '@database/connection';
import { setupCronJobs } from '../jobs/cron';

async function startWorker() {
    console.log('----------------------------------------------------');
    console.log('⚙️  BUTLER BACKGROUND WORKER STARTING...');
    console.log('----------------------------------------------------');

    try {
        // 1. Explicit DB Check
        console.log('[WORKER] Checking database connectivity...');
        const result = await pool.query('SELECT NOW()');
        console.log('[WORKER] ✅ Database connected successfully at:', result.rows[0].now);

        // 2. Setup Cron Jobs
        setupCronJobs();

        console.log('[WORKER] 🚀 Worker is active and polling.');
        console.log('----------------------------------------------------');

    } catch (error: any) {
        console.error('[WORKER] ❌ FATAL: Failed to start worker:', error.message);
        process.exit(1);
    }
}

// Graceful Shutdown
process.on('SIGTERM', async () => {
    console.log('[WORKER] SIGTERM received. Shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('[WORKER] SIGINT received. Shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

startWorker();
