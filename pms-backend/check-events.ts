import { pool } from './database/connection';

async function checkEvents() {
    try {
        const res = await pool.query('SELECT * FROM events ORDER BY created_at DESC LIMIT 10');
        console.log('--- RECENT EVENTS ---');
        console.table(res.rows.map(r => ({
            id: r.id,
            type: r.event_type,
            status: r.status,
            payload: JSON.stringify(r.payload).substring(0, 50) + '...',
            created_at: r.created_at
        })));
        await pool.end();
    } catch (err) {
        console.error('Error checking events:', err);
        process.exit(1);
    }
}

checkEvents();
