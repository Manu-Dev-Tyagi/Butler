import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function testUserLifecycle() {
    console.log('🚀 Starting User Lifecycle Test...');

    try {
        // 1. Create User
        console.log('\n--- 1. Creating User ---');
        const uniqueEmail = `testuser_${Date.now()}@butler.com`;
        const createRes = await axios.post(`${API_URL}/users`, {
            name: 'Test Employee',
            email: uniqueEmail,
            password: 'password123',
            role: 'EMPLOYEE'
        });
        const user = createRes.data;
        console.log('✅ User Created:', user.id, user.email);

        // 2. List Users
        console.log('\n--- 2. Listing Users ---');
        const listRes = await axios.get(`${API_URL}/users`);
        const found = listRes.data.find((u: any) => u.id === user.id);
        if (found) console.log('✅ User found in list');
        else throw new Error('User not found in list');

        // 3. Update User
        console.log('\n--- 3. Updating User ---');
        const updateRes = await axios.patch(`${API_URL}/users/${user.id}`, { name: 'Updated Employee' });
        if (updateRes.data.name === 'Updated Employee') console.log('✅ User updated successfully');
        else throw new Error('User update failed');

        // 4. Initiate Exit
        console.log('\n--- 4. Initiating Exit ---');
        const exitRes = await axios.post(`${API_URL}/users/${user.id}/exit`);
        if (exitRes.data.employment_status === 'EXIT_INITIATED') console.log('✅ Exit initiated');
        else throw new Error('Exit initiation failed');

        // 5. Verify Exits List
        console.log('\n--- 5. Verifying Exits List ---');
        const exitsRes = await axios.get(`${API_URL}/users/exits`);
        const exitFound = exitsRes.data.find((u: any) => u.id === user.id);
        if (exitFound) console.log('✅ User found in exits list');
        else throw new Error('User not found in exits list');

        // 6. Offboard User (Should succeed as no tickets assigned)
        console.log('\n--- 6. Offboarding User ---');
        const offboardRes = await axios.post(`${API_URL}/users/${user.id}/offboard`);
        if (offboardRes.data.employment_status === 'OFFBOARDED') console.log('✅ User offboarded successfully');
        else throw new Error('Offboarding failed');

        console.log('\n🎉 ALL TESTS PASSED!');

    } catch (error: any) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

testUserLifecycle();
