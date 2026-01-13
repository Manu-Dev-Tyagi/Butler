import { Pool } from 'pg';
import 'dotenv/config';

async function updateSchema() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log('[SCHEMA-UPDATE] Adding password_hash to users table...');
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`);
        console.log('[SCHEMA-UPDATE] Success.');
    } catch (err) {
        console.error('[SCHEMA-UPDATE] Error:', err);
    } finally {
        await pool.end();
    }
}
updateSchema();
