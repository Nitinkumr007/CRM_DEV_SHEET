const axios = require('axios');
const { strict: assert } = require('assert');

const BASE_URL = 'http://localhost:5500/api';
const USER_CODE = '600271';
const PASSWORD = '12345';

async function verify() {
    console.log('Starting Backend Verification...');

    try {
        // 1. Health Check
        console.log('1. Checking Health...');
        const healthRes = await axios.get(`${BASE_URL}/health`);
        assert.equal(healthRes.status, 200, 'Health check failed');
        console.log('✅ Health Check Passed');

        // 2. Login
        console.log('2. Logging In...');
        const loginRes = await axios.post(`${BASE_URL}/login`, {
            userCode: USER_CODE,
            password: PASSWORD
        });
        assert.equal(loginRes.status, 200, 'Login failed');
        const token = loginRes.data.token;
        assert.ok(token, 'No token received');
        console.log('✅ Login Passed');

        // 3. Fetch Tickets
        console.log('3. Fetching Tickets...');
        const ticketsRes = await axios.get(`${BASE_URL}/tickets`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        assert.equal(ticketsRes.status, 200, 'Fetch tickets failed');
        console.log(`✅ Fetch Tickets Passed (Count: ${ticketsRes.data.length})`);

        // 4. Fetch Masters (Status)
        console.log('4. Fetching Status Master...');
        const statusRes = await axios.get(`${BASE_URL}/masters/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        assert.equal(statusRes.status, 200, 'Fetch status failed');
        console.log(`✅ Fetch Status Master Passed (Count: ${statusRes.data.length})`);

        console.log('🎉 All Backend Tests Passed!');
    } catch (err) {
        console.error('❌ Verification Failed:', err.message);
        if (err.response) {
            console.error('Response Data:', err.response.data);
        }
        process.exit(1);
    }
}

verify();
