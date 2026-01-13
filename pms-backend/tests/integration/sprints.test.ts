import axios from 'axios';

const API_URL = 'http://localhost:3000';

let testSprintId: string;

async function testSprints() {
    console.log('🚀 Starting Sprints Integration Test...\n');

    try {
        // ==================== SPRINT CREATION TESTS ====================
        console.log('--- 1. Creating Sprint (Valid) ---');
        const createSprintRes = await axios.post(`${API_URL}/sprints`, {
            name: `Sprint ${Date.now()}`,
            start_date: '2026-01-20',
            end_date: '2026-02-03',
        });
        testSprintId = createSprintRes.data.id;
        console.log('✅ Sprint Created:', testSprintId);
        console.log('   Name:', createSprintRes.data.name);
        console.log('   Start Date:', createSprintRes.data.start_date);
        console.log('   End Date:', createSprintRes.data.end_date);

        console.log('\n--- 2. Listing Sprints ---');
        const listSprintsRes = await axios.get(`${API_URL}/sprints`);
        const sprintFound = listSprintsRes.data.find((s: any) => s.id === testSprintId);
        if (sprintFound) console.log('✅ Sprint found in list');
        else throw new Error('Sprint not found in list');
        console.log('   Total Sprints:', listSprintsRes.data.length);

        console.log('\n--- 3. Getting Sprint by ID ---');
        const getSprintRes = await axios.get(`${API_URL}/sprints/${testSprintId}`);
        if (getSprintRes.data.id === testSprintId) {
            console.log('✅ Sprint retrieved by ID');
        } else {
            throw new Error('Sprint retrieval failed');
        }

        // ==================== VALIDATION TESTS ====================
        console.log('\n--- 4. Missing name Validation ---');
        try {
            await axios.post(`${API_URL}/sprints`, {
                start_date: '2026-03-01',
                end_date: '2026-03-15',
            });
            throw new Error('Should have rejected missing name');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Missing name correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 5. Missing start_date Validation ---');
        try {
            await axios.post(`${API_URL}/sprints`, {
                name: 'Invalid Sprint',
                end_date: '2026-03-15',
            });
            throw new Error('Should have rejected missing start_date');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Missing start_date correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 6. Missing end_date Validation ---');
        try {
            await axios.post(`${API_URL}/sprints`, {
                name: 'Invalid Sprint',
                start_date: '2026-03-01',
            });
            throw new Error('Should have rejected missing end_date');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Missing end_date correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 7. Empty name Validation ---');
        try {
            await axios.post(`${API_URL}/sprints`, {
                name: '',
                start_date: '2026-03-01',
                end_date: '2026-03-15',
            });
            throw new Error('Should have rejected empty name');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Empty name correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 8. Duplicate Sprint Name Validation ---');
        try {
            await axios.post(`${API_URL}/sprints`, {
                name: createSprintRes.data.name,
                start_date: '2026-04-01',
                end_date: '2026-04-15',
            });
            throw new Error('Should have rejected duplicate sprint name');
        } catch (error: any) {
            if (error.response?.status === 409) {
                console.log('✅ Duplicate sprint name correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 9. Invalid Date Format Validation ---');
        try {
            await axios.post(`${API_URL}/sprints`, {
                name: 'Invalid Date Sprint',
                start_date: 'not-a-date',
                end_date: '2026-03-15',
            });
            throw new Error('Should have rejected invalid date format');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ Invalid date format correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 10. end_date Before start_date Validation ---');
        try {
            await axios.post(`${API_URL}/sprints`, {
                name: 'Invalid Date Range Sprint',
                start_date: '2026-03-15',
                end_date: '2026-03-01',
            });
            throw new Error('Should have rejected end_date before start_date');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ end_date before start_date correctly rejected');
            } else {
                throw error;
            }
        }

        console.log('\n--- 11. end_date Equal to start_date Validation ---');
        try {
            await axios.post(`${API_URL}/sprints`, {
                name: 'Same Date Sprint',
                start_date: '2026-03-15',
                end_date: '2026-03-15',
            });
            throw new Error('Should have rejected end_date equal to start_date');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ end_date equal to start_date correctly rejected');
            } else {
                throw error;
            }
        }

        // ==================== NON-EXISTENT SPRINT TEST ====================
        console.log('\n--- 12. Getting Non-Existent Sprint ---');
        try {
            await axios.get(`${API_URL}/sprints/00000000-0000-0000-0000-000000000000`);
            throw new Error('Should have returned 404 for non-existent sprint');
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.log('✅ Non-existent sprint correctly returned 404');
            } else {
                throw error;
            }
        }

        // ==================== DATE FORMAT TESTS ====================
        console.log('\n--- 13. Creating Sprint with Different Date Format (ISO) ---');
        const isoSprintRes = await axios.post(`${API_URL}/sprints`, {
            name: `ISO Sprint ${Date.now()}`,
            start_date: '2026-05-01T00:00:00Z',
            end_date: '2026-05-15T00:00:00Z',
        });
        console.log('✅ Sprint created with ISO date format:', isoSprintRes.data.id);

        console.log('\n--- 14. Verifying Sprints are Ordered by start_date DESC ---');
        const orderedSprintsRes = await axios.get(`${API_URL}/sprints`);
        if (orderedSprintsRes.data.length >= 2) {
            const first = new Date(orderedSprintsRes.data[0].start_date);
            const second = new Date(orderedSprintsRes.data[1].start_date);
            if (first >= second) {
                console.log('✅ Sprints correctly ordered by start_date DESC');
            } else {
                throw new Error('Sprints not ordered correctly');
            }
        } else {
            console.log('✅ Not enough sprints to verify ordering (skipped)');
        }

        console.log('\n🎉 All Sprints tests passed!\n');
    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
        process.exit(1);
    }
}

testSprints();
