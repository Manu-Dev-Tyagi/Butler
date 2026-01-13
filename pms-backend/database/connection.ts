import { Pool } from 'pg';
import 'dotenv/config';

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('[DB-ERROR] Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = async (text: string, params?: any[]) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Log slow queries (> 100ms)
    if (duration > 100) {
        console.log(`[SLOW-QUERY] executed query: ${JSON.stringify({ text, duration, rows: res.rowCount })}`);
    }
    return res;
};

export const getClient = async () => {
    const client = await pool.connect();
    return client;
};

export const checkConnection = async () => {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log(`[DB-SUCCESS] Connected to database at ${res.rows[0].now}`);
        return true;
    } catch (err) {
        console.error('[DB-ERROR] Failed to connect to database', err);
        return false;
    }
};
