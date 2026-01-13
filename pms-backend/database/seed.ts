import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function seed() {
    try {
        console.log('[SEED] Seeding database...');

        // Hash password 'admin123'
        const passwordHash = await bcrypt.hash('admin123', 10);

        const res = await pool.query("SELECT * FROM users WHERE email = 'admin@butler.com'");

        if (res.rows.length === 0) {
            console.log('[SEED] Creating Admin User...');
            await pool.query(`
        INSERT INTO users (name, email, password_hash, role, employment_status)
        VALUES ($1, $2, $3, $4, $5)
      `, ['Admin User', 'admin@butler.com', passwordHash, 'ADMIN', 'ACTIVE']);
            console.log('[SEED] Admin created: admin@butler.com / admin123');
        } else {
            console.log('[SEED] Admin already exists. Updating password...');
            await pool.query(`UPDATE users SET password_hash = $1 WHERE email = 'admin@butler.com'`, [passwordHash]);
        }

    } catch (error) {
        console.error('[SEED] Error:', error);
    } finally {
        await pool.end();
    }
}

seed();
