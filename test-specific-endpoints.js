const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testSpecificEndpoints() {
  console.log('Testing specific endpoints that might be affected by leadership shifts...\n');

  try {
    // First, let's try to login to get a token
    console.log('1. Testing login to get authentication token...');
    let token = null;
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@example.com',
        password: 'password123'
      });
      token = loginResponse.data.access_token;
      console.log('✅ Login successful, got token');
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
      console.log('Continuing with unauthenticated tests...');
    }

    // Test users endpoint with auth
    console.log('\n2. Testing users endpoint with authentication...');
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const usersResponse = await axios.get(`${BASE_URL}/users`, { headers });
      console.log('✅ Users endpoint working, found', usersResponse.data[0]?.length || 0, 'users');
    } catch (error) {
      console.log('❌ Users endpoint error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test leadership shifts endpoint
    console.log('\n3. Testing leadership shifts endpoint...');
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const shiftsResponse = await axios.get(`${BASE_URL}/leadership-shifts`, { headers });
      console.log('✅ Leadership shifts endpoint working, found', shiftsResponse.data[0]?.length || 0, 'shifts');
    } catch (error) {
      console.log('❌ Leadership shifts endpoint error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test songs endpoint
    console.log('\n4. Testing songs endpoint...');
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const songsResponse = await axios.get(`${BASE_URL}/songs`, { headers });
      console.log('✅ Songs endpoint working, found', songsResponse.data[0]?.length || 0, 'songs');
    } catch (error) {
      console.log('❌ Songs endpoint error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test performances endpoint
    console.log('\n5. Testing performances endpoint...');
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const performancesResponse = await axios.get(`${BASE_URL}/performances`, { headers });
      console.log('✅ Performances endpoint working, found', performancesResponse.data[0]?.length || 0, 'performances');
    } catch (error) {
      console.log('❌ Performances endpoint error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test attendance endpoint
    console.log('\n6. Testing attendance endpoint...');
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const attendanceResponse = await axios.get(`${BASE_URL}/attendance`, { headers });
      console.log('✅ Attendance endpoint working, found', attendanceResponse.data[0]?.length || 0, 'attendance records');
    } catch (error) {
      console.log('❌ Attendance endpoint error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test transactions endpoint
    console.log('\n7. Testing transactions endpoint...');
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const transactionsResponse = await axios.get(`${BASE_URL}/transactions`, { headers });
      console.log('✅ Transactions endpoint working, found', transactionsResponse.data[0]?.length || 0, 'transactions');
    } catch (error) {
      console.log('❌ Transactions endpoint error:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n🎯 Specific endpoint testing completed!');
    console.log('\nIf any endpoints are failing, the issue might be:');
    console.log('- Database connection problems');
    console.log('- Authentication/authorization issues');
    console.log('- Performance issues with large datasets');
    console.log('- Missing database migrations');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

testSpecificEndpoints(); 