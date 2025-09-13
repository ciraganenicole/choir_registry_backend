const axios = require('axios');

async function testRehearsalCreation() {
  try {
    const response = await axios.post('http://localhost:4000/rehearsals', {
      title: 'Test Rehearsal',
      date: '2024-01-15T18:00:00Z',
      type: 'General Practice',
      performanceId: 1,
      rehearsalSongs: [
        {
          songId: 1,
          leadSingerId: 1,
          difficulty: 'Easy',
          needsWork: true,
          order: 1,
          timeAllocated: 30,
          focusPoints: 'The first verse and the last part',
          notes: 'The chorus is the easiest part; skip it today',
          musicalKey: 'C Major'
        }
      ]
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });

    console.log('Rehearsal created successfully:', response.data);
  } catch (error) {
    console.error('Error creating rehearsal:', error.response?.data || error.message);
  }
}

testRehearsalCreation();
