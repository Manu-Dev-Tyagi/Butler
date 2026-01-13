import axios from 'axios';

const API_URL = 'http://localhost:3000';

let testClientId: string;
let testProjectId: string;
let testUserId: string;

async function testClientsAndProjects() {
    console.log('🚀 Starting Clients & Projects Integration Test...\n');

    try {
        // ==================== SETUP: Create Test User ====================
        console.log('--- SETUP: Creating Test User ---');
        const uniqueEmail = `testuser_${Date.now()}@butler.com`;
        const userRes = await axios.post(`${API_URL}/users`, {
            name: 'Test Employee',
            email: uniqueEmail,
            password: 'password123',
            role: 'EMPLOYEE',
        });
        testUserId = userRes.data.id;
        console.log('✅ Test User Created:', testUserId);

        // ==================== CLIENT TESTS ====================
        console.log('\n--- 1. Creating Client ---');
        const createClientRes = await axios.post(`${API_URL}/clients`, {
            name: `Test Client ${Date.now()}`,
        });
        testClientId = createClientRes.data.id;
        console.log('✅ Client Created:', testClientId);

        console.log('\n--- 2. Listing Clients ---');
        const listClientsRes = await axios.get(`${API_URL}/clients`);
        const clientFound = listClientsRes.data.find((c: any) => c.id === testClientId);
        if (clientFound) console.log('✅ Client found in list');
        else throw new Error('Client not found in list');

        console.log('\n--- 3. Duplicate Client Name Validation ---');
        try {
            await axios.post(`${API_URL}/clients`, {
                name: createClientRes.data.name,
            });
            throw new Error('Should have rejected duplicate client name');
        } catch (error: any) {
            if (error.response?.status === 409) {
                console.log('✅ Duplicate client name correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 4. Client Name Required Validation ---');
        try {
            await axios.post(`${API_URL}/clients`, { name: '' });
            throw new Error('Should have rejected empty client name');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Empty client name correctly rejected');
            } else {
                throw error;
            }
        }

        // ==================== PROJECT TESTS ====================
        console.log('\n--- 5. Creating Project (Simple) ---');
        const createProjectRes = await axios.post(`${API_URL}/projects`, {
            client_id: testClientId,
            name: `Test Project ${Date.now()}`,
        });
        testProjectId = createProjectRes.data.project.id;
        console.log('✅ Project Created:', testProjectId);

        console.log('\n--- 6. Creating Project with POCs and Members ---');
        const fullProjectRes = await axios.post(`${API_URL}/projects`, {
            client_id: testClientId,
            name: `Full Test Project ${Date.now()}`,
            pocs: [
                { name: 'John Doe', email: 'john@client.com', phone: '555-1234' },
                { name: 'Jane Smith', email: 'jane@client.com' },
            ],
            member_ids: [testUserId],
        });
        const fullProjectId = fullProjectRes.data.project.id;
        console.log('✅ Project Created with POCs and Members:', fullProjectId);
        console.log('   POCs Created:', fullProjectRes.data.pocs.length);
        console.log('   Members Assigned:', fullProjectRes.data.members.length);

        console.log('\n--- 7. Listing Projects ---');
        const listProjectsRes = await axios.get(`${API_URL}/projects`);
        const projectFound = listProjectsRes.data.find((p: any) => p.id === testProjectId);
        if (projectFound) console.log('✅ Project found in list');
        else throw new Error('Project not found in list');

        console.log('\n--- 8. Getting Project by ID ---');
        const getProjectRes = await axios.get(`${API_URL}/projects/${testProjectId}`);
        if (getProjectRes.data.id === testProjectId) console.log('✅ Project retrieved by ID');
        else throw new Error('Project retrieval failed');

        console.log('\n--- 9. Updating Project ---');
        const updateProjectRes = await axios.patch(`${API_URL}/projects/${testProjectId}`, {
            name: 'Updated Project Name',
            status: 'ACTIVE',
        });
        if (updateProjectRes.data.name === 'Updated Project Name') {
            console.log('✅ Project updated successfully');
        } else {
            throw new Error('Project update failed');
        }

        // ==================== POC TESTS ====================
        console.log('\n--- 10. Adding POC to Project ---');
        const addPOCRes = await axios.post(`${API_URL}/projects/${testProjectId}/pocs`, {
            name: 'Alice Cooper',
            email: 'alice@client.com',
            phone: '555-5678',
        });
        if (addPOCRes.data.name === 'Alice Cooper') console.log('✅ POC added successfully');
        else throw new Error('POC addition failed');

        console.log('\n--- 11. Listing POCs for Project ---');
        const listPOCsRes = await axios.get(`${API_URL}/projects/${testProjectId}/pocs`);
        const pocFound = listPOCsRes.data.find((p: any) => p.name === 'Alice Cooper');
        if (pocFound) console.log('✅ POC found in list');
        else throw new Error('POC not found in list');

        console.log('\n--- 12. POC Name Required Validation ---');
        try {
            await axios.post(`${API_URL}/projects/${testProjectId}/pocs`, { name: '' });
            throw new Error('Should have rejected empty POC name');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Empty POC name correctly rejected');
            } else {
                throw error;
            }
        }

        // ==================== MEMBER TESTS ====================
        console.log('\n--- 13. Adding Member to Project ---');
        const addMemberRes = await axios.post(`${API_URL}/projects/${testProjectId}/members`, {
            user_id: testUserId,
        });
        if (addMemberRes.data.user_id === testUserId) console.log('✅ Member added successfully');
        else throw new Error('Member addition failed');

        console.log('\n--- 14. Listing Members for Project ---');
        const listMembersRes = await axios.get(`${API_URL}/projects/${testProjectId}/members`);
        const memberFound = listMembersRes.data.find((m: any) => m.user_id === testUserId);
        if (memberFound) console.log('✅ Member found in list');
        else throw new Error('Member not found in list');

        console.log('\n--- 15. Duplicate Member Assignment Validation ---');
        try {
            await axios.post(`${API_URL}/projects/${testProjectId}/members`, {
                user_id: testUserId,
            });
            throw new Error('Should have rejected duplicate member assignment');
        } catch (error: any) {
            if (error.response?.status === 409) {
                console.log('✅ Duplicate member assignment correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 16. Removing Member from Project ---');
        const removeMemberRes = await axios.delete(
            `${API_URL}/projects/${testProjectId}/members/${testUserId}`
        );
        if (removeMemberRes.status === 204) console.log('✅ Member removed successfully');
        else throw new Error('Member removal failed');

        console.log('\n--- 17. Verifying Member Removal ---');
        const verifyRemovalRes = await axios.get(`${API_URL}/projects/${testProjectId}/members`);
        const memberStillThere = verifyRemovalRes.data.find((m: any) => m.user_id === testUserId);
        if (!memberStillThere) console.log('✅ Member correctly removed from project');
        else throw new Error('Member still assigned after removal');

        // ==================== VALIDATION TESTS ====================
        console.log('\n--- 18. Project Creation Without client_id ---');
        try {
            await axios.post(`${API_URL}/projects`, { name: 'No Client Project' });
            throw new Error('Should have rejected project without client_id');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Project without client_id correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 19. Project Creation Without name ---');
        try {
            await axios.post(`${API_URL}/projects`, { client_id: testClientId });
            throw new Error('Should have rejected project without name');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Project without name correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 20. Adding Member Without user_id ---');
        try {
            await axios.post(`${API_URL}/projects/${testProjectId}/members`, {});
            throw new Error('Should have rejected member addition without user_id');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Member addition without user_id correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n🎉 All Clients & Projects tests passed!\n');
    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
        process.exit(1);
    }
}

testClientsAndProjects();
