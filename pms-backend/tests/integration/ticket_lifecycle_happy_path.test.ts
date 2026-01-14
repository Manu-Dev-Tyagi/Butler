/**
 * Ticket Lifecycle Happy Path Integration Test
 * 
 * Tests the complete lifecycle:
 * CREATED → ASSIGNED → IN_PROGRESS → SUBMITTED → APPROVED → DELIVERED → CLOSED
 * 
 * Validates:
 * - State transitions
 * - Iteration creation (only at submit)
 * - FTR = TRUE for iteration 1
 * - SLA success
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test data
let testClientId: string;
let testProjectId: string;
let testEmployeeId: string;
let testPMId: string;
let testTicketId: string;
let testIterationId: string;
let testApprovalId: string;
let testFTRId: string;

// Helper function to wait a bit (for async operations)
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testTicketLifecycleHappyPath() {
    console.log('🚀 Starting Ticket Lifecycle Happy Path Test...\n');
    console.log('='.repeat(60));
    console.log('Testing: CREATED → ASSIGNED → IN_PROGRESS → SUBMITTED → APPROVED → DELIVERED → CLOSED');
    console.log('='.repeat(60) + '\n');

    const errors: string[] = [];
    const fixes: string[] = [];

    try {
        // ==================== SETUP ====================
        console.log('📋 SETUP: Creating Test Data');
        console.log('-'.repeat(60));

        // Create client
        const clientRes = await axios.post(`${API_URL}/clients`, {
            name: `Test Client Lifecycle ${Date.now()}`,
        });
        testClientId = clientRes.data.id;
        console.log('✅ Client created:', testClientId);

        // Create project
        const projectRes = await axios.post(`${API_URL}/projects`, {
            client_id: testClientId,
            name: `Test Project Lifecycle ${Date.now()}`,
        });
        testProjectId = projectRes.data.project.id;
        console.log('✅ Project created:', testProjectId);

        // Create employee user
        const employeeRes = await axios.post(`${API_URL}/users`, {
            name: 'Test Employee Lifecycle',
            email: `employee_lifecycle_${Date.now()}@butler.com`,
            password: 'password123',
            role: 'EMPLOYEE',
        });
        testEmployeeId = employeeRes.data.id;
        console.log('✅ Employee created:', testEmployeeId);

        // Create PM user (for approval)
        const pmRes = await axios.post(`${API_URL}/users`, {
            name: 'Test PM Lifecycle',
            email: `pm_lifecycle_${Date.now()}@butler.com`,
            password: 'password123',
            role: 'PM',
        });
        testPMId = pmRes.data.id;
        console.log('✅ PM created:', testPMId);

        // Set delivery datetime (for SLA validation)
        const deliveryDatetime = new Date();
        deliveryDatetime.setDate(deliveryDatetime.getDate() + 7); // 7 days from now

        // ==================== STEP 1: CREATED ====================
        console.log('\n📝 STEP 1: Creating Ticket (Status: CREATED)');
        console.log('-'.repeat(60));

        const createTicketRes = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Lifecycle Test Ticket',
            description: 'Testing complete ticket lifecycle',
            priority: 'HIGH',
            delivery_datetime: deliveryDatetime.toISOString(),
        });
        testTicketId = createTicketRes.data.id;

        // Validate: Status should be CREATED
        if (createTicketRes.data.status !== 'CREATED') {
            errors.push(`❌ Expected status CREATED, got ${createTicketRes.data.status}`);
        } else {
            console.log(`✅ Ticket created with status: ${createTicketRes.data.status}`);
        }

        // Validate: No iterations should exist yet
        const iterationsBeforeSubmit = await axios.get(`${API_URL}/tickets/${testTicketId}/iterations`);
        if (iterationsBeforeSubmit.data.length !== 0) {
            errors.push(`❌ Expected 0 iterations before submit, got ${iterationsBeforeSubmit.data.length}`);
        } else {
            console.log('✅ No iterations exist before submission (correct)');
        }

        // ==================== STEP 2: ASSIGNED ====================
        console.log('\n👤 STEP 2: Assigning Ticket (Status: CREATED → ASSIGNED)');
        console.log('-'.repeat(60));

        const assignRes = await axios.post(`${API_URL}/tickets/${testTicketId}/assign`, {
            user_id: testEmployeeId,
        });

        // Validate: Status should be ASSIGNED
        const ticketAfterAssign = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        if (ticketAfterAssign.data.status !== 'ASSIGNED') {
            errors.push(`❌ Expected status ASSIGNED after assignment, got ${ticketAfterAssign.data.status}`);
        } else {
            console.log(`✅ Ticket status updated to: ${ticketAfterAssign.data.status}`);
        }

        // Validate: Assignment exists
        if (!assignRes.data.assignment || assignRes.data.assignment.user_id !== testEmployeeId) {
            errors.push(`❌ Assignment not created correctly`);
        } else {
            console.log('✅ Ticket assigned to employee');
        }

        // ==================== STEP 3: IN_PROGRESS ====================
        console.log('\n⚙️ STEP 3: Starting Work (Status: ASSIGNED → IN_PROGRESS)');
        console.log('-'.repeat(60));

        const acceptRes = await axios.patch(`${API_URL}/tickets/${testTicketId}/status`, {
            status: 'IN_PROGRESS',
        });

        // Validate: Status should be IN_PROGRESS
        if (acceptRes.data.status !== 'IN_PROGRESS') {
            errors.push(`❌ Expected status IN_PROGRESS, got ${acceptRes.data.status}`);
        } else {
            console.log(`✅ Ticket status updated to: ${acceptRes.data.status}`);
        }

        // ==================== STEP 4: SUBMITTED ====================
        console.log('\n📤 STEP 4: Submitting Work (Status: IN_PROGRESS → SUBMITTED)');
        console.log('-'.repeat(60));
        console.log('⚠️  Note: Iteration 1 should be created automatically on submit');

        // Update status to SUBMITTED (this will auto-create iteration 1)
        const submitRes = await axios.patch(`${API_URL}/tickets/${testTicketId}/status`, {
            status: 'SUBMITTED',
        });

        // Validate: Status should be SUBMITTED
        if (submitRes.data.status !== 'SUBMITTED') {
            errors.push(`❌ Expected status SUBMITTED, got ${submitRes.data.status}`);
        } else {
            console.log(`✅ Ticket status updated to: ${submitRes.data.status}`);
        }

        // Validate: Iteration 1 should be created automatically
        const iterationsAfterSubmit = await axios.get(`${API_URL}/tickets/${testTicketId}/iterations`);
        if (iterationsAfterSubmit.data.length === 0) {
            errors.push(`❌ Expected iteration 1 to be created automatically on submit, but no iterations found`);
            fixes.push('BUG: Iteration 1 is not created automatically when ticket status changes to SUBMITTED. Need to add logic to create iteration on status change.');
        } else if (iterationsAfterSubmit.data[0].iteration_number !== 1) {
            errors.push(`❌ Expected iteration_number 1, got ${iterationsAfterSubmit.data[0].iteration_number}`);
        } else if (iterationsAfterSubmit.data[0].outcome !== 'PENDING') {
            errors.push(`❌ Expected iteration outcome PENDING, got ${iterationsAfterSubmit.data[0].outcome}`);
        } else {
            testIterationId = iterationsAfterSubmit.data[0].id;
            console.log('✅ Iteration 1 created automatically with outcome: PENDING');
        }

        // ==================== STEP 5: APPROVED ====================
        console.log('\n✅ STEP 5: Approving Ticket (Status: SUBMITTED → APPROVED)');
        console.log('-'.repeat(60));
        console.log('⚠️  Note: FTR should be TRUE since this is iteration 1');

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

        // Validate: Iteration outcome should be APPROVED
        const iterationsAfterApprove = await axios.get(`${API_URL}/tickets/${testTicketId}/iterations`);
        const iteration1 = iterationsAfterApprove.data.find((i: any) => i.iteration_number === 1);
        if (!iteration1) {
            errors.push(`❌ Iteration 1 not found after approval`);
        } else if (iteration1.outcome !== 'APPROVED') {
            errors.push(`❌ Expected iteration outcome APPROVED, got ${iteration1.outcome}`);
        } else {
            console.log('✅ Iteration 1 outcome updated to: APPROVED');
        }

        // Validate: FTR should be TRUE (iteration 1 approved)
        if (!approveRes.data.ftr) {
            errors.push(`❌ Expected FTR to be TRUE (iteration 1 approved), but FTR is FALSE`);
        } else if (approveRes.data.ftr.first_time_right !== true) {
            errors.push(`❌ Expected FTR first_time_right to be TRUE, got ${approveRes.data.ftr.first_time_right}`);
        } else {
            testFTRId = approveRes.data.ftr.id;
            console.log('✅ FTR = TRUE (iteration 1 approved)');
        }

        // Validate: Approval record created
        if (!approveRes.data.approval) {
            errors.push(`❌ Approval record not created`);
        } else {
            testApprovalId = approveRes.data.approval.id;
            console.log('✅ Approval record created');
        }

        // Validate: SLA success (delivery_datetime not crossed)
        const ticketFinal = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        const deliveryDate = new Date(ticketFinal.data.delivery_datetime);
        const now = new Date();
        if (deliveryDate < now) {
            errors.push(`❌ SLA breach: delivery_datetime (${deliveryDate}) is in the past`);
        } else {
            console.log('✅ SLA success: delivery_datetime not crossed');
        }

        // ==================== STEP 6: DELIVERED ====================
        console.log('\n📦 STEP 6: Marking as Delivered (Status: APPROVED → DELIVERED)');
        console.log('-'.repeat(60));

        const deliverRes = await axios.patch(`${API_URL}/tickets/${testTicketId}/status`, {
            status: 'DELIVERED',
        });

        // Validate: Status should be DELIVERED
        if (deliverRes.data.status !== 'DELIVERED') {
            errors.push(`❌ Expected status DELIVERED, got ${deliverRes.data.status}`);
        } else {
            console.log(`✅ Ticket status updated to: ${deliverRes.data.status}`);
        }

        // ==================== STEP 7: CLOSED ====================
        console.log('\n🔒 STEP 7: Closing Ticket (Status: DELIVERED → CLOSED)');
        console.log('-'.repeat(60));

        const closeRes = await axios.patch(`${API_URL}/tickets/${testTicketId}/status`, {
            status: 'CLOSED',
        });

        // Validate: Status should be CLOSED
        if (closeRes.data.status !== 'CLOSED') {
            errors.push(`❌ Expected status CLOSED, got ${closeRes.data.status}`);
        } else {
            console.log(`✅ Ticket status updated to: ${closeRes.data.status}`);
        }

        // ==================== FINAL VALIDATION ====================
        console.log('\n🔍 FINAL VALIDATION: Checking Complete Lifecycle');
        console.log('-'.repeat(60));

        const finalTicket = await axios.get(`${API_URL}/tickets/${testTicketId}`);
        const finalIterations = await axios.get(`${API_URL}/tickets/${testTicketId}/iterations`);

        // Validate: Final status is CLOSED
        if (finalTicket.data.status !== 'CLOSED') {
            errors.push(`❌ Final status should be CLOSED, got ${finalTicket.data.status}`);
        }

        // Validate: Only 1 iteration exists (happy path, no revisions)
        if (finalIterations.data.length !== 1) {
            errors.push(`❌ Expected 1 iteration (happy path), got ${finalIterations.data.length}`);
        } else {
            console.log('✅ Only 1 iteration exists (no revisions, happy path)');
        }

        // Validate: Iteration 1 is APPROVED
        if (finalIterations.data[0].outcome !== 'APPROVED') {
            errors.push(`❌ Final iteration outcome should be APPROVED, got ${finalIterations.data[0].outcome}`);
        } else {
            console.log('✅ Iteration 1 is APPROVED');
        }

        // ==================== SUMMARY ====================
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));

        if (errors.length === 0) {
            console.log('✅ ALL TESTS PASSED!');
            console.log('\n✅ Lifecycle Confirmation:');
            console.log('   CREATED → ASSIGNED → IN_PROGRESS → SUBMITTED → APPROVED → DELIVERED → CLOSED');
            console.log('\n✅ Validations Passed:');
            console.log('   ✓ State transitions correct');
            console.log('   ✓ Iteration 1 created automatically on submit');
            console.log('   ✓ FTR = TRUE (iteration 1 approved)');
            console.log('   ✓ SLA success (delivery_datetime not crossed)');
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

        console.log('\n' + '='.repeat(60));

        return {
            success: errors.length === 0,
            errors,
            fixes,
            testData: {
                ticketId: testTicketId,
                iterationId: testIterationId,
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
    testTicketLifecycleHappyPath()
        .then((result) => {
            if (result.success) {
                console.log('\n✅ Test completed successfully!');
                process.exit(0);
            } else {
                console.log('\n❌ Test completed with errors.');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('\n❌ Test crashed:', error);
            process.exit(1);
        });
}

export { testTicketLifecycleHappyPath };
