import { pool } from './connection';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
    console.log('🚀 Starting database migrations...\n');

    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of migrationFiles) {
        console.log(`Running migration: ${file}`);
        const sqlPath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        try {
            await pool.query(sql);
            console.log(`✅ ${file} completed`);
        } catch (error: any) {
            console.error(`❌ ${file} failed:`, error.message);
            // Continue with other migrations even if one fails
        }
    }

    console.log('\n✅ All migrations completed');
    await pool.end();
}

runMigrations().catch(console.error);
