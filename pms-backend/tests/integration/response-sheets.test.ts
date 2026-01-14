import 'dotenv/config';
import axios, { AxiosInstance } from 'axios';
import { pool } from '@database/connection';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
let client: AxiosInstance;
let authToken: string;
let testClientId: string;
let testProjectId: string;
let testUserId: string;
let testTicketId: string;
let testSheetId: string;

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
    console.log('🧪 Starting Response Sheets Integration Tests...');

    // Create axios instance
    client = axios.create({
        baseURL: API_BASE_URL,
        validateStatus: () => true,
    });

    // Login
    const loginResponse = await client.post('/auth/login', {
        email: 'admin@butler.com',
        password: 'admin123',
    });
    authToken = loginResponse.data.token;
    client.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // Create test data
    // 1. Create client
    const clientResponse = await client.post('/clients', {
        name: `Response Sheet Test Client ${Date.now()}`,
    });
    testClientId = clientResponse.data.client.id;

    // 2. Create project
    const projectResponse = await client.post('/projects', {
        client_id: testClientId,
        name: `Response Sheet Test Project ${Date.now()}`,
        status: 'ACTIVE',
        pocs: [{
            name: 'Test POC',
            email: 'poc@test.com',
            phone: '+1234567890'
        }]
    });
    testProjectId = projectResponse.data.project.id;

    // 3. Create user
    const userResponse = await client.post('/users', {
        name: 'Test User for Response Sheets',
        email: `rs.test.user.${Date.now()}@test.com`,
        password: 'password123',
        role: 'EMPLOYEE',
    });
    testUserId = userResponse.data.user.id;

    // 4. Add user to project
    await client.post(`/projects/${testProjectId}/members`, {
        user_id: testUserId,
    });

    // 5. Create test ticket
    const ticketResponse = await client.post('/tickets', {
        project_id: testProjectId,
        title: 'Test Ticket for Response Sheet',
        description: 'Test description',
        priority: 'HIGH',
    });
    testTicketId = ticketResponse.data.ticket.id;

    // 6. Assign ticket
    await client.post(`/tickets/${testTicketId}/assign`, {
        user_id: testUserId,
    });

    console.log('✅ Test data created successfully');
};

const afterAll = async () => {
    console.log('🧹 Cleaning up test data...');

    // Delete test sheet
    if (testSheetId) {
        await pool.query('DELETE FROM response_sheets WHERE id = $1', [testSheetId]);
    }

    // Delete ticket
    if (testTicketId) {
        await pool.query('DELETE FROM ticket_assignments WHERE ticket_id = $1', [testTicketId]);
        await pool.query('DELETE FROM tickets WHERE id = $1', [testTicketId]);
    }

    // Delete project
    if (testProjectId) {
        await pool.query('DELETE FROM project_members WHERE project_id = $1', [testProjectId]);
        await pool.query('DELETE FROM project_pocs WHERE project_id = $1', [testProjectId]);
        await pool.query('DELETE FROM projects WHERE id = $1', [testProjectId]);
    }

    // Delete client
    if (testClientId) {
        await pool.query('DELETE FROM clients WHERE id = $1', [testClientId]);
    }

    // Delete user
    if (testUserId) {
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }

    console.log('✅ Cleanup complete');
};

// ==================== TESTS ====================

describe('Response Sheets Integration Tests', () => {
    // ==================== GENERATE RESPONSE SHEET ====================

    test('POST /response-sheets should generate a new response sheet', async () => {
        const response = await client.post('/response-sheets', {
            project_id: testProjectId,
        });

        expect(response.status).toBe(201);
        expect(response.data.status).toBe('success');
        expect(response.data.data).toBeDefined();

        const sheet = response.data.data;
        testSheetId = sheet.id;

        expect(sheet.id).toBeDefined();
        expect(sheet.project_id).toBe(testProjectId);
        expect(sheet.generated_at).toBeDefined();
        expect(sheet.snapshot_data).toBeDefined();

        console.log('✅ Response sheet generated successfully:', sheet.id);
    });

    test('Generated sheet should have complete snapshot data', async () => {
        const response = await client.post('/response-sheets', {
            project_id: testProjectId,
        });

        const snapshot = response.data.data.snapshot_data;

        // Verify project info
        expect(snapshot.project).toBeDefined();
        expect(snapshot.project.id).toBe(testProjectId);
        expect(snapshot.project.name).toContain('Response Sheet Test Project');

        // Verify client info
        expect(snapshot.client).toBeDefined();
        expect(snapshot.client.id).toBe(testClientId);

        // Verify POCs
        expect(snapshot.pocs).toBeInstanceOf(Array);
        expect(snapshot.pocs.length).toBeGreaterThan(0);
        expect(snapshot.pocs[0].name).toBe('Test POC');

        // Verify team members
        expect(snapshot.team_members).toBeInstanceOf(Array);
        expect(snapshot.team_members.length).toBeGreaterThan(0);

        // Verify tickets
        expect(snapshot.tickets).toBeInstanceOf(Array);
        expect(snapshot.tickets.length).toBeGreaterThan(0);

        // Verify summary
        expect(snapshot.summary).toBeDefined();
        expect(snapshot.summary.total_tickets).toBeGreaterThan(0);
        expect(snapshot.summary.ftr_percentage).toBeGreaterThanOrEqual(0);

        console.log('✅ Snapshot data structure validated');
    });

    test('POST /response-sheets should require project_id', async () => {
        const response = await client.post('/response-sheets', {});

        expect(response.status).toBe(400);
        expect(response.data.status).toBe('error');
        expect(response.data.message).toContain('project_id');

        console.log('✅ Validation: project_id required');
    });

    test('POST /response-sheets should return 404 for non-existent project', async () => {
        const fakeProjectId = '00000000-0000-0000-0000-000000000000';
        const response = await client.post('/response-sheets', {
            project_id: fakeProjectId,
        });

        expect(response.status).toBe(404);
        expect(response.data.status).toBe('error');
        expect(response.data.message).toContain('not found');

        console.log('✅ 404 returned for non-existent project');
    });

    test('POST /response-sheets should require authentication', async () => {
        const unauthClient = axios.create({
            baseURL: API_BASE_URL,
            validateStatus: () => true,
        });

        const response = await unauthClient.post('/response-sheets', {
            project_id: testProjectId,
        });

        expect(response.status).toBe(401);

        console.log('✅ Authentication required for sheet generation');
    });

    // ==================== GET RESPONSE SHEET BY ID ====================

    test('GET /response-sheets/:id should return sheet by ID', async () => {
        // First create a sheet
        const createResponse = await client.post('/response-sheets', {
            project_id: testProjectId,
        });
        const sheetId = createResponse.data.data.id;

        // Then retrieve it
        const response = await client.get(`/response-sheets/${sheetId}`);

        expect(response.status).toBe(200);
        expect(response.data.status).toBe('success');
        expect(response.data.data).toBeDefined();

        const sheet = response.data.data;
        expect(sheet.id).toBe(sheetId);
        expect(sheet.project_id).toBe(testProjectId);
        expect(sheet.snapshot_data).toBeDefined();

        console.log('✅ Sheet retrieved by ID successfully');
    });

    test('GET /response-sheets/:id should return 404 for non-existent sheet', async () => {
        const fakeSheetId = '00000000-0000-0000-0000-000000000000';
        const response = await client.get(`/response-sheets/${fakeSheetId}`);

        expect(response.status).toBe(404);
        expect(response.data.status).toBe('error');
        expect(response.data.message).toContain('not found');

        console.log('✅ 404 returned for non-existent sheet');
    });

    // ==================== LIST RESPONSE SHEETS ====================

    test('GET /response-sheets should return all sheets', async () => {
        const response = await client.get('/response-sheets');

        expect(response.status).toBe(200);
        expect(response.data.status).toBe('success');
        expect(response.data.data).toBeInstanceOf(Array);

        console.log('✅ All sheets retrieved successfully');
    });

    test('GET /response-sheets?project_id=... should filter by project', async () => {
        // Create a sheet for this project
        await client.post('/response-sheets', {
            project_id: testProjectId,
        });

        const response = await client.get(`/response-sheets?project_id=${testProjectId}`);

        expect(response.status).toBe(200);
        expect(response.data.data).toBeInstanceOf(Array);
        expect(response.data.data.length).toBeGreaterThan(0);

        // All sheets should belong to this project
        response.data.data.forEach((sheet: any) => {
            expect(sheet.project_id).toBe(testProjectId);
        });

        console.log('✅ Sheets filtered by project successfully');
    });

    test('GET /response-sheets should return summary data', async () => {
        const response = await client.get(`/response-sheets?project_id=${testProjectId}`);

        expect(response.status).toBe(200);

        if (response.data.data.length > 0) {
            const sheet = response.data.data[0];

            expect(sheet.id).toBeDefined();
            expect(sheet.project_id).toBeDefined();
            expect(sheet.project_name).toBeDefined();
            expect(sheet.generated_at).toBeDefined();
            expect(sheet.total_tickets).toBeGreaterThanOrEqual(0);
            expect(sheet.completed_tickets).toBeGreaterThanOrEqual(0);
            expect(sheet.ftr_percentage).toBeGreaterThanOrEqual(0);
        }

        console.log('✅ Summary data structure validated');
    });

    // ==================== SEND RESPONSE SHEET ====================

    test('POST /response-sheets/:id/send should send sheet via email', async () => {
        // Create a sheet
        const createResponse = await client.post('/response-sheets', {
            project_id: testProjectId,
        });
        const sheetId = createResponse.data.data.id;

        // Send it
        const response = await client.post(`/response-sheets/${sheetId}/send`, {
            recipients: ['test@example.com', 'client@example.com'],
            subject: 'Test Subject',
            message: 'Test message',
        });

        expect(response.status).toBe(200);
        expect(response.data.status).toBe('success');
        expect(response.data.message).toContain('sent successfully');
        expect(response.data.data.sent_to).toEqual(['test@example.com', 'client@example.com']);

        console.log('✅ Sheet sent successfully');
    });

    test('POST /response-sheets/:id/send should require recipients', async () => {
        const createResponse = await client.post('/response-sheets', {
            project_id: testProjectId,
        });
        const sheetId = createResponse.data.data.id;

        const response = await client.post(`/response-sheets/${sheetId}/send`, {
            recipients: [],
        });

        expect(response.status).toBe(400);
        expect(response.data.status).toBe('error');
        expect(response.data.message).toContain('recipients');

        console.log('✅ Validation: recipients required');
    });

    test('POST /response-sheets/:id/send should validate email addresses', async () => {
        const createResponse = await client.post('/response-sheets', {
            project_id: testProjectId,
        });
        const sheetId = createResponse.data.data.id;

        const response = await client.post(`/response-sheets/${sheetId}/send`, {
            recipients: ['invalid-email', 'also-invalid'],
        });

        expect(response.status).toBe(400);
        expect(response.data.status).toBe('error');
        expect(response.data.message).toContain('Invalid email');

        console.log('✅ Email validation working');
    });

    test('POST /response-sheets/:id/send should return 404 for non-existent sheet', async () => {
        const fakeSheetId = '00000000-0000-0000-0000-000000000000';
        const response = await client.post(`/response-sheets/${fakeSheetId}/send`, {
            recipients: ['test@example.com'],
        });

        expect(response.status).toBe(404);
        expect(response.data.status).toBe('error');

        console.log('✅ 404 returned for non-existent sheet when sending');
    });

    test('Sent sheet should update sent_at and sent_to fields', async () => {
        // Create and send a sheet
        const createResponse = await client.post('/response-sheets', {
            project_id: testProjectId,
        });
        const sheetId = createResponse.data.data.id;

        await client.post(`/response-sheets/${sheetId}/send`, {
            recipients: ['test@example.com'],
        });

        // Retrieve it
        const getResponse = await client.get(`/response-sheets/${sheetId}`);
        const sheet = getResponse.data.data;

        expect(sheet.sent_at).toBeDefined();
        expect(sheet.sent_to).toEqual(['test@example.com']);

        console.log('✅ sent_at and sent_to fields updated correctly');
    });

    // ==================== SNAPSHOT IMMUTABILITY ====================

    test('Snapshot data should remain unchanged after retrieval', async () => {
        // Create a sheet
        const createResponse = await client.post('/response-sheets', {
            project_id: testProjectId,
        });
        const sheetId = createResponse.data.data.id;
        const originalSnapshot = createResponse.data.data.snapshot_data;

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 100));

        // Retrieve it
        const getResponse = await client.get(`/response-sheets/${sheetId}`);
        const retrievedSnapshot = getResponse.data.data.snapshot_data;

        // Snapshots should be identical
        expect(JSON.stringify(retrievedSnapshot)).toBe(JSON.stringify(originalSnapshot));

        console.log('✅ Snapshot immutability verified');
    });
});


// ==================== TEST RUNNER ====================

const runTests = async () => {
    try {
        await beforeAll();

        console.log('\n📋 Running Response Sheets Tests...\n');

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
