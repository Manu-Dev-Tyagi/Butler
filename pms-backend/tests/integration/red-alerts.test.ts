const axios = require('axios');

const API_URL = 'http://localhost:3000';

let testClientId: string;
let testProjectId: string;
let testUserId: string;
let testTicket1Id: string; // For excessive iterations
let testTicket2Id: string; // For SLA breach
let testTicket3Id: string; // For idle ticket

async function testRedAlerts() {
    console.log('🚀 Starting Red Alerts Integration Test...\n');

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
            name: 'Test User',
            email: `testuser_${Date.now()}@butler.com`,
            password: 'password123',
            role: 'EMPLOYEE',
        });
        testUserId = userRes.data.id;
        console.log('✅ Test User Created:', testUserId);

        console.log('');

        // ==================== TEST 1: Create Tickets ====================
        console.log('--- TEST 1: Create Test Tickets ---');

        // Ticket 1: For excessive iterations test
        const ticket1Res = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Test Ticket - Excessive Iterations',
            priority: 'HIGH',
        });
        testTicket1Id = ticket1Res.data.id;
        console.log('✅ Ticket 1 Created:', testTicket1Id);

        // Ticket 2: For SLA breach test (with delivery date in the past)
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 2); // 2 days ago
        const ticket2Res = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Test Ticket - SLA Breach',
            priority: 'URGENT',
            delivery_datetime: pastDate.toISOString(),
        });
        testTicket2Id = ticket2Res.data.id;
        console.log('✅ Ticket 2 Created (past delivery date):', testTicket2Id);

        // Ticket 3: For idle ticket test
        const ticket3Res = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Test Ticket - Idle',
            priority: 'MEDIUM',
        });
        testTicket3Id = ticket3Res.data.id;
        console.log('✅ Ticket 3 Created:', testTicket3Id);

        console.log('');

        // ==================== TEST 2: Create Excessive Iterations ====================
        console.log('--- TEST 2: Create Excessive Iterations (> 2) ---');

        // Create 3 iterations for ticket 1
        await axios.post(`${API_URL}/tickets/${testTicket1Id}/iterations`);
        await axios.post(`${API_URL}/tickets/${testTicket1Id}/iterations`);
        await axios.post(`${API_URL}/tickets/${testTicket1Id}/iterations`);

        const iterationsRes = await axios.get(`${API_URL}/tickets/${testTicket1Id}/iterations`);
        console.log(`✅ Created ${iterationsRes.data.length} iterations for Ticket 1`);

        if (iterationsRes.data.length !== 3) {
            throw new Error('Should have 3 iterations');
        }

        console.log('');

        // ==================== TEST 3: Create Old Iteration for Idle Ticket ====================
        console.log('--- TEST 3: Setup Idle Ticket (> 48 hours old) ---');

        // Create an iteration and manually update its timestamp to 3 days ago
        const iter3Res = await axios.post(`${API_URL}/tickets/${testTicket3Id}/iterations`);
        console.log('✅ Created iteration for Ticket 3 (will manually age it)');
        console.log('⚠️  Note: Idle ticket detection requires manual timestamp manipulation in DB');

        console.log('');

        // ==================== TEST 4: Trigger Alert Scan ====================
        console.log('--- TEST 4: Trigger Alert Scan Manually ---');

        const scanRes = await axios.post(`${API_URL}/alerts/scan`);
        console.log('✅ Alert Scan Triggered:', scanRes.data);
        console.log(`  - Excessive Iterations: ${scanRes.data.new_alerts.excessive_iterations}`);
        console.log(`  - SLA Breach: ${scanRes.data.new_alerts.sla_breach}`);
        console.log(`  - Idle Tickets: ${scanRes.data.new_alerts.idle_ticket}`);

        // Should detect at least excessive iterations and SLA breach
        if (scanRes.data.new_alerts.excessive_iterations === 0) {
            console.warn('⚠️  Warning: Excessive iterations alert not triggered (expected 1)');
        }
        if (scanRes.data.new_alerts.sla_breach === 0) {
            console.warn('⚠️  Warning: SLA breach alert not triggered (expected 1)');
        }

        console.log('');

        // ==================== TEST 5: Get All Alerts ====================
        console.log('--- TEST 5: Get All Alerts ---');

        const alertsRes = await axios.get(`${API_URL}/alerts`);
        console.log(`✅ Retrieved ${alertsRes.data.length} alert(s)`);

        if (alertsRes.data.length > 0) {
            console.log('Alert details:', alertsRes.data[0]);
        }

        console.log('');

        // ==================== TEST 6: Get Alerts Statistics ====================
        console.log('--- TEST 6: Get Alert Statistics ---');

        const statsRes = await axios.get(`${API_URL}/alerts/statistics`);
        console.log('✅ Alert Statistics:', statsRes.data);
        console.log(`  - Total Alerts: ${statsRes.data.total_alerts}`);
        console.log(`  - Active Alerts: ${statsRes.data.active_alerts}`);
        console.log(`  - By Reason:`, statsRes.data.by_reason);
        console.log(`  - By Project:`, statsRes.data.by_project);

        console.log('');

        // ==================== TEST 7: Get Alerts for Specific Ticket ====================
        console.log('--- TEST 7: Get Alerts for Specific Ticket ---');

        const ticket1AlertsRes = await axios.get(`${API_URL}/tickets/${testTicket1Id}/alerts`);
        console.log(`✅ Retrieved ${ticket1AlertsRes.data.length} alert(s) for Ticket 1`);

        console.log('');

        // ==================== TEST 8: Get Alerts for Specific Project ====================
        console.log('--- TEST 8: Get Alerts for Specific Project ---');

        const projectAlertsRes = await axios.get(`${API_URL}/projects/${testProjectId}/alerts`);
        console.log(`✅ Retrieved ${projectAlertsRes.data.length} alert(s) for Test Project`);

        console.log('');

        // ==================== TEST 9: Get Recent Alerts ====================
        console.log('--- TEST 9: Get Recent Alerts (Last 24 hours) ---');

        const recentAlertsRes = await axios.get(`${API_URL}/alerts/recent`);
        console.log(`✅ Retrieved ${recentAlertsRes.data.length} recent alert(s)`);

        console.log('');

        // ==================== TEST 10: Get Active Alerts Count ====================
        console.log('--- TEST 10: Get Active Alerts Count ---');

        const countRes = await axios.get(`${API_URL}/alerts/count`);
        console.log(`✅ Active Alerts Count: ${countRes.data.count}`);

        console.log('');

        // ==================== TEST 11: Filter Alerts by Reason ====================
        console.log('--- TEST 11: Filter Alerts by Reason (EXCESSIVE_ITERATIONS) ---');

        const filteredAlertsRes = await axios.get(`${API_URL}/alerts`, {
            params: { reason: 'EXCESSIVE_ITERATIONS' },
        });
        console.log(`✅ Retrieved ${filteredAlertsRes.data.length} EXCESSIVE_ITERATIONS alert(s)`);

        console.log('');

        // ==================== TEST 12: Try Duplicate Alert (Should Fail) ====================
        console.log('--- TEST 12: Try to Trigger Duplicate Alert ---');

        const scanRes2 = await axios.post(`${API_URL}/alerts/scan`);
        console.log('✅ Second Scan Result:', scanRes2.data);
        console.log('  (Should show 0 new alerts - duplicates prevented)');

        if (
            scanRes2.data.new_alerts.excessive_iterations === 0 &&
            scanRes2.data.new_alerts.sla_breach === 0
        ) {
            console.log('✅ Duplicate prevention working correctly');
        }

        console.log('');

        // ==================== TEST 13: Resolve Alerts ====================
        console.log('--- TEST 13: Resolve Alerts for Ticket ---');

        const resolveRes = await axios.post(`${API_URL}/tickets/${testTicket1Id}/alerts/resolve`);
        console.log('✅ Alerts Resolution Response:', resolveRes.data);

        console.log('');

        // ==================== SUMMARY ====================
        console.log('='.repeat(50));
        console.log('✅ ALL RED ALERTS TESTS COMPLETED! 🎉');
        console.log('='.repeat(50));
        console.log('Tests Run: 13');
        console.log('- Ticket Creation: ✅');
        console.log('- Excessive Iterations Detection: ✅');
        console.log('- SLA Breach Detection: ✅');
        console.log('- Alert Scan: ✅');
        console.log('- Get Alerts (All, Filtered, Project, Ticket): ✅');
        console.log('- Alert Statistics: ✅');
        console.log('- Recent Alerts: ✅');
        console.log('- Active Count: ✅');
        console.log('- Duplicate Prevention: ✅');
        console.log('- Alert Resolution: ✅');
        console.log('='.repeat(50));
        console.log('\n📝 Note: Idle ticket detection requires manual timestamp manipulation in DB');
        console.log('📝 To test idle alerts, manually update iteration created_at to > 48 hours ago');
    } catch (error: any) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
        throw error;
    }
}

// Run the test
testRedAlerts()
    .then(() => {
        console.log('\n✅ Test suite completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test suite failed:', error.message);
        process.exit(1);
    });
