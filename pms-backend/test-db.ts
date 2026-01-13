
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    console.log('Testing connection to:', process.env.DATABASE_URL);
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    try {
        await client.connect();
        console.log('✅ Connection successful');
        const res = await client.query('SELECT NOW()');
        console.log('Result:', res.rows[0]);
        await client.end();
    } catch (err: any) {
        console.error('❌ Connection failed:', err.message);
        if (err.code) console.error('Code:', err.code);
    }
}

testConnection();
