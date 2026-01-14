import 'dotenv/config';
import { pool, checkConnection } from '@database/connection';
import { setupCronJobs } from '../../jobs/cron';

// Validate environment variables
if (!process.env.DATABASE_URL) {
    console.error('[WORKER] ❌ FATAL: DATABASE_URL is not set in environment variables');
    console.error('Please create a .env file with DATABASE_URL=postgresql://...');
    process.exit(1);
}

async function startWorker() {
    console.log('----------------------------------------------------');
    console.log('⚙️  BUTLER BACKGROUND WORKER STARTING...');
    console.log('----------------------------------------------------');

    try {
        // 1. Explicit DB Check
        console.log('[WORKER] Checking database connectivity...');
        const dbConnected = await checkConnection();
        
        if (!dbConnected) {
            console.error('[WORKER] ❌ FATAL: Cannot connect to database');
            console.error('Please check:');
            console.error('1. PostgreSQL is running');
            console.error('2. DATABASE_URL is correct in .env file');
            console.error('3. Database exists and migrations are run');
            process.exit(1);
        }

        const result = await pool.query('SELECT NOW()');
        console.log('[WORKER] ✅ Database connected successfully at:', result.rows[0].now);

        // 2. Setup Cron Jobs
        console.log('[WORKER] Setting up cron jobs...');
        setupCronJobs();

        console.log('[WORKER] 🚀 Worker is active and polling.');
        console.log('----------------------------------------------------');

    } catch (error: any) {
        console.error('[WORKER] ❌ FATAL: Failed to start worker:', error.message);
        console.error('[WORKER] Error details:', error);
        if (error.code === 'ECONNREFUSED') {
            console.error('[WORKER] Database connection refused. Is PostgreSQL running?');
        }
        if (error.code === 'ENOTFOUND') {
            console.error('[WORKER] Database host not found. Check DATABASE_URL.');
        }
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
