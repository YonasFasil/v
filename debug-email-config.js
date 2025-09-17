const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function debugEmailConfig() {
  try {
    console.log('🔍 Debugging Email Configuration...');

    // Check current email configuration in database
    console.log('\n1️⃣ Checking current email config in database...');
    try {
      const result = await pool.query(`
        SELECT setting_key, setting_value, created_at, updated_at
        FROM system_settings
        WHERE setting_key = 'email_config'
      `);

      if (result.rows.length > 0) {
        const config = JSON.parse(result.rows[0].setting_value);
        console.log('✅ Email config found:');
        console.log('   Created:', result.rows[0].created_at);
        console.log('   Updated:', result.rows[0].updated_at);
        console.log('   Provider:', config.provider);
        console.log('   Email:', config.email);
        console.log('   Enabled:', config.enabled);
        console.log('   Has Password:', config.password ? 'YES' : 'NO');
        console.log('   Password Length:', config.password ? config.password.length : 0);
      } else {
        console.log('❌ No email_config found in system_settings');
      }
    } catch (error) {
      console.log('❌ Error checking email config:', error.message);
    }

    // Test the GET endpoint
    console.log('\n2️⃣ Testing GET /api/super-admin/config/email...');
    try {
      const fetch = require('node-fetch');
      const response = await fetch('http://localhost:5000/api/super-admin/config/email', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.log('❌ Error testing GET endpoint:', error.message);
    }

    // Test the POST endpoint with sample data
    console.log('\n3️⃣ Testing POST /api/super-admin/config/email/test...');
    try {
      const fetch = require('node-fetch');
      const response = await fetch('http://localhost:5000/api/super-admin/config/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testEmail: 'test@example.com'
        })
      });

      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.log('❌ Error testing POST endpoint:', error.message);
    }

  } catch (error) {
    console.error('❌ Error debugging email config:', error);
  } finally {
    await pool.end();
  }
}

debugEmailConfig();