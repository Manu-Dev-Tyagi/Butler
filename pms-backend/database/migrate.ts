import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function migrate() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('[MIGRATION] Running schema.sql...');
        await pool.query(schemaSql);
        console.log('[MIGRATION] Schema applied successfully.');
    } catch (error) {
        console.error('[MIGRATION] Error applying schema:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
