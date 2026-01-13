import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function testMasterData() {
    console.log('🚀 Starting Master Data (Departments) Test...');

    try {
        // 1. Create Department "Tech"
        console.log('\n--- 1. Creating Department "Tech" ---');
        const deptRes = await axios.post(`${API_URL}/departments`, { name: 'Tech' });
        const techDept = deptRes.data;
        console.log('✅ Department Created:', techDept.name, techDept.id);

        // 2. Create Sub-Departments (User Requested Tags)
        const subDepts = ['Frontend', 'Backend', 'Data Eng', 'QA', 'DevOps'];
        console.log(`\n--- 2. Creating Sub-Departments: ${subDepts.join(', ')} ---`);

        for (const name of subDepts) {
            const res = await axios.post(`${API_URL}/sub-departments`, {
                department_id: techDept.id,
                name: name
            });
            console.log(`   ✅ Created: ${res.data.name}`);
        }

        // 3. Verify Lists
        console.log('\n--- 3. Verifying Lists ---');
        const listDepts = await axios.get(`${API_URL}/departments`);
        const foundDept = listDepts.data.find((d: any) => d.id === techDept.id);
        if (!foundDept) throw new Error('Tech department not found in list');
        console.log('✅ Tech department found in list');

        const listSubDepts = await axios.get(`${API_URL}/sub-departments`);
        const createdSubDepts = listSubDepts.data.filter((s: any) => s.department_id === techDept.id);
        if (createdSubDepts.length === subDepts.length) {
            console.log(`✅ All ${subDepts.length} sub-departments found`);
        } else {
            throw new Error(`Expected ${subDepts.length} sub-departments, found ${createdSubDepts.length}`);
        }

        // 4. Create "VRD" Department & Sub-Departments
        console.log('\n--- 4. Creating Department "VRD" ---');
        const vrdRes = await axios.post(`${API_URL}/departments`, { name: 'VRD' });
        const vrdDept = vrdRes.data;
        console.log('✅ Department Created:', vrdDept.name);

        const vrdSubDepts = ['Client research'];
        for (const name of vrdSubDepts) {
            const res = await axios.post(`${API_URL}/sub-departments`, {
                department_id: vrdDept.id,
                name: name
            });
            console.log(`   ✅ Created: ${res.data.name}`);
        }

        // 5. Create "Digital" Department & Sub-Departments
        console.log('\n--- 5. Creating Department "Digital" ---');
        const digitalRes = await axios.post(`${API_URL}/departments`, { name: 'Digital' });
        const digitalDept = digitalRes.data;
        console.log('✅ Department Created:', digitalDept.name);

        const digitalSubDepts = ['Content', 'Design', 'SEO', 'Performance marketing', 'E commerce'];
        for (const name of digitalSubDepts) {
            const res = await axios.post(`${API_URL}/sub-departments`, {
                department_id: digitalDept.id,
                name: name
            });
            console.log(`   ✅ Created: ${res.data.name}`);
        }

        console.log('\n🎉 ALL MASTER DATA TESTS PASSED!');

    } catch (error: any) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

testMasterData();
