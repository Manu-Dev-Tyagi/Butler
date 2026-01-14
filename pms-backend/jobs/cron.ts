import { Cron } from 'croner';
import { EventProcessor } from './event-processor';
import { scanAndTriggerRedAlerts } from './handlers/red-alert.handler';

const processor = new EventProcessor();

export function setupCronJobs() {
    console.log('[CRON] 🕒 Scheduling Event Processor (every 1 minute)');
    console.log('[CRON] 🚨 Scheduling Red Alert Scanner (every 30 minutes)');

    // Event Processor - Run every minute
    new Cron('* * * * *', async () => {
        const now = new Date().toLocaleTimeString();
        console.log(`[CRON] ${now} - Running Event Processor Cycle...`);
        try {
            await processor.processCycle();
        } catch (error: any) {
            console.error('[CRON] Error in Event Processor cycle:', error.message);
        }
    });

    // Red Alert Scanner - Run every 30 minutes
    new Cron('*/30 * * * *', async () => {
        const now = new Date().toLocaleTimeString();
        console.log(`[CRON] ${now} - Running Red Alert Scanner...`);
        try {
            await scanAndTriggerRedAlerts();
        } catch (error: any) {
            console.error('[CRON] Error in Red Alert Scanner:', error.message);
        }
    });

    // Run once immediately on startup for convenience in dev
    if (process.env.NODE_ENV !== 'test') {
        console.log('[CRON] Running initial Event Processor cycle...');
        processor.processCycle().catch(console.error);

        console.log('[CRON] Running initial Red Alert scan...');
        scanAndTriggerRedAlerts().catch(console.error);
    }
}
