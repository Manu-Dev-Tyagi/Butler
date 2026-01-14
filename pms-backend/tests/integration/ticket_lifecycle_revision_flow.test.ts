/**
 * Ticket Lifecycle Revision Flow Integration Test
 *
 * Tests the revision/rejection cycle:
 * CREATED → ASSIGNED → IN_PROGRESS → SUBMITTED → REVISION_REQUIRED → IN_PROGRESS → SUBMITTED → APPROVED → DELIVERED → CLOSED
 *
 * Validates:
 * - State transitions through revision cycle
 * - Iteration 1 created on first submit (outcome = PENDING)
 * - Iteration 1 outcome updated to REJECTED on revision request
 * - Iteration 2 created on second submit (outcome = PENDING)
 * - Iteration 2 outcome updated to APPROVED on approval
 * - FTR = FALSE (not first time right, took 2 iterations)
 * - Multiple iterations tracking
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test data
let testClientId: string;
let testProjectId: string;
let testEmployeeId: string;
let testPMId: string;
let testTicketId: string;
let testIteration1Id: string;
let testIteration2Id: string;
let testApprovalId: string;
let testFTRId: string;

async function testTicketLifecycleRevisionFlow() {
    console.log('🔄 Starting Ticket Lifecycle Revision Flow Test...\n');
    console.log('='.repeat(80));
    console.log('Testing: CREATED → ASSIGNED → IN_PROGRESS → SUBMITTED → REVISION_REQUIRED');
    console.log('         → IN_PROGRESS → SUBMITTED → APPROVED → DELIVERED → CLOSED');
    console.log('='.repeat(80) + '\n');

    const errors: string[] = [];
    const fixes: string[] = [];

    try {
        // ==================== SETUP ====================
        console.log('📋 SETUP: Creating Test Data');
        console.log('-'.repeat(80));

        // Create client
        const clientRes = await axios.post(`${API_URL}/clients`, {
            name: `Test Client Revision Flow ${Date.now()}`,
        });
        testClientId = clientRes.data.id;
        console.log('✅ Client created:', testClientId);

        // Create project
        const projectRes = await axios.post(`${API_URL}/projects`, {
            client_id: testClientId,
            name: `Test Project Revision Flow ${Date.now()}`,
        });
        testProjectId = projectRes.data.project.id;
        console.log('✅ Project created:', testProjectId);

        // Create employee user
        const employeeRes = await axios.post(`${API_URL}/users`, {
            name: 'Test Employee Revision',
            email: `employee_revision_${Date.now()}@butler.com`,
            password: 'password123',
            role: 'EMPLOYEE',
        });
        testEmployeeId = employeeRes.data.id;
        console.log('✅ Employee created:', testEmployeeId);

        // Create PM user (for approval/revision)
        const pmRes = await axios.post(`${API_URL}/users`, {
            name: 'Test PM Revision',
            email: `pm_revision_${Date.now()}@butler.com`,
            password: 'password123',
            role: 'PM',
        });
        testPMId = pmRes.data.id;
        console.log('✅ PM created:', testPMId);

        // Set delivery datetime
        const deliveryDatetime = new Date();
        deliveryDatetime.setDate(deliveryDatetime.getDate() + 7);

        // ==================== STEP 1: CREATED ====================
        console.log('\n📝 STEP 1: Creating Ticket (Status: CREATED)');
        console.log('-'.repeat(80));

        const createTicketRes = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Revision Flow Test Ticket',
            description: 'Testing ticket lifecycle with revisions',
            priority: 'HIGH',
            delivery_datetime: deliveryDatetime.toISOString(),
        });
        testTicketId = createTicketRes.data.id;

        if (createTicketRes.data.status !== 'CREATED') {
            errors.push(`❌ Expected status CREATED, got ${createTicketRes.data.status}`);
        } else {
            console.log(`✅ Ticket created with status: ${createTicketRes.data.status}`);
        }

        // ==================== STEP 2: ASSIGNED ====================
        console.log('\n👤 STEP 2: Assigning Ticket (Status: CREATED → ASSIGNED)');
        console.log('-'.repeat(80));

        await axios.post(`${API_URL}/tickets/${testTicketId}/assign`, {
            user_id: testEmployeeId,
        });

        const ticketAfterAssign = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        if (ticketAfterAssign.data.status !== 'ASSIGNED') {
            errors.push(`❌ Expected status ASSIGNED, got ${ticketAfterAssign.data.status}`);
        } else {
            console.log(`✅ Ticket status updated to: ${ticketAfterAssign.data.status}`);
        }

        // ==================== STEP 3: IN_PROGRESS (First time) ====================
        console.log('\n⚙️ STEP 3: Starting Work - First Attempt (Status: ASSIGNED → IN_PROGRESS)');
        console.log('-'.repeat(80));

        await axios.patch(`${API_URL}/tickets/${testTicketId}/status`, {
            status: 'IN_PROGRESS',
        });

        const ticketAfterStart = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        if (ticketAfterStart.data.status !== 'IN_PROGRESS') {
            errors.push(`❌ Expected status IN_PROGRESS, got ${ticketAfterStart.data.status}`);
        } else {
            console.log(`✅ Ticket status updated to: ${ticketAfterStart.data.status}`);
        }

        // ==================== STEP 4: SUBMITTED (First time) ====================
        console.log('\n📤 STEP 4: First Submission (Status: IN_PROGRESS → SUBMITTED)');
        console.log('-'.repeat(80));
        console.log('⚠️  Note: Iteration 1 should be created automatically');

        await axios.patch(`${API_URL}/tickets/${testTicketId}/status`, {
            status: 'SUBMITTED',
        });

        const ticketAfterSubmit1 = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        if (ticketAfterSubmit1.data.status !== 'SUBMITTED') {
            errors.push(`❌ Expected status SUBMITTED, got ${ticketAfterSubmit1.data.status}`);
        } else {
            console.log(`✅ Ticket status updated to: ${ticketAfterSubmit1.data.status}`);
        }

        // Validate: Iteration 1 created
        const iterationsAfterSubmit1 = await axios.get(`${API_URL}/tickets/${testTicketId}/iterations`);
        if (iterationsAfterSubmit1.data.length === 0) {
            errors.push(`❌ Expected iteration 1 to be created on first submit, but no iterations found`);
            fixes.push('BUG: Iteration is not created automatically when ticket transitions to SUBMITTED');
        } else if (iterationsAfterSubmit1.data[0].iteration_number !== 1) {
            errors.push(`❌ Expected iteration_number 1, got ${iterationsAfterSubmit1.data[0].iteration_number}`);
        } else if (iterationsAfterSubmit1.data[0].outcome !== 'PENDING') {
            errors.push(`❌ Expected iteration 1 outcome PENDING, got ${iterationsAfterSubmit1.data[0].outcome}`);
        } else {
            testIteration1Id = iterationsAfterSubmit1.data[0].id;
            console.log('✅ Iteration 1 created automatically with outcome: PENDING');
        }

        // ==================== STEP 5: REVISION_REQUIRED ====================
        console.log('\n❌ STEP 5: Requesting Revision (Status: SUBMITTED → REVISION_REQUIRED)');
        console.log('-'.repeat(80));
        console.log('⚠️  Note: Iteration 1 outcome should change to REJECTED');

        const revisionRes = await axios.post(`${API_URL}/tickets/${testTicketId}/revision`, {
            reviewer_id: testPMId,
            comments: 'Please fix the following issues: 1) Improve error handling, 2) Add unit tests',
        });

        // Validate: Status should be REVISION_REQUIRED
        const ticketAfterRevision = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        if (ticketAfterRevision.data.status !== 'REVISION_REQUIRED') {
            errors.push(`❌ Expected status REVISION_REQUIRED, got ${ticketAfterRevision.data.status}`);
            fixes.push('BUG: Status should change to REVISION_REQUIRED when revision is requested');
        } else {
            console.log(`✅ Ticket status updated to: ${ticketAfterRevision.data.status}`);
        }

        // Validate: Iteration 1 outcome should be REJECTED
        const iterationsAfterRevision = await axios.get(`${API_URL}/tickets/${testTicketId}/iterations`);
        const iteration1AfterRevision = iterationsAfterRevision.data.find((i: any) => i.iteration_number === 1);
        if (!iteration1AfterRevision) {
            errors.push(`❌ Iteration 1 not found after revision request`);
        } else if (iteration1AfterRevision.outcome !== 'REJECTED') {
            errors.push(`❌ Expected iteration 1 outcome REJECTED, got ${iteration1AfterRevision.outcome}`);
            fixes.push('BUG: Iteration outcome should change to REJECTED when revision is requested');
        } else {
            console.log('✅ Iteration 1 outcome updated to: REJECTED');
        }

        // Validate: Revision comments recorded
        if (!revisionRes.data.revision || !revisionRes.data.revision.comments) {
            errors.push(`❌ Revision comments not recorded`);
        } else {
            console.log('✅ Revision comments recorded');
        }

        // ==================== STEP 6: IN_PROGRESS (Second time) ====================
        console.log('\n⚙️ STEP 6: Resuming Work After Revision (Status: REVISION_REQUIRED → IN_PROGRESS)');
        console.log('-'.repeat(80));

        await axios.patch(`${API_URL}/tickets/${testTicketId}/status`, {
            status: 'IN_PROGRESS',
        });

        const ticketAfterResume = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        if (ticketAfterResume.data.status !== 'IN_PROGRESS') {
            errors.push(`❌ Expected status IN_PROGRESS after revision, got ${ticketAfterResume.data.status}`);
        } else {
            console.log(`✅ Ticket status updated to: ${ticketAfterResume.data.status}`);
        }

        // ==================== STEP 7: SUBMITTED (Second time) ====================
        console.log('\n📤 STEP 7: Second Submission (Status: IN_PROGRESS → SUBMITTED)');
        console.log('-'.repeat(80));
        console.log('⚠️  Note: Iteration 2 should be created automatically');

        await axios.patch(`${API_URL}/tickets/${testTicketId}/status`, {
            status: 'SUBMITTED',
        });

        const ticketAfterSubmit2 = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        if (ticketAfterSubmit2.data.status !== 'SUBMITTED') {
            errors.push(`❌ Expected status SUBMITTED, got ${ticketAfterSubmit2.data.status}`);
        } else {
            console.log(`✅ Ticket status updated to: ${ticketAfterSubmit2.data.status}`);
        }

        // Validate: Iteration 2 created
        const iterationsAfterSubmit2 = await axios.get(`${API_URL}/tickets/${testTicketId}/iterations`);
        if (iterationsAfterSubmit2.data.length !== 2) {
            errors.push(`❌ Expected 2 iterations after second submit, got ${iterationsAfterSubmit2.data.length}`);
            fixes.push('BUG: Iteration 2 is not created automatically on second submit after revision');
        } else {
            const iteration2 = iterationsAfterSubmit2.data.find((i: any) => i.iteration_number === 2);
            if (!iteration2) {
                errors.push(`❌ Iteration 2 not found`);
            } else if (iteration2.outcome !== 'PENDING') {
                errors.push(`❌ Expected iteration 2 outcome PENDING, got ${iteration2.outcome}`);
            } else {
                testIteration2Id = iteration2.id;
                console.log('✅ Iteration 2 created automatically with outcome: PENDING');
            }
        }

        // ==================== STEP 8: APPROVED ====================
        console.log('\n✅ STEP 8: Approving Ticket (Status: SUBMITTED → APPROVED)');
        console.log('-'.repeat(80));
        console.log('⚠️  Note: FTR should be FALSE since this is iteration 2');

        const approveRes = await axios.post(`${API_URL}/tickets/${testTicketId}/approve`, {
            approved_by: testPMId,
        });

        // Validate: Status should be APPROVED
        const ticketAfterApprove = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        if (ticketAfterApprove.data.status !== 'APPROVED') {
            errors.push(`❌ Expected status APPROVED, got ${ticketAfterApprove.data.status}`);
        } else {
            console.log(`✅ Ticket status updated to: ${ticketAfterApprove.data.status}`);
        }

        // Validate: Iteration 2 outcome should be APPROVED
        const iterationsAfterApprove = await axios.get(`${API_URL}/tickets/${testTicketId}/iterations`);
        const iteration2AfterApprove = iterationsAfterApprove.data.find((i: any) => i.iteration_number === 2);
        if (!iteration2AfterApprove) {
            errors.push(`❌ Iteration 2 not found after approval`);
        } else if (iteration2AfterApprove.outcome !== 'APPROVED') {
            errors.push(`❌ Expected iteration 2 outcome APPROVED, got ${iteration2AfterApprove.outcome}`);
        } else {
            console.log('✅ Iteration 2 outcome updated to: APPROVED');
        }

        // Validate: FTR should be FALSE (iteration 2 approved, not iteration 1)
        if (!approveRes.data.ftr) {
            errors.push(`❌ FTR record not created`);
            fixes.push('BUG: FTR record should be created even when FTR = FALSE');
        } else if (approveRes.data.ftr.first_time_right !== false) {
            errors.push(`❌ Expected FTR first_time_right to be FALSE (took 2 iterations), got ${approveRes.data.ftr.first_time_right}`);
            fixes.push('BUG: FTR should be FALSE when iteration > 1 is approved');
        } else {
            testFTRId = approveRes.data.ftr.id;
            console.log('✅ FTR = FALSE (took 2 iterations, not first time right)');
        }

        // Validate: Approval record created
        if (!approveRes.data.approval) {
            errors.push(`❌ Approval record not created`);
        } else {
            testApprovalId = approveRes.data.approval.id;
            console.log('✅ Approval record created');
        }

        // ==================== STEP 9: DELIVERED ====================
        console.log('\n📦 STEP 9: Marking as Delivered (Status: APPROVED → DELIVERED)');
        console.log('-'.repeat(80));

        await axios.patch(`${API_URL}/tickets/${testTicketId}/status`, {
            status: 'DELIVERED',
        });

        const ticketAfterDeliver = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        if (ticketAfterDeliver.data.status !== 'DELIVERED') {
            errors.push(`❌ Expected status DELIVERED, got ${ticketAfterDeliver.data.status}`);
        } else {
            console.log(`✅ Ticket status updated to: ${ticketAfterDeliver.data.status}`);
        }

        // ==================== STEP 10: CLOSED ====================
        console.log('\n🔒 STEP 10: Closing Ticket (Status: DELIVERED → CLOSED)');
        console.log('-'.repeat(80));

        await axios.patch(`${API_URL}/tickets/${testTicketId}/status`, {
            status: 'CLOSED',
        });

        const ticketAfterClose = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        if (ticketAfterClose.data.status !== 'CLOSED') {
            errors.push(`❌ Expected status CLOSED, got ${ticketAfterClose.data.status}`);
        } else {
            console.log(`✅ Ticket status updated to: ${ticketAfterClose.data.status}`);
        }

        // ==================== FINAL VALIDATION ====================
        console.log('\n🔍 FINAL VALIDATION: Checking Complete Revision Flow');
        console.log('-'.repeat(80));

        const finalTicket = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        const finalIterations = await axios.get(`${API_URL}/tickets/${testTicketId}/iterations`);

        // Validate: Final status is CLOSED
        if (finalTicket.data.status !== 'CLOSED') {
            errors.push(`❌ Final status should be CLOSED, got ${finalTicket.data.status}`);
        } else {
            console.log('✅ Final status is CLOSED');
        }

        // Validate: 2 iterations exist (revision flow)
        if (finalIterations.data.length !== 2) {
            errors.push(`❌ Expected 2 iterations (revision flow), got ${finalIterations.data.length}`);
        } else {
            console.log('✅ 2 iterations exist (revision flow)');
        }

        // Validate: Iteration 1 is REJECTED
        const finalIteration1 = finalIterations.data.find((i: any) => i.iteration_number === 1);
        if (!finalIteration1) {
            errors.push(`❌ Iteration 1 not found in final state`);
        } else if (finalIteration1.outcome !== 'REJECTED') {
            errors.push(`❌ Iteration 1 outcome should be REJECTED, got ${finalIteration1.outcome}`);
        } else {
            console.log('✅ Iteration 1 outcome is REJECTED');
        }

        // Validate: Iteration 2 is APPROVED
        const finalIteration2 = finalIterations.data.find((i: any) => i.iteration_number === 2);
        if (!finalIteration2) {
            errors.push(`❌ Iteration 2 not found in final state`);
        } else if (finalIteration2.outcome !== 'APPROVED') {
            errors.push(`❌ Iteration 2 outcome should be APPROVED, got ${finalIteration2.outcome}`);
        } else {
            console.log('✅ Iteration 2 outcome is APPROVED');
        }

        // Validate: FTR is FALSE
        const ftrRecord = await axios.get(`${API_URL}/tickets/${testTicketId}/ftr`);
        if (!ftrRecord.data) {
            errors.push(`❌ FTR record not found`);
        } else if (ftrRecord.data.first_time_right !== false) {
            errors.push(`❌ FTR should be FALSE, got ${ftrRecord.data.first_time_right}`);
        } else {
            console.log('✅ FTR record exists and first_time_right = FALSE');
        }

        // ==================== SUMMARY ====================
        console.log('\n' + '='.repeat(80));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(80));

        if (errors.length === 0) {
            console.log('✅ ALL TESTS PASSED!');
            console.log('\n✅ Revision Flow Confirmation:');
            console.log('   CREATED → ASSIGNED → IN_PROGRESS → SUBMITTED → REVISION_REQUIRED');
            console.log('   → IN_PROGRESS → SUBMITTED → APPROVED → DELIVERED → CLOSED');
            console.log('\n✅ Validations Passed:');
            console.log('   ✓ State transitions correct through revision cycle');
            console.log('   ✓ Iteration 1 created on first submit (outcome = PENDING → REJECTED)');
            console.log('   ✓ Iteration 2 created on second submit (outcome = PENDING → APPROVED)');
            console.log('   ✓ FTR = FALSE (not first time right, took 2 iterations)');
            console.log('   ✓ Revision comments captured');
            console.log('   ✓ Multiple iterations tracked correctly');
        } else {
            console.log(`❌ ${errors.length} ERROR(S) FOUND:\n`);
            errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }

        if (fixes.length > 0) {
            console.log('\n⚠️  FIXES NEEDED:\n');
            fixes.forEach((fix, index) => {
                console.log(`   ${index + 1}. ${fix}`);
            });
        }

        console.log('\n' + '='.repeat(80));

        return {
            success: errors.length === 0,
            errors,
            fixes,
            testData: {
                ticketId: testTicketId,
                iteration1Id: testIteration1Id,
                iteration2Id: testIteration2Id,
                approvalId: testApprovalId,
                ftrId: testFTRId,
            },
        };
    } catch (error: any) {
        console.error('\n❌ TEST FAILED WITH EXCEPTION:');
        console.error(error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
            console.error('Status:', error.response.status);
        }
        throw error;
    }
}

// Run the test
if (require.main === module) {
    testTicketLifecycleRevisionFlow()
        .then((result) => {
            if (result.success) {
                console.log('\n✅ Revision flow test completed successfully!');
                process.exit(0);
            } else {
                console.log('\n❌ Revision flow test completed with errors.');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('\n❌ Revision flow test crashed:', error);
            process.exit(1);
        });
}

export { testTicketLifecycleRevisionFlow };
