const { Client } = require('pg');

async function resetDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'your_password_here', // Update this with your actual password
    database: 'postgres' // Connect to default postgres database first
  });

  try {
    await client.connect();
    
    // Drop the choir_registry database if it exists
    await client.query('DROP DATABASE IF EXISTS choir_registry');
    console.log('✅ Dropped choir_registry database');
    
    // Create a fresh choir_registry database
    await client.query('CREATE DATABASE choir_registry');
    console.log('✅ Created fresh choir_registry database');
    
    await client.end();
    
    console.log('\n🎉 Database reset complete!');
    console.log('Now run: npm run migration:run');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    await client.end();
  }
}

resetDatabase();
