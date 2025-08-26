require('dotenv/config');
const { neon } = require('@neondatabase/serverless');

// Use the Neon database URL
const sql = neon('postgres://neondb_owner:npg_nuIpDQGvW2h0@ep-super-poetry-adclvsy8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function testConnection() {
  try {
    console.log('🔍 Testing Neon database connection...');
    
    // Test basic connection
    const result = await sql`SELECT version(), current_database(), current_user`;
    console.log('✅ Connection successful!');
    console.log('Database info:', result[0]);
    
    // Check if basic tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'tenants', 'venues', 'bookings', 'subscription_packages')
      ORDER BY table_name
    `;
    
    console.log('🏗️  Existing tables:', tables.map(t => t.table_name));
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found. Database might need to be set up.');
    } else {
      console.log('✅ Tables exist. Database appears to be set up.');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();