import axios from 'axios';

const API_URL = 'http://localhost:3000';

let testUserId: string;
let testApproverId: string;
let testProjectId: string;
let testClientId: string;
let testTicketId: string;
let testTicket2Id: string;

async function testIterationsAndApprovals() {
    console.log('🚀 Starting Iterations & Approvals Integration Test...\n');

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

        // Create test user (employee)
        const userRes = await axios.post(`${API_URL}/users`, {
            name: 'Test Employee',
            email: `testuser_${Date.now()}@butler.com`,
            password: 'password123',
            role: 'EMPLOYEE',
        });
        testUserId = userRes.data.id;
        console.log('✅ Test User Created:', testUserId);

        // Create approver (PM)
        const approverRes = await axios.post(`${API_URL}/users`, {
            name: 'Test PM Approver',
            email: `approver_${Date.now()}@butler.com`,
            password: 'password123',
            role: 'PM',
        });
        testApproverId = approverRes.data.id;
        console.log('✅ Test Approver Created:', testApproverId);

        // Create first test ticket
        const ticketRes = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Test Ticket for Iterations',
            description: 'Testing iteration and approval flow',
            priority: 'HIGH',
        });
        testTicketId = ticketRes.data.id;
        console.log('✅ Test Ticket 1 Created:', testTicketId);

        // Create second test ticket (for separate scenarios)
        const ticket2Res = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Test Ticket 2 for Rejection Flow',
            description: 'Testing rejection and multi-iteration flow',
            priority: 'MEDIUM',
        });
        testTicket2Id = ticket2Res.data.id;
        console.log('✅ Test Ticket 2 Created:', testTicket2Id);

        console.log('');

        // ==================== TEST 1: Create First Iteration ====================
        console.log('--- TEST 1: Create First Iteration (Manual) ---');
        const iterationRes = await axios.post(`${API_URL}/tickets/${testTicketId}/iterations`);
        console.log('✅ Iteration Created:', iterationRes.data);
        if (iterationRes.data.iteration_number !== 1) {
            throw new Error('First iteration number should be 1');
        }
        if (iterationRes.data.outcome !== 'PENDING') {
            throw new Error('New iteration outcome should be PENDING');
        }
        console.log('');

        // ==================== TEST 2: Get All Iterations ====================
        console.log('--- TEST 2: Get All Iterations for Ticket ---');
        const getIterationsRes = await axios.get(`${API_URL}/tickets/${testTicketId}/iterations`);
        console.log('✅ Iterations Retrieved:', getIterationsRes.data);
        if (getIterationsRes.data.length !== 1) {
            throw new Error('Should have exactly 1 iteration');
        }
        console.log('');

        // ==================== TEST 3: Approve Ticket (Iteration 1 - FTR = TRUE) ====================
        console.log('--- TEST 3: Approve Ticket at Iteration 1 (FTR = TRUE) ---');
        const approveRes = await axios.post(`${API_URL}/tickets/${testTicketId}/approve`, {
            approved_by: testApproverId,
        });
        console.log('✅ Ticket Approved:', approveRes.data);

        // Verify iteration outcome is APPROVED
        if (approveRes.data.iteration.outcome !== 'APPROVED') {
            throw new Error('Iteration outcome should be APPROVED');
        }

        // Verify FTR is TRUE (iteration 1)
        if (!approveRes.data.ftr.first_time_right) {
            throw new Error('FTR should be TRUE for iteration 1 approval');
        }
        if (parseFloat(approveRes.data.ftr.score) !== 100) {
            throw new Error('FTR score should be 100 for iteration 1 approval');
        }

        // Verify approval record created
        if (approveRes.data.approval.status !== 'APPROVED') {
            throw new Error('Approval status should be APPROVED');
        }
        if (approveRes.data.approval.approved_by !== testApproverId) {
            throw new Error('Approved_by should match approver ID');
        }

        console.log('');

        // ==================== TEST 4: Create Second Iteration for Rejection Flow ====================
        console.log('--- TEST 4: Create Iteration for Second Ticket ---');
        const iteration2Res = await axios.post(`${API_URL}/tickets/${testTicket2Id}/iterations`);
        console.log('✅ Iteration Created for Ticket 2:', iteration2Res.data);
        console.log('');

        // ==================== TEST 5: Reject Ticket (Creates New Iteration, FTR = FALSE) ====================
        console.log('--- TEST 5: Reject Ticket (Creates Iteration 2, FTR = FALSE) ---');
        const rejectRes = await axios.post(`${API_URL}/tickets/${testTicket2Id}/reject`, {
            approved_by: testApproverId,
            reason: 'Design needs improvement',
        });
        console.log('✅ Ticket Rejected:', rejectRes.data);

        // Verify old iteration outcome is REVISION_REQUIRED
        if (rejectRes.data.old_iteration.outcome !== 'REVISION_REQUIRED') {
            throw new Error('Old iteration outcome should be REVISION_REQUIRED');
        }

        // Verify new iteration created with iteration_number = 2
        if (rejectRes.data.new_iteration.iteration_number !== 2) {
            throw new Error('New iteration number should be 2');
        }
        if (rejectRes.data.new_iteration.outcome !== 'PENDING') {
            throw new Error('New iteration outcome should be PENDING');
        }

        // Verify FTR is FALSE (locked after rejection)
        if (rejectRes.data.ftr.first_time_right !== false) {
            throw new Error('FTR should be FALSE after rejection');
        }
        if (parseFloat(rejectRes.data.ftr.score) !== 0) {
            throw new Error('FTR score should be 0 after rejection');
        }

        // Verify approval record created with REJECTED status
        if (rejectRes.data.approval.status !== 'REJECTED') {
            throw new Error('Approval status should be REJECTED');
        }

        console.log('');

        // ==================== TEST 6: Verify Iterations Count After Rejection ====================
        console.log('--- TEST 6: Verify Ticket 2 Now Has 2 Iterations ---');
        const getIterations2Res = await axios.get(`${API_URL}/tickets/${testTicket2Id}/iterations`);
        console.log('✅ Iterations Retrieved:', getIterations2Res.data);
        if (getIterations2Res.data.length !== 2) {
            throw new Error('Should have exactly 2 iterations after rejection');
        }
        console.log('');

        // ==================== TEST 7: Approve Iteration 2 (FTR Remains FALSE) ====================
        console.log('--- TEST 7: Approve Iteration 2 (FTR Remains FALSE) ---');
        const approve2Res = await axios.post(`${API_URL}/tickets/${testTicket2Id}/approve`, {
            approved_by: testApproverId,
        });
        console.log('✅ Ticket Approved at Iteration 2:', approve2Res.data);

        // Verify iteration outcome is APPROVED
        if (approve2Res.data.iteration.outcome !== 'APPROVED') {
            throw new Error('Iteration 2 outcome should be APPROVED');
        }

        // Verify FTR is STILL FALSE (locked from previous rejection)
        if (approve2Res.data.ftr.first_time_right !== false) {
            throw new Error('FTR should remain FALSE after iteration 2 approval');
        }
        if (parseFloat(approve2Res.data.ftr.score) !== 0) {
            throw new Error('FTR score should remain 0 after iteration 2 approval');
        }

        console.log('');

        // ==================== TEST 8: Try to Approve Without approved_by (Validation) ====================
        console.log('--- TEST 8: Validation - Approve Without approved_by ---');
        try {
            await axios.post(`${API_URL}/tickets/${testTicketId}/approve`, {});
            throw new Error('Should have failed without approved_by');
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected approval without approved_by');
            } else {
                throw error;
            }
        }
        console.log('');

        // ==================== TEST 9: Try to Reject Without approved_by (Validation) ====================
        console.log('--- TEST 9: Validation - Reject Without approved_by ---');
        try {
            await axios.post(`${API_URL}/tickets/${testTicketId}/reject`, {
                reason: 'Test reason',
            });
            throw new Error('Should have failed without approved_by');
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected rejection without approved_by');
            } else {
                throw error;
            }
        }
        console.log('');

        // ==================== TEST 10: Try to Approve Already Approved Ticket ====================
        console.log('--- TEST 10: Try to Approve Already Approved Ticket ---');
        try {
            await axios.post(`${API_URL}/tickets/${testTicketId}/approve`, {
                approved_by: testApproverId,
            });
            throw new Error('Should not allow approving already approved iteration');
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly prevented approving non-pending iteration');
            } else {
                throw error;
            }
        }
        console.log('');

        // ==================== TEST 11: Create Ticket Without Iteration and Try to Approve ====================
        console.log('--- TEST 11: Try to Approve Ticket Without Iteration ---');
        const ticket3Res = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Test Ticket Without Iteration',
            priority: 'LOW',
        });
        const ticket3Id = ticket3Res.data.id;

        try {
            await axios.post(`${API_URL}/tickets/${ticket3Id}/approve`, {
                approved_by: testApproverId,
            });
            throw new Error('Should not allow approving ticket without iteration');
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly prevented approving ticket without iteration');
            } else {
                throw error;
            }
        }
        console.log('');

        // ==================== TEST 12: Try to Reject Ticket Without Iteration ====================
        console.log('--- TEST 12: Try to Reject Ticket Without Iteration ---');
        try {
            await axios.post(`${API_URL}/tickets/${ticket3Id}/reject`, {
                approved_by: testApproverId,
                reason: 'Test',
            });
            throw new Error('Should not allow rejecting ticket without iteration');
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly prevented rejecting ticket without iteration');
            } else {
                throw error;
            }
        }
        console.log('');

        // ==================== TEST 13: Create Multiple Iterations Manually ====================
        console.log('--- TEST 13: Create Multiple Iterations Manually ---');
        const ticket4Res = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Test Ticket for Manual Iterations',
            priority: 'MEDIUM',
        });
        const ticket4Id = ticket4Res.data.id;

        await axios.post(`${API_URL}/tickets/${ticket4Id}/iterations`);
        await axios.post(`${API_URL}/tickets/${ticket4Id}/iterations`);
        await axios.post(`${API_URL}/tickets/${ticket4Id}/iterations`);

        const getIterations4Res = await axios.get(`${API_URL}/tickets/${ticket4Id}/iterations`);
        console.log('✅ Multiple Iterations Created:', getIterations4Res.data.length);
        if (getIterations4Res.data.length !== 3) {
            throw new Error('Should have exactly 3 iterations');
        }
        console.log('');

        // ==================== TEST 14: Rejection with Optional Reason ====================
        console.log('--- TEST 14: Reject with Optional Reason Field ---');
        const ticket5Res = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Test Ticket for Rejection with Reason',
            priority: 'HIGH',
        });
        const ticket5Id = ticket5Res.data.id;

        await axios.post(`${API_URL}/tickets/${ticket5Id}/iterations`);

        const rejectWithReasonRes = await axios.post(`${API_URL}/tickets/${ticket5Id}/reject`, {
            approved_by: testApproverId,
            reason: 'Color palette needs adjustment per brand guidelines',
        });
        console.log('✅ Ticket Rejected with Reason:', rejectWithReasonRes.data);
        console.log('');

        // ==================== TEST 15: Approve Non-Existent Ticket ====================
        console.log('--- TEST 15: Try to Approve Non-Existent Ticket ---');
        try {
            await axios.post(`${API_URL}/tickets/00000000-0000-0000-0000-000000000000/approve`, {
                approved_by: testApproverId,
            });
            throw new Error('Should not allow approving non-existent ticket');
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                console.log('✅ Correctly returned 404 for non-existent ticket');
            } else {
                throw error;
            }
        }
        console.log('');

        // ==================== TEST 16: Reject Already Approved Ticket ====================
        console.log('--- TEST 16: Try to Reject Already Approved Ticket ---');
        try {
            await axios.post(`${API_URL}/tickets/${testTicket2Id}/reject`, {
                approved_by: testApproverId,
                reason: 'Should fail',
            });
            throw new Error('Should not allow rejecting already approved iteration');
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly prevented rejecting non-pending iteration');
            } else {
                throw error;
            }
        }
        console.log('');

        // ==================== TEST 17: Verify FTR Locking - Multiple Rejections ====================
        console.log('--- TEST 17: Verify FTR Remains FALSE After Multiple Rejections ---');
        const ticket6Res = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Test Ticket for FTR Locking',
            priority: 'LOW',
        });
        const ticket6Id = ticket6Res.data.id;

        // Create and reject iteration 1
        await axios.post(`${API_URL}/tickets/${ticket6Id}/iterations`);
        await axios.post(`${API_URL}/tickets/${ticket6Id}/reject`, {
            approved_by: testApproverId,
            reason: 'First rejection',
        });

        // Reject iteration 2 (creates iteration 3)
        const reject2Res = await axios.post(`${API_URL}/tickets/${ticket6Id}/reject`, {
            approved_by: testApproverId,
            reason: 'Second rejection',
        });

        // Verify FTR is still FALSE
        if (reject2Res.data.ftr.first_time_right !== false) {
            throw new Error('FTR should remain FALSE after second rejection');
        }

        console.log('✅ FTR Correctly Locked to FALSE After Multiple Rejections');
        console.log('');

        // ==================== SUMMARY ====================
        console.log('='.repeat(50));
        console.log('✅ ALL ITERATIONS & APPROVALS TESTS PASSED! 🎉');
        console.log('='.repeat(50));
        console.log('Total Tests Run: 17');
        console.log('- Iteration Creation: ✅');
        console.log('- Iteration Retrieval: ✅');
        console.log('- Approval (Iteration 1, FTR = TRUE): ✅');
        console.log('- Rejection (Creates New Iteration, FTR = FALSE): ✅');
        console.log('- Multi-Iteration Approval (FTR Locked): ✅');
        console.log('- Validations (approved_by, iteration existence): ✅');
        console.log('- Edge Cases (non-existent tickets, duplicate operations): ✅');
        console.log('- FTR Locking (Permanent FALSE after rejection): ✅');
        console.log('='.repeat(50));
    } catch (error: any) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
        throw error;
    }
}

// Run the test
testIterationsAndApprovals()
    .then(() => {
        console.log('\n✅ Test suite completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test suite failed:', error.message);
        process.exit(1);
    });
