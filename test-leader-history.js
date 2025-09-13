const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testLeaderHistory() {
  try {
    console.log('Testing leader history endpoint...');
    
    // First, let's test the health endpoint to make sure server is running
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.status);
    
    // Test the leader history endpoint
    const response = await axios.get(`${BASE_URL}/leadership-shifts/history`);
    console.log('✅ Leader history endpoint working:', response.status);
    console.log('📊 Data received:', response.data);
    
    if (Array.isArray(response.data)) {
      console.log(`📈 Found ${response.data.length} leaders in history`);
      response.data.forEach((leader, index) => {
        console.log(`  ${index + 1}. ${leader.leaderName} - Events: ${leader.totalEvents}, Completed: ${leader.totalEventsCompleted}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing leader history:', error.response?.status, error.response?.data);
    console.error('Full error:', error.message);
  }
}

testLeaderHistory(); 