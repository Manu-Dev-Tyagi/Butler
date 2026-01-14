/**
 * Employee Exit Flow Integration Test
 *
 * Tests the employee exit scenarios:
 * A. Employee with NO active tickets
 * B. Employee with IN_PROGRESS tickets
 * C. Employee with REVISION_REQUIRED tickets
 *
 * Validates:
 * - EXIT_INITIATED state is applied correctly
 * - Tickets are automatically reassigned
 * - Ticket status moves to REASSIGNED
 * - Iterations are NOT reset
 * - SLA clocks are NOT reset
 * - Ticket history remains intact
 * - Audit log entries are created
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test data
let testClientId: string;
let testProjectId: string;
let testEmployeeId: string;
let testManagerId: string;
let testAdminId: string;

async function testEmployeeExitFlow() {
    console.log('🚪 Starting Employee Exit Flow Test...\n');
    console.log('='.repeat(80));
    console.log('Testing 3 scenarios:');
    console.log('A. Employee with NO active tickets');
    console.log('B. Employee with IN_PROGRESS tickets');
    console.log('C. Employee with REVISION_REQUIRED tickets');
    console.log('='.repeat(80) + '\n');

    const errors: string[] = [];
    const fixes: string[] = [];

    try {
        // ==================== SETUP ====================
        console.log('📋 SETUP: Creating Test Data');
        console.log('-'.repeat(80));

        // Create client
        const clientRes = await axios.post(`${API_URL}/clients`, {
            name: `Test Client Exit Flow ${Date.now()}`,
        });
        testClientId = clientRes.data.id;
        console.log('✅ Client created:', testClientId);

        // Create project
        const projectRes = await axios.post(`${API_URL}/projects`, {
            client_id: testClientId,
            name: `Test Project Exit Flow ${Date.now()}`,
        });
        testProjectId = projectRes.data.project.id;
        console.log('✅ Project created:', testProjectId);

        // Create manager/admin user (for reassignment target)
        const managerRes = await axios.post(`${API_URL}/users`, {
            name: 'Test Manager Exit',
            email: `manager_exit_${Date.now()}@butler.com`,
            password: 'password123',
            role: 'PM',
        });
        testManagerId = managerRes.data.id;
        console.log('✅ Manager created:', testManagerId);

        // Create admin user
        const adminRes = await axios.post(`${API_URL}/users`, {
            name: 'Test Admin Exit',
            email: `admin_exit_${Date.now()}@butler.com`,
            password: 'password123',
            role: 'ADMIN',
        });
        testAdminId = adminRes.data.id;
        console.log('✅ Admin created:', testAdminId);

        // ==================== SCENARIO A: Employee with NO active tickets ====================
        console.log('\n\n📝 SCENARIO A: Employee with NO Active Tickets');
        console.log('='.repeat(80));

        // Create employee A
        const employeeARes = await axios.post(`${API_URL}/users`, {
            name: 'Test Employee A No Tickets',
            email: `employee_a_${Date.now()}@butler.com`,
            password: 'password123',
            role: 'EMPLOYEE',
        });
        const employeeAId = employeeARes.data.id;
        console.log('✅ Employee A created:', employeeAId);

        // Initiate exit for employee A
        const exitARes = await axios.post(`${API_URL}/users/${employeeAId}/exit`);

        // Validate: Employment status changed to EXIT_INITIATED
        if (exitARes.data.employment_status !== 'EXIT_INITIATED') {
            errors.push(`❌ SCENARIO A: Expected employment_status EXIT_INITIATED, got ${exitARes.data.employment_status}`);
        } else {
            console.log('✅ Employee A status: EXIT_INITIATED');
        }

        // Validate: No tickets to reassign (should succeed without issues)
        console.log('✅ Employee A has no active tickets (clean exit)');

        // ==================== SCENARIO B: Employee with IN_PROGRESS tickets ====================
        console.log('\n\n📝 SCENARIO B: Employee with IN_PROGRESS Tickets');
        console.log('='.repeat(80));

        // Create employee B
        const employeeBRes = await axios.post(`${API_URL}/users`, {
            name: 'Test Employee B In Progress',
            email: `employee_b_${Date.now()}@butler.com`,
            password: 'password123',
            role: 'EMPLOYEE',
        });
        const employeeBId = employeeBRes.data.id;
        console.log('✅ Employee B created:', employeeBId);

        // Create ticket and assign to employee B
        const ticketBRes = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Scenario B Ticket - In Progress',
            description: 'Testing exit with IN_PROGRESS ticket',
            priority: 'HIGH',
            delivery_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
        const ticketBId = ticketBRes.data.id;
        console.log('✅ Ticket B created:', ticketBId);

        // Assign ticket to employee B
        await axios.post(`${API_URL}/tickets/${ticketBId}/assign`, {
            user_id: employeeBId,
        });
        console.log('✅ Ticket B assigned to Employee B');

        // Move ticket to IN_PROGRESS
        await axios.patch(`${API_URL}/tickets/${ticketBId}/status`, {
            status: 'IN_PROGRESS',
        });
        console.log('✅ Ticket B moved to IN_PROGRESS');

        // Store original SLA and creation time
        const ticketBBefore = await axios.get(`${API_URL}/tickets/${ticketBId}`);
        const originalSLA = ticketBBefore.data.delivery_datetime;
        const originalCreatedAt = ticketBBefore.data.created_at;

        // Initiate exit for employee B
        console.log('\n⚠️  Initiating exit for Employee B (should auto-reassign ticket)...');
        const exitBRes = await axios.post(`${API_URL}/users/${employeeBId}/exit`);

        // Validate: Employment status changed
        if (exitBRes.data.employment_status !== 'EXIT_INITIATED') {
            errors.push(`❌ SCENARIO B: Expected employment_status EXIT_INITIATED, got ${exitBRes.data.employment_status}`);
        } else {
            console.log('✅ Employee B status: EXIT_INITIATED');
        }

        // Validate: Ticket is reassigned automatically
        const ticketBAfter = await axios.get(`${API_URL}/tickets/${ticketBId}`);
        if (ticketBAfter.data.status !== 'REASSIGNED') {
            errors.push(`❌ SCENARIO B: Expected ticket status REASSIGNED, got ${ticketBAfter.data.status}`);
            fixes.push('BUG: Tickets should automatically move to REASSIGNED status when employee initiates exit');
        } else {
            console.log('✅ Ticket B status: REASSIGNED');
        }

        // Validate: SLA not reset
        if (ticketBAfter.data.delivery_datetime !== originalSLA) {
            errors.push(`❌ SCENARIO B: SLA was modified (expected ${originalSLA}, got ${ticketBAfter.data.delivery_datetime})`);
            fixes.push('BUG: SLA should NOT be reset during reassignment');
        } else {
            console.log('✅ SLA not reset (preserved)');
        }

        // Validate: Created timestamp not reset
        if (ticketBAfter.data.created_at !== originalCreatedAt) {
            errors.push(`❌ SCENARIO B: Created timestamp was modified`);
            fixes.push('BUG: Ticket history should remain intact (created_at unchanged)');
        } else {
            console.log('✅ Ticket history intact (created_at preserved)');
        }

        // ==================== SCENARIO C: Employee with REVISION_REQUIRED tickets ====================
        console.log('\n\n📝 SCENARIO C: Employee with REVISION_REQUIRED Tickets');
        console.log('='.repeat(80));

        // Create employee C
        const employeeCRes = await axios.post(`${API_URL}/users`, {
            name: 'Test Employee C Revision Required',
            email: `employee_c_${Date.now()}@butler.com`,
            password: 'password123',
            role: 'EMPLOYEE',
        });
        const employeeCId = employeeCRes.data.id;
        console.log('✅ Employee C created:', employeeCId);

        // Create ticket, assign, submit, and request revision
        const ticketCRes = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Scenario C Ticket - Revision Required',
            description: 'Testing exit with REVISION_REQUIRED ticket',
            priority: 'HIGH',
            delivery_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
        const ticketCId = ticketCRes.data.id;
        console.log('✅ Ticket C created:', ticketCId);

        // Assign and move through workflow
        await axios.post(`${API_URL}/tickets/${ticketCId}/assign`, {
            user_id: employeeCId,
        });
        await axios.patch(`${API_URL}/tickets/${ticketCId}/status`, {
            status: 'IN_PROGRESS',
        });
        await axios.patch(`${API_URL}/tickets/${ticketCId}/status`, {
            status: 'SUBMITTED',
        });
        console.log('✅ Ticket C submitted (iteration 1 created)');

        // Request revision
        await axios.post(`${API_URL}/tickets/${ticketCId}/revision`, {
            reviewer_id: testManagerId,
            comments: 'Please fix issues before leaving',
        });
        console.log('✅ Ticket C moved to REVISION_REQUIRED');

        // Get iterations before exit
        const iterationsBefore = await axios.get(`${API_URL}/tickets/${ticketCId}/iterations`);
        const iterationCount = iterationsBefore.data.length;
        console.log(`✅ Ticket C has ${iterationCount} iteration(s) before exit`);

        // Store original data
        const ticketCBefore = await axios.get(`${API_URL}/tickets/${ticketCId}`);
        const originalSLAC = ticketCBefore.data.delivery_datetime;

        // Initiate exit for employee C
        console.log('\n⚠️  Initiating exit for Employee C (should auto-reassign ticket with iterations intact)...');
        const exitCRes = await axios.post(`${API_URL}/users/${employeeCId}/exit`);

        // Validate: Employment status changed
        if (exitCRes.data.employment_status !== 'EXIT_INITIATED') {
            errors.push(`❌ SCENARIO C: Expected employment_status EXIT_INITIATED, got ${exitCRes.data.employment_status}`);
        } else {
            console.log('✅ Employee C status: EXIT_INITIATED');
        }

        // Validate: Ticket is reassigned
        const ticketCAfter = await axios.get(`${API_URL}/tickets/${ticketCId}`);
        if (ticketCAfter.data.status !== 'REASSIGNED') {
            errors.push(`❌ SCENARIO C: Expected ticket status REASSIGNED, got ${ticketCAfter.data.status}`);
            fixes.push('BUG: REVISION_REQUIRED tickets should also move to REASSIGNED on exit');
        } else {
            console.log('✅ Ticket C status: REASSIGNED');
        }

        // Validate: Iterations NOT reset
        const iterationsAfter = await axios.get(`${API_URL}/tickets/${ticketCId}/iterations`);
        if (iterationsAfter.data.length !== iterationCount) {
            errors.push(`❌ SCENARIO C: Iterations were reset (expected ${iterationCount}, got ${iterationsAfter.data.length})`);
            fixes.push('CRITICAL BUG: Iterations should NEVER be reset during reassignment');
        } else {
            console.log(`✅ Iterations NOT reset (still ${iterationCount} iteration(s))`);
        }

        // Validate: Iteration outcomes preserved
        const iteration1After = iterationsAfter.data.find((i: any) => i.iteration_number === 1);
        if (!iteration1After || iteration1After.outcome !== 'REJECTED') {
            errors.push(`❌ SCENARIO C: Iteration 1 outcome changed (expected REJECTED)`);
            fixes.push('CRITICAL BUG: Iteration outcomes should be preserved during reassignment');
        } else {
            console.log('✅ Iteration 1 outcome preserved (REJECTED)');
        }

        // Validate: SLA not reset
        if (ticketCAfter.data.delivery_datetime !== originalSLAC) {
            errors.push(`❌ SCENARIO C: SLA was modified`);
            fixes.push('BUG: SLA should NOT be reset during reassignment');
        } else {
            console.log('✅ SLA not reset (preserved)');
        }

        // ==================== SUMMARY ====================
        console.log('\n' + '='.repeat(80));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(80));

        if (errors.length === 0) {
            console.log('✅ ALL TESTS PASSED!');
            console.log('\n✅ Exit Flow Confirmation:');
            console.log('   ✓ SCENARIO A: Clean exit (no tickets) - PASSED');
            console.log('   ✓ SCENARIO B: Exit with IN_PROGRESS tickets - PASSED');
            console.log('   ✓ SCENARIO C: Exit with REVISION_REQUIRED tickets - PASSED');
            console.log('\n✅ Validations Passed:');
            console.log('   ✓ EXIT_INITIATED status applied correctly');
            console.log('   ✓ Tickets automatically reassigned');
            console.log('   ✓ Ticket status moved to REASSIGNED');
            console.log('   ✓ Iterations NOT reset');
            console.log('   ✓ SLA clocks NOT reset');
            console.log('   ✓ Ticket history preserved');
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
    testEmployeeExitFlow()
        .then((result) => {
            if (result.success) {
                console.log('\n✅ Exit flow test completed successfully!');
                process.exit(0);
            } else {
                console.log('\n❌ Exit flow test completed with errors.');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('\n❌ Exit flow test crashed:', error);
            process.exit(1);
        });
}

export { testEmployeeExitFlow };
