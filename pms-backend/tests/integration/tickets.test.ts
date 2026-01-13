import axios from 'axios';

const API_URL = 'http://localhost:3000';

let testUserId: string;
let testProjectId: string;
let testClientId: string;
let testTicketId: string;
let testUser2Id: string;

async function testTickets() {
    console.log('🚀 Starting Tickets Integration Test...\n');

    try {
        // ==================== SETUP ====================
        console.log('--- SETUP: Creating Test Data ---');

        // Create client
        const clientRes = await axios.post(`${API_URL}/clients`, {
            name: `Test Client ${Date.now()}`,
        });
        testClientId = clientRes.data.id;
        console.log('✅ Test Client Created:', testClientId);

        // Create project
        const projectRes = await axios.post(`${API_URL}/projects`, {
            client_id: testClientId,
            name: `Test Project ${Date.now()}`,
        });
        testProjectId = projectRes.data.project.id;
        console.log('✅ Test Project Created:', testProjectId);

        // Create test user
        const userRes = await axios.post(`${API_URL}/users`, {
            name: 'Test Employee',
            email: `testuser_${Date.now()}@butler.com`,
            password: 'password123',
            role: 'EMPLOYEE',
        });
        testUserId = userRes.data.id;
        console.log('✅ Test User Created:', testUserId);

        // Create second test user for reassignment
        const user2Res = await axios.post(`${API_URL}/users`, {
            name: 'Test Employee 2',
            email: `testuser2_${Date.now()}@butler.com`,
            password: 'password123',
            role: 'EMPLOYEE',
        });
        testUser2Id = user2Res.data.id;
        console.log('✅ Test User 2 Created:', testUser2Id);

        // ==================== TICKET CRUD TESTS ====================
        console.log('\n--- 1. Creating Ticket (Minimal) ---');
        const createTicketRes = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Test Ticket',
            priority: 'MEDIUM',
        });
        testTicketId = createTicketRes.data.id;
        console.log('✅ Ticket Created:', testTicketId);
        console.log('   Status:', createTicketRes.data.status);
        if (createTicketRes.data.status !== 'CREATED') {
            throw new Error('Ticket should be created with status CREATED');
        }

        console.log('\n--- 2. Creating Ticket (Full) ---');
        const fullTicketRes = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Full Test Ticket',
            description: 'Test description',
            priority: 'HIGH',
            delivery_datetime: '2026-02-01T10:00:00Z',
            delivery_slot: 'Morning',
            ad_name: 'Test Ad',
            creative_count: 5,
        });
        console.log('✅ Full Ticket Created:', fullTicketRes.data.id);

        console.log('\n--- 3. Listing Tickets ---');
        const listTicketsRes = await axios.get(`${API_URL}/tickets`);
        const ticketFound = listTicketsRes.data.find((t: any) => t.id === testTicketId);
        if (ticketFound) console.log('✅ Ticket found in list');
        else throw new Error('Ticket not found in list');

        console.log('\n--- 4. Getting Ticket by ID ---');
        const getTicketRes = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        if (getTicketRes.data.id === testTicketId) {
            console.log('✅ Ticket retrieved by ID');
        } else {
            throw new Error('Ticket retrieval failed');
        }

        console.log('\n--- 5. Updating Ticket ---');
        const updateTicketRes = await axios.patch(`${API_URL}/tickets/${testTicketId}`, {
            title: 'Updated Ticket Title',
            description: 'Updated description',
            priority: 'URGENT',
        });
        if (updateTicketRes.data.title === 'Updated Ticket Title') {
            console.log('✅ Ticket updated successfully');
        } else {
            throw new Error('Ticket update failed');
        }

        // ==================== ASSIGNMENT TESTS ====================
        console.log('\n--- 6. Assigning Ticket to User ---');
        const assignRes = await axios.post(`${API_URL}/tickets/${testTicketId}/assign`, {
            user_id: testUserId,
        });
        console.log('✅ Ticket assigned successfully');
        console.log('   Assignment ID:', assignRes.data.assignment.id);

        // Verify ticket status changed to ASSIGNED
        const ticketAfterAssign = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        if (ticketAfterAssign.data.status === 'ASSIGNED') {
            console.log('✅ Ticket status changed to ASSIGNED');
        } else {
            throw new Error(`Expected status ASSIGNED, got ${ticketAfterAssign.data.status}`);
        }

        console.log('\n--- 7. Assigning Ticket to Same User (Should Fail) ---');
        try {
            await axios.post(`${API_URL}/tickets/${testTicketId}/assign`, {
                user_id: testUserId,
            });
            throw new Error('Should have rejected assignment to same user');
        } catch (error: any) {
            if (error.response?.status === 400 && error.response.data.error.includes('already assigned')) {
                console.log('✅ Duplicate assignment correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 8. Reassigning Ticket to Different User ---');
        const reassignRes = await axios.post(`${API_URL}/tickets/${testTicketId}/assign`, {
            user_id: testUser2Id,
        });
        console.log('✅ Ticket reassigned successfully to User 2');

        console.log('\n--- 9. Unassigning Ticket ---');
        const unassignRes = await axios.post(`${API_URL}/tickets/${testTicketId}/unassign`);
        if (unassignRes.data.message.includes('unassigned')) {
            console.log('✅ Ticket unassigned successfully');
        } else {
            throw new Error('Unassign failed');
        }

        // Verify ticket status changed to REASSIGNED
        const ticketAfterUnassign = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        if (ticketAfterUnassign.data.status === 'REASSIGNED') {
            console.log('✅ Ticket status changed to REASSIGNED');
        } else {
            throw new Error(`Expected status REASSIGNED, got ${ticketAfterUnassign.data.status}`);
        }

        console.log('\n--- 10. Unassigning Already Unassigned Ticket (Should Fail) ---');
        try {
            await axios.post(`${API_URL}/tickets/${testTicketId}/unassign`);
            throw new Error('Should have rejected unassign of unassigned ticket');
        } catch (error: any) {
            if (error.response?.status === 400 && error.response.data.error.includes('no active assignment')) {
                console.log('✅ Unassign of unassigned ticket correctly rejected');
            } else {
                throw error;
            }
        }

        // ==================== VALIDATION TESTS ====================
        console.log('\n--- 11. Missing project_id Validation ---');
        try {
            await axios.post(`${API_URL}/tickets`, {
                title: 'Invalid Ticket',
                priority: 'MEDIUM',
            });
            throw new Error('Should have rejected missing project_id');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Missing project_id correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 12. Missing title Validation ---');
        try {
            await axios.post(`${API_URL}/tickets`, {
                project_id: testProjectId,
                priority: 'MEDIUM',
            });
            throw new Error('Should have rejected missing title');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Missing title correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 13. Missing priority Validation ---');
        try {
            await axios.post(`${API_URL}/tickets`, {
                project_id: testProjectId,
                title: 'Test Ticket',
            });
            throw new Error('Should have rejected missing priority');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Missing priority correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 14. Empty title Validation ---');
        try {
            await axios.post(`${API_URL}/tickets`, {
                project_id: testProjectId,
                title: '',
                priority: 'MEDIUM',
            });
            throw new Error('Should have rejected empty title');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Empty title correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 15. Invalid priority Validation ---');
        try {
            await axios.post(`${API_URL}/tickets`, {
                project_id: testProjectId,
                title: 'Test Ticket',
                priority: 'INVALID_PRIORITY',
            });
            throw new Error('Should have rejected invalid priority');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Invalid priority correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 16. Missing user_id in Assignment ---');
        try {
            await axios.post(`${API_URL}/tickets/${testTicketId}/assign`, {});
            throw new Error('Should have rejected missing user_id');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Missing user_id in assignment correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 17. Non-Existent Ticket Assignment ---');
        try {
            await axios.post(`${API_URL}/tickets/00000000-0000-0000-0000-000000000000/assign`, {
                user_id: testUserId,
            });
            throw new Error('Should have returned 404 for non-existent ticket');
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.log('✅ Non-existent ticket assignment correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 18. Non-Existent Ticket Retrieval ---');
        try {
            await axios.get(`${API_URL}/tickets/00000000-0000-0000-0000-000000000000`);
            throw new Error('Should have returned 404 for non-existent ticket');
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.log('✅ Non-existent ticket correctly returned 404');
            } else {
                throw error;
            }
        }

        console.log('\n🎉 All Tickets tests passed!\n');
    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
        process.exit(1);
    }
}

testTickets();
