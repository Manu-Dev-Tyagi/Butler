import axios from 'axios';

const API_URL = 'http://localhost:3000';

let testUserId: string;
let testProjectId: string;
let testClientId: string;
let testTicketId: string;
let testIterationId: string;

async function testCommentsAndFiles() {
    console.log('🚀 Starting Comments & Files Integration Test...\n');

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

        // Create test ticket
        const ticketRes = await axios.post(`${API_URL}/tickets`, {
            project_id: testProjectId,
            title: 'Test Ticket for Comments & Files',
            description: 'Testing comments and file uploads',
            priority: 'HIGH',
        });
        testTicketId = ticketRes.data.id;
        console.log('✅ Test Ticket Created:', testTicketId);

        // Create iteration (required for file uploads)
        const iterationRes = await axios.post(`${API_URL}/tickets/${testTicketId}/iterations`);
        testIterationId = iterationRes.data.id;
        console.log('✅ Test Iteration Created:', testIterationId);

        console.log('');

        // ==================== COMMENTS TESTS ====================

        // TEST 1: Create Comment
        console.log('--- TEST 1: Create Comment ---');
        const comment1Res = await axios.post(`${API_URL}/tickets/${testTicketId}/comments`, {
            user_id: testUserId,
            content: 'This is a test comment',
        });
        console.log('✅ Comment Created:', comment1Res.data);
        if (!comment1Res.data.id) throw new Error('Comment should have an ID');
        if (comment1Res.data.content !== 'This is a test comment') throw new Error('Comment content mismatch');
        console.log('');

        // TEST 2: Create Another Comment
        console.log('--- TEST 2: Create Second Comment ---');
        const comment2Res = await axios.post(`${API_URL}/tickets/${testTicketId}/comments`, {
            user_id: testUserId,
            content: 'Another comment here',
        });
        console.log('✅ Second Comment Created:', comment2Res.data);
        console.log('');

        // TEST 3: Get All Comments for Ticket
        console.log('--- TEST 3: Get All Comments for Ticket ---');
        const getCommentsRes = await axios.get(`${API_URL}/tickets/${testTicketId}/comments`);
        console.log('✅ Comments Retrieved:', getCommentsRes.data.length);
        if (getCommentsRes.data.length !== 2) throw new Error('Should have exactly 2 comments');
        console.log('');

        // TEST 4: Validation - Create Comment Without user_id
        console.log('--- TEST 4: Validation - Comment Without user_id ---');
        try {
            await axios.post(`${API_URL}/tickets/${testTicketId}/comments`, {
                content: 'Missing user_id',
            });
            throw new Error('Should have failed without user_id');
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected comment without user_id');
            } else {
                throw error;
            }
        }
        console.log('');

        // TEST 5: Validation - Create Comment Without content
        console.log('--- TEST 5: Validation - Comment Without content ---');
        try {
            await axios.post(`${API_URL}/tickets/${testTicketId}/comments`, {
                user_id: testUserId,
            });
            throw new Error('Should have failed without content');
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected comment without content');
            } else {
                throw error;
            }
        }
        console.log('');

        // TEST 6: Validation - Comment with Empty content
        console.log('--- TEST 6: Validation - Comment with Empty content ---');
        try {
            await axios.post(`${API_URL}/tickets/${testTicketId}/comments`, {
                user_id: testUserId,
                content: '   ',
            });
            throw new Error('Should have failed with empty content');
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected comment with empty content');
            } else {
                throw error;
            }
        }
        console.log('');

        // TEST 7: Comment on Non-Existent Ticket
        console.log('--- TEST 7: Comment on Non-Existent Ticket ---');
        try {
            await axios.post(`${API_URL}/tickets/00000000-0000-0000-0000-000000000000/comments`, {
                user_id: testUserId,
                content: 'Should fail',
            });
            throw new Error('Should have failed for non-existent ticket');
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                console.log('✅ Correctly returned 404 for non-existent ticket');
            } else {
                throw error;
            }
        }
        console.log('');

        // ==================== FILES TESTS ====================

        // TEST 8: Upload File
        console.log('--- TEST 8: Upload File (Metadata Only) ---');
        const file1Res = await axios.post(`${API_URL}/files/upload`, {
            ticket_id: testTicketId,
            iteration_id: testIterationId,
            file_url: 'https://s3.amazonaws.com/bucket/file1.png',
            file_type: 'image/png',
            uploaded_by: testUserId,
        });
        console.log('✅ File Uploaded:', file1Res.data);
        if (!file1Res.data.id) throw new Error('File should have an ID');
        if (file1Res.data.file_url !== 'https://s3.amazonaws.com/bucket/file1.png') throw new Error('File URL mismatch');
        console.log('');

        // TEST 9: Upload Another File
        console.log('--- TEST 9: Upload Second File ---');
        const file2Res = await axios.post(`${API_URL}/files/upload`, {
            ticket_id: testTicketId,
            iteration_id: testIterationId,
            file_url: 'https://s3.amazonaws.com/bucket/file2.pdf',
            file_type: 'application/pdf',
            uploaded_by: testUserId,
        });
        console.log('✅ Second File Uploaded:', file2Res.data);
        console.log('');

        // TEST 10: Get All Files for Ticket
        console.log('--- TEST 10: Get All Files for Ticket ---');
        const getFilesRes = await axios.get(`${API_URL}/tickets/${testTicketId}/files`);
        console.log('✅ Files Retrieved:', getFilesRes.data.length);
        if (getFilesRes.data.length !== 2) throw new Error('Should have exactly 2 files');
        // Verify uploader details are included
        if (!getFilesRes.data[0].uploader_name) throw new Error('Files should include uploader details');
        console.log('');

        // TEST 11: Validation - Upload Without ticket_id
        console.log('--- TEST 11: Validation - Upload Without ticket_id ---');
        try {
            await axios.post(`${API_URL}/files/upload`, {
                iteration_id: testIterationId,
                file_url: 'https://s3.amazonaws.com/bucket/file3.png',
                uploaded_by: testUserId,
            });
            throw new Error('Should have failed without ticket_id');
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected upload without ticket_id');
            } else {
                throw error;
            }
        }
        console.log('');

        // TEST 12: Validation - Upload Without iteration_id (CRITICAL RULE)
        console.log('--- TEST 12: Validation - Upload Without iteration_id (CRITICAL) ---');
        try {
            await axios.post(`${API_URL}/files/upload`, {
                ticket_id: testTicketId,
                file_url: 'https://s3.amazonaws.com/bucket/file4.png',
                uploaded_by: testUserId,
            });
            throw new Error('Should have failed without iteration_id (files must be linked to iteration)');
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected upload without iteration_id');
            } else {
                throw error;
            }
        }
        console.log('');

        // TEST 13: Validation - Upload Without file_url
        console.log('--- TEST 13: Validation - Upload Without file_url ---');
        try {
            await axios.post(`${API_URL}/files/upload`, {
                ticket_id: testTicketId,
                iteration_id: testIterationId,
                uploaded_by: testUserId,
            });
            throw new Error('Should have failed without file_url');
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected upload without file_url');
            } else {
                throw error;
            }
        }
        console.log('');

        // TEST 14: Validation - Upload Without uploaded_by
        console.log('--- TEST 14: Validation - Upload Without uploaded_by ---');
        try {
            await axios.post(`${API_URL}/files/upload`, {
                ticket_id: testTicketId,
                iteration_id: testIterationId,
                file_url: 'https://s3.amazonaws.com/bucket/file5.png',
            });
            throw new Error('Should have failed without uploaded_by');
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected upload without uploaded_by');
            } else {
                throw error;
            }
        }
        console.log('');

        // TEST 15: Upload for Non-Existent Ticket
        console.log('--- TEST 15: Upload for Non-Existent Ticket ---');
        try {
            await axios.post(`${API_URL}/files/upload`, {
                ticket_id: '00000000-0000-0000-0000-000000000000',
                iteration_id: testIterationId,
                file_url: 'https://s3.amazonaws.com/bucket/file6.png',
                uploaded_by: testUserId,
            });
            throw new Error('Should have failed for non-existent ticket');
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                console.log('✅ Correctly returned 404 for non-existent ticket');
            } else {
                throw error;
            }
        }
        console.log('');

        // TEST 16: Get Files for Non-Existent Ticket
        console.log('--- TEST 16: Get Files for Non-Existent Ticket ---');
        try {
            await axios.get(`${API_URL}/tickets/00000000-0000-0000-0000-000000000000/files`);
            throw new Error('Should have failed for non-existent ticket');
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                console.log('✅ Correctly returned 404 for non-existent ticket');
            } else {
                throw error;
            }
        }
        console.log('');

        // ==================== SUMMARY ====================
        console.log('='.repeat(50));
        console.log('✅ ALL COMMENTS & FILES TESTS PASSED! 🎉');
        console.log('='.repeat(50));
        console.log('Total Tests Run: 16');
        console.log('Comments Tests: 7');
        console.log('  - Comment Creation: ✅');
        console.log('  - Comment Retrieval: ✅');
        console.log('  - Validations: ✅');
        console.log('Files Tests: 9');
        console.log('  - File Upload (Metadata): ✅');
        console.log('  - File Retrieval (with uploader details): ✅');
        console.log('  - Iteration Linkage Enforcement: ✅');
        console.log('  - Validations: ✅');
        console.log('='.repeat(50));
    } catch (error: any) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
        throw error;
    }
}

// Run the test
testCommentsAndFiles()
    .then(() => {
        console.log('\n✅ Test suite completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test suite failed:', error.message);
        process.exit(1);
    });
