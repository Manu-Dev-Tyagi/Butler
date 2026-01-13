import cron from 'node-cron';
import { EventProcessor } from './event-processor';

const processor = new EventProcessor();

export function setupCronJobs() {
    console.log('[CRON] 🕒 Scheduling Event Processor (every 1 minute)');

    // Run every minute
    cron.schedule('* * * * *', async () => {
        const now = new Date().toLocaleTimeString();
        console.log(`[CRON] ${now} - Running Event Processor Cycle...`);
        try {
            await processor.processCycle();
        } catch (error: any) {
            console.error('[CRON] Error in Event Processor cycle:', error.message);
        }
    });

    // Run once immediately on startup for convenience in dev
    if (process.env.NODE_ENV !== 'test') {
        console.log('[CRON] Running initial Event Processor cycle...');
        processor.processCycle().catch(console.error);
    }
}
