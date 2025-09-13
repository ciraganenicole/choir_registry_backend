const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testEndpoints() {
  console.log('Testing API endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health endpoint:', healthResponse.data);

    // Test root endpoint
    console.log('\n2. Testing root endpoint...');
    const rootResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Root endpoint:', rootResponse.data);

    // Test auth login endpoint (should return 400 for missing credentials)
    console.log('\n3. Testing auth login endpoint...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {});
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Auth login endpoint is accessible (returned 400 as expected for invalid data)');
      } else {
        console.log('❌ Auth login endpoint error:', error.message);
      }
    }

    // Test users endpoint (should return 401 for missing auth)
    console.log('\n4. Testing users endpoint...');
    try {
      await axios.get(`${BASE_URL}/users`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Users endpoint is accessible (returned 401 as expected for missing auth)');
      } else {
        console.log('❌ Users endpoint error:', error.message);
      }
    }

    // Test debug endpoint
    console.log('\n5. Testing debug endpoint...');
    try {
      const debugResponse = await axios.get(`${BASE_URL}/debug/data`);
      console.log('✅ Debug endpoint:', debugResponse.data);
    } catch (error) {
      console.log('❌ Debug endpoint error:', error.message);
    }

    console.log('\n🎉 API server is running and endpoints are accessible!');
    console.log('\nAvailable endpoints:');
    console.log('- GET  /health');
    console.log('- GET  /');
    console.log('- GET  /debug/data');
    console.log('- POST /auth/login');
    console.log('- GET  /users (requires auth)');
    console.log('- GET  /songs (requires auth)');
    console.log('- GET  /attendance (requires auth)');
    console.log('- GET  /transactions (requires auth)');
    console.log('- GET  /leadership-shifts (requires auth)');

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
    console.log('\nMake sure your server is running with: npm run start:dev');
  }
}

testEndpoints(); 