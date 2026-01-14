import 'dotenv/config';
import axios, { AxiosInstance } from 'axios';
import { pool } from '@database/connection';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
let client: AxiosInstance;
let authToken: string;
let adminUserId: string;
let employeeUserId: string;
let testClientId: string;
let testProjectId: string;
let testSprintId: string;
let testTicketIds: string[] = [];

// ==================== TEST HARNESS ====================

type TestFn = () => Promise<void>;
const tests: { name: string; fn: TestFn }[] = [];

function describe(name: string, fn: () => void) {
    console.log(`\n📦 ${name}`);
    fn();
}

function test(name: string, fn: TestFn) {
    tests.push({ name, fn });
}

function expect(actual: any) {
    return {
        toBe(expected: any) {
            if (actual !== expected) {
                throw new Error(`Expected ${actual} to be ${expected}`);
            }
        },
        toBeDefined() {
            if (actual === undefined) {
                throw new Error(`Expected ${actual} to be defined`);
            }
        },
        toBeInstanceOf(expected: any) {
            if (!(actual instanceof expected)) {
                throw new Error(`Expected ${actual} to be instance of ${expected}`);
            }
        },
        toBeGreaterThan(expected: number) {
            if (actual <= expected) {
                throw new Error(`Expected ${actual} to be greater than ${expected}`);
            }
        },
        toBeGreaterThanOrEqual(expected: number) {
            if (actual < expected) {
                throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
            }
        },
        toBeLessThanOrEqual(expected: number) {
            if (actual > expected) {
                throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
            }
        },
        toContain(expected: string) {
            if (!actual.includes(expected)) {
                throw new Error(`Expected ${actual} to contain ${expected}`);
            }
        },
        toEqual(expected: any) {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
            }
        },
    };
}

// ==================== SETUP ====================

const beforeAll = async () => {
    console.log('🧪 Starting Analytics Integration Tests...');

    // Create axios instance
    client = axios.create({
        baseURL: API_BASE_URL,
        validateStatus: () => true, // Don't throw on any status
    });

    // Login as Admin
    const loginResponse = await client.post('/auth/login', {
        email: 'admin@butler.com',
        password: 'admin123',
    });
    authToken = loginResponse.data.token;
    adminUserId = loginResponse.data.user.id;

    // Set default auth header
    client.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // Create test employee
    const employeeResponse = await client.post('/users', {
        name: 'Analytics Test Employee',
        email: `analytics.employee.${Date.now()}@test.com`,
        password: 'password123',
        role: 'EMPLOYEE',
    });
    employeeUserId = employeeResponse.data.user.id;

    // Create test client
    const clientResponse = await client.post('/clients', {
        name: `Analytics Test Client ${Date.now()}`,
    });
    testClientId = clientResponse.data.client.id;

    // Create test project
    const projectResponse = await client.post('/projects', {
        client_id: testClientId,
        name: `Analytics Test Project ${Date.now()}`,
        status: 'ACTIVE',
    });
    testProjectId = projectResponse.data.project.id;

    // Create test sprint
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const sprintResponse = await client.post('/sprints', {
        name: `Analytics Test Sprint ${Date.now()}`,
        start_date: today.toISOString().split('T')[0],
        end_date: nextWeek.toISOString().split('T')[0],
    });
    testSprintId = sprintResponse.data.sprint.id;

    // Create multiple test tickets with different statuses and priorities
    const ticketConfigs = [
        { title: 'Test Ticket 1', status: 'CREATED', priority: 'HIGH' },
        { title: 'Test Ticket 2', status: 'ASSIGNED', priority: 'MEDIUM' },
        { title: 'Test Ticket 3', status: 'IN_PROGRESS', priority: 'LOW' },
        { title: 'Test Ticket 4', status: 'SUBMITTED', priority: 'URGENT' },
    ];

    for (const config of ticketConfigs) {
        const ticketResponse = await client.post('/tickets', {
            project_id: testProjectId,
            sprint_id: testSprintId,
            title: config.title,
            description: 'Test ticket for analytics',
            priority: config.priority,
        });
        const ticketId = ticketResponse.data.ticket.id;
        testTicketIds.push(ticketId);

        // Assign some tickets
        if (config.status !== 'CREATED') {
            await client.post(`/tickets/${ticketId}/assign`, {
                user_id: employeeUserId,
            });
        }
    }

    console.log('✅ Test data created successfully');
};

const afterAll = async () => {
    console.log('🧹 Cleaning up test data...');

    // Delete test tickets
    for (const ticketId of testTicketIds) {
        await pool.query('DELETE FROM ticket_assignments WHERE ticket_id = $1', [ticketId]);
        await pool.query('DELETE FROM ticket_iterations WHERE ticket_id = $1', [ticketId]);
        await pool.query('DELETE FROM ftr_metrics WHERE ticket_id = $1', [ticketId]);
        await pool.query('DELETE FROM tickets WHERE id = $1', [ticketId]);
    }

    // Delete test sprint
    if (testSprintId) {
        await pool.query('DELETE FROM sprints WHERE id = $1', [testSprintId]);
    }

    // Delete test project
    if (testProjectId) {
        await pool.query('DELETE FROM project_members WHERE project_id = $1', [testProjectId]);
        await pool.query('DELETE FROM project_pocs WHERE project_id = $1', [testProjectId]);
        await pool.query('DELETE FROM projects WHERE id = $1', [testProjectId]);
    }

    // Delete test client
    if (testClientId) {
        await pool.query('DELETE FROM clients WHERE id = $1', [testClientId]);
    }

    // Delete test employee
    if (employeeUserId) {
        await pool.query('DELETE FROM users WHERE id = $1', [employeeUserId]);
    }

    console.log('✅ Cleanup complete');
};

// ==================== TESTS ====================

describe('Analytics Integration Tests', () => {
    // ==================== OVERVIEW ANALYTICS ====================

    test('GET /analytics/overview should return system-wide analytics', async () => {
        const response = await client.get('/analytics/overview');

        expect(response.status).toBe(200);
        expect(response.data.status).toBe('success');
        expect(response.data.data).toBeDefined();

        const analytics = response.data.data;

        // Verify structure
        expect(analytics.summary).toBeDefined();
        expect(analytics.summary.total_tickets).toBeGreaterThan(0);
        expect(analytics.summary.total_projects).toBeGreaterThan(0);
        expect(analytics.summary.total_users).toBeGreaterThan(0);

        expect(analytics.ftr).toBeDefined();
        expect(analytics.ftr.percentage).toBeGreaterThanOrEqual(0);
        expect(analytics.ftr.percentage).toBeLessThanOrEqual(100);

        expect(analytics.resolution).toBeDefined();
        expect(analytics.resolution.avg_hours).toBeGreaterThanOrEqual(0);

        expect(analytics.iterations).toBeDefined();
        expect(analytics.iterations.avg_per_ticket).toBeGreaterThanOrEqual(0);

        expect(analytics.status_distribution).toBeInstanceOf(Array);
        expect(analytics.priority_distribution).toBeInstanceOf(Array);

        expect(analytics.recent_activity).toBeDefined();
        expect(analytics.recent_activity.tickets_created_today).toBeGreaterThanOrEqual(0);

        console.log('✅ Overview analytics structure validated');
    });

    test('GET /analytics/overview should include created test tickets in counts', async () => {
        const response = await client.get('/analytics/overview');

        expect(response.status).toBe(200);
        const analytics = response.data.data;

        // Our test tickets should be included
        expect(analytics.summary.total_tickets).toBeGreaterThanOrEqual(testTicketIds.length);
        expect(analytics.summary.active_tickets).toBeGreaterThan(0);

        console.log('✅ Test tickets counted in overview analytics');
    });

    test('GET /analytics/overview should have valid status distribution', async () => {
        const response = await client.get('/analytics/overview');

        expect(response.status).toBe(200);
        const statusDist = response.data.data.status_distribution;

        expect(statusDist).toBeInstanceOf(Array);
        expect(statusDist.length).toBeGreaterThan(0);

        // Check structure of each distribution item
        statusDist.forEach((item: any) => {
            expect(item.status).toBeDefined();
            expect(item.count).toBeGreaterThanOrEqual(0);
            expect(item.percentage).toBeGreaterThanOrEqual(0);
            expect(item.percentage).toBeLessThanOrEqual(100);
        });

        console.log('✅ Status distribution validated');
    });

    test('GET /analytics/overview should have valid priority distribution', async () => {
        const response = await client.get('/analytics/overview');

        expect(response.status).toBe(200);
        const priorityDist = response.data.data.priority_distribution;

        expect(priorityDist).toBeInstanceOf(Array);
        expect(priorityDist.length).toBeGreaterThan(0);

        // Check structure and order (URGENT > HIGH > MEDIUM > LOW)
        const priorities = priorityDist.map((item: any) => item.priority);
        const expectedOrder = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
        const foundPriorities = priorities.filter((p: string) => expectedOrder.includes(p));

        // Verify priorities are in correct order
        let lastIndex = -1;
        foundPriorities.forEach((priority: string) => {
            const currentIndex = expectedOrder.indexOf(priority);
            expect(currentIndex).toBeGreaterThan(lastIndex);
            lastIndex = currentIndex;
        });

        console.log('✅ Priority distribution validated and ordered correctly');
    });

    test('GET /analytics/overview should require authentication', async () => {
        const unauthClient = axios.create({
            baseURL: API_BASE_URL,
            validateStatus: () => true,
        });

        const response = await unauthClient.get('/analytics/overview');
        expect(response.status).toBe(401);

        console.log('✅ Authentication required for overview analytics');
    });

    // ==================== SPRINT ANALYTICS ====================

    test('GET /analytics/sprints/:sprintId should return sprint-specific analytics', async () => {
        const response = await client.get(`/analytics/sprints/${testSprintId}`);

        expect(response.status).toBe(200);
        expect(response.data.status).toBe('success');
        expect(response.data.data).toBeDefined();

        const analytics = response.data.data;

        // Verify sprint info
        expect(analytics.sprint).toBeDefined();
        expect(analytics.sprint.id).toBe(testSprintId);
        expect(analytics.sprint.name).toContain('Analytics Test Sprint');
        expect(analytics.sprint.days_total).toBeGreaterThan(0);
        expect(analytics.sprint.is_active).toBeDefined();

        // Verify tickets metrics
        expect(analytics.tickets).toBeDefined();
        expect(analytics.tickets.total).toBeGreaterThanOrEqual(testTicketIds.length);
        expect(analytics.tickets.completion_rate).toBeGreaterThanOrEqual(0);
        expect(analytics.tickets.completion_rate).toBeLessThanOrEqual(100);

        // Verify FTR metrics
        expect(analytics.ftr).toBeDefined();
        expect(analytics.ftr.percentage).toBeGreaterThanOrEqual(0);
        expect(analytics.ftr.percentage).toBeLessThanOrEqual(100);

        // Verify velocity
        expect(analytics.velocity).toBeDefined();
        expect(analytics.velocity.tickets_per_day).toBeGreaterThanOrEqual(0);
        expect(analytics.velocity.on_track).toBeDefined();

        // Verify team metrics
        expect(analytics.team).toBeDefined();
        expect(analytics.team.members_count).toBeGreaterThan(0);

        // Verify timeline
        expect(analytics.timeline).toBeInstanceOf(Array);

        console.log('✅ Sprint analytics structure validated');
    });

    test('GET /analytics/sprints/:sprintId should include test tickets in sprint', async () => {
        const response = await client.get(`/analytics/sprints/${testSprintId}`);

        expect(response.status).toBe(200);
        const analytics = response.data.data;

        // Our test tickets should be in this sprint
        expect(analytics.tickets.total).toBeGreaterThanOrEqual(testTicketIds.length);

        console.log('✅ Test tickets counted in sprint analytics');
    });

    test('GET /analytics/sprints/:sprintId should have valid timeline data', async () => {
        const response = await client.get(`/analytics/sprints/${testSprintId}`);

        expect(response.status).toBe(200);
        const timeline = response.data.data.timeline;

        expect(timeline).toBeInstanceOf(Array);

        // Each timeline entry should have proper structure
        timeline.forEach((entry: any) => {
            expect(entry.date).toBeDefined();
            expect(entry.tickets_completed).toBeGreaterThanOrEqual(0);
            expect(entry.cumulative_completed).toBeGreaterThanOrEqual(0);
        });

        console.log('✅ Timeline data validated');
    });

    test('GET /analytics/sprints/:sprintId should return 404 for non-existent sprint', async () => {
        const fakeSprintId = '00000000-0000-0000-0000-000000000000';
        const response = await client.get(`/analytics/sprints/${fakeSprintId}`);

        expect(response.status).toBe(404);
        expect(response.data.status).toBe('error');
        expect(response.data.message).toContain('not found');

        console.log('✅ 404 returned for non-existent sprint');
    });

    test('GET /analytics/sprints/:sprintId should require authentication', async () => {
        const unauthClient = axios.create({
            baseURL: API_BASE_URL,
            validateStatus: () => true,
        });

        const response = await unauthClient.get(`/analytics/sprints/${testSprintId}`);
        expect(response.status).toBe(401);

        console.log('✅ Authentication required for sprint analytics');
    });

    // ==================== USER ANALYTICS ====================

    test('GET /analytics/users should return users analytics with leaderboard', async () => {
        const response = await client.get('/analytics/users');

        expect(response.status).toBe(200);
        expect(response.data.status).toBe('success');
        expect(response.data.data).toBeDefined();

        const analytics = response.data.data;

        // Verify summary
        expect(analytics.summary).toBeDefined();
        expect(analytics.summary.total_users).toBeGreaterThan(0);
        expect(analytics.summary.active_users).toBeGreaterThan(0);
        expect(analytics.summary.avg_ftr).toBeGreaterThanOrEqual(0);
        expect(analytics.summary.avg_ftr).toBeLessThanOrEqual(100);

        // Verify leaderboard
        expect(analytics.leaderboard).toBeInstanceOf(Array);

        // Verify users array
        expect(analytics.users).toBeInstanceOf(Array);

        console.log('✅ Users analytics structure validated');
    });

    test('GET /analytics/users should have properly ranked leaderboard', async () => {
        const response = await client.get('/analytics/users');

        expect(response.status).toBe(200);
        const leaderboard = response.data.data.leaderboard;

        if (leaderboard.length > 0) {
            // Check leaderboard structure
            leaderboard.forEach((entry: any, index: number) => {
                expect(entry.user).toBeDefined();
                expect(entry.user.id).toBeDefined();
                expect(entry.user.name).toBeDefined();
                expect(entry.user.email).toBeDefined();

                expect(entry.metrics).toBeDefined();
                expect(entry.metrics.ftr_percentage).toBeGreaterThanOrEqual(0);
                expect(entry.metrics.tickets_completed).toBeGreaterThanOrEqual(0);
                expect(entry.metrics.rank).toBe(index + 1); // Rank should be sequential
            });

            console.log('✅ Leaderboard properly ranked');
        } else {
            console.log('⚠️  Leaderboard is empty (expected if no completed tickets)');
        }
    });

    test('GET /analytics/users/:userId should return individual user performance', async () => {
        const response = await client.get(`/analytics/users/${employeeUserId}`);

        expect(response.status).toBe(200);
        expect(response.data.status).toBe('success');
        expect(response.data.data).toBeDefined();

        const performance = response.data.data;

        // Verify user info
        expect(performance.user).toBeDefined();
        expect(performance.user.id).toBe(employeeUserId);
        expect(performance.user.name).toContain('Analytics Test Employee');

        // Verify tickets metrics
        expect(performance.tickets).toBeDefined();
        expect(performance.tickets.total_assigned).toBeGreaterThan(0); // We assigned tickets to this user
        expect(performance.tickets.completion_rate).toBeGreaterThanOrEqual(0);
        expect(performance.tickets.completion_rate).toBeLessThanOrEqual(100);

        // Verify FTR
        expect(performance.ftr).toBeDefined();
        expect(performance.ftr.percentage).toBeGreaterThanOrEqual(0);

        // Verify performance metrics
        expect(performance.performance).toBeDefined();
        expect(performance.performance.avg_resolution_hours).toBeGreaterThanOrEqual(0);
        expect(performance.performance.avg_iterations_per_ticket).toBeGreaterThanOrEqual(0);
        expect(performance.performance.active_streak_days).toBeGreaterThanOrEqual(0);

        // Verify recent tickets
        expect(performance.recent_tickets).toBeInstanceOf(Array);

        console.log('✅ Individual user performance validated');
    });

    test('GET /analytics/users/:userId should return 404 for non-existent user', async () => {
        const fakeUserId = '00000000-0000-0000-0000-000000000000';
        const response = await client.get(`/analytics/users/${fakeUserId}`);

        expect(response.status).toBe(404);
        expect(response.data.status).toBe('error');
        expect(response.data.message).toContain('not found');

        console.log('✅ 404 returned for non-existent user');
    });

    test('GET /analytics/users should require authentication', async () => {
        const unauthClient = axios.create({
            baseURL: API_BASE_URL,
            validateStatus: () => true,
        });

        const response = await unauthClient.get('/analytics/users');
        expect(response.status).toBe(401);

        console.log('✅ Authentication required for users analytics');
    });

    test('GET /analytics/users/:userId should require authentication', async () => {
        const unauthClient = axios.create({
            baseURL: API_BASE_URL,
            validateStatus: () => true,
        });

        const response = await unauthClient.get(`/analytics/users/${employeeUserId}`);
        expect(response.status).toBe(401);
        console.log('✅ Authentication required for individual user performance');
    });
});


// ==================== TEST RUNNER ====================

const runTests = async () => {
    try {
        await beforeAll();

        console.log('\n📊 Running Analytics Tests...\n');

        let passed = 0;
        let failed = 0;

        for (const { name, fn } of tests) {
            try {
                process.stdout.write(`Testing: ${name}... `);
                await fn();
                console.log('✅ PASS');
                passed++;
            } catch (error: any) {
                console.log('❌ FAIL');
                console.error(`\nError in "${name}":`);
                console.error(error.message || error);

                // Inspect axios error details if available
                if (error.response) {
                    console.error('Response Status:', error.response.status);
                    console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
                }
                failed++;
            }
        }

        console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed\n`);

        await afterAll();

        if (failed > 0) {
            process.exit(1);
        }
    } catch (error) {
        console.error('Test execution failed:', error);
        process.exit(1);
    }
};

// Run tests
runTests();
