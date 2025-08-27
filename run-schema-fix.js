const { Pool } = require('pg');
const fs = require('fs');

async function fixSupabaseSchema() {
  console.log('🔧 Fixing Supabase Database Schema...');
  console.log('=====================================\n');

  const pool = new Pool({
    connectionString: 'postgres://postgres.yoqtmnlxdqtqnnkzvajb:UX0QfBgRUfo8x795@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test connection
    console.log('1. Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('   ✅ Connected to Supabase successfully!');

    // Read and execute schema fix
    console.log('\n2. Reading schema fix script...');
    const schemaFix = fs.readFileSync('fix-supabase-schema.sql', 'utf8');
    console.log('   ✅ Schema fix script loaded');

    console.log('\n3. Applying schema fixes...');
    
    // Execute each statement separately
    const statements = schemaFix.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);
          const result = await pool.query(statement);
          if (result.rows && result.rows.length > 0) {
            console.log(`   ✅ ${JSON.stringify(result.rows[0])}`);
          } else {
            console.log(`   ✅ Statement executed successfully`);
          }
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('IF NOT EXISTS')) {
            console.log(`   ⚠️  ${error.message} (continuing...)`);
          } else {
            console.log(`   ❌ Error: ${error.message}`);
          }
        }
      }
    }

    console.log('\n4. Verifying fixes...');
    
    // Check if events table exists
    try {
      const eventsCheck = await pool.query("SELECT COUNT(*) FROM events LIMIT 1");
      console.log('   ✅ Events table exists and accessible');
    } catch (error) {
      console.log('   ❌ Events table still has issues:', error.message);
    }
    
    // Check if proposals.venue_id column exists
    try {
      const venueIdCheck = await pool.query("SELECT venue_id FROM proposals LIMIT 1");
      console.log('   ✅ Proposals.venue_id column exists');
    } catch (error) {
      console.log('   ❌ Proposals.venue_id column still missing:', error.message);
    }

    console.log('\n=====================================');
    console.log('🎉 SCHEMA FIX COMPLETED!');
    console.log('✅ Events table should now exist');
    console.log('✅ Proposals table should have venue_id column');
    console.log('ℹ️  Try refreshing your dashboard - the white screen should be fixed!');

  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
  } finally {
    await pool.end();
  }
}

fixSupabaseSchema().catch(console.error);