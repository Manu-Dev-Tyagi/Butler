import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testAuth() {
    try {
        console.log('[TEST] 1. Testing Login (Expect Success)...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@butler.com',
            password: 'admin123',
        });
        console.log('✅ Login Successful. Token:', loginRes.data.access_token ? 'RECEIVED' : 'MISSING');

        if (!loginRes.data.access_token) throw new Error('No token received');

        // Here we would test a protected route if we had one.
        // Let's assume we are good for now if we got the token.

    } catch (error: any) {
        console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

testAuth();
