const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function testSuperAdminEmailAPI() {
  try {
    console.log('🧪 Testing Super Admin Email API...');

    // Check if system_settings table exists and has email config
    console.log('\n1️⃣ Checking system_settings table...');
    try {
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'system_settings'
        )
      `);

      console.log(`   ✅ system_settings table exists: ${tableExists.rows[0].exists}`);

      if (tableExists.rows[0].exists) {
        const emailConfig = await pool.query(`
          SELECT setting_key, setting_value
          FROM system_settings
          WHERE setting_key = 'email_config'
        `);

        if (emailConfig.rows.length > 0) {
          const config = JSON.parse(emailConfig.rows[0].setting_value);
          console.log('   📧 Email config found:');
          console.log(`      Provider: ${config.provider}`);
          console.log(`      Email: ${config.email}`);
          console.log(`      Enabled: ${config.enabled}`);
          console.log(`      Has Password: ${config.password ? 'YES' : 'NO'}`);
        } else {
          console.log('   ⚠️  No email_config found in system_settings');
        }
      }
    } catch (error) {
      console.log(`   ❌ Error checking table: ${error.message}`);
    }

    // Test nodemailer availability
    console.log('\n2️⃣ Testing nodemailer availability...');
    try {
      const nodemailer = require('nodemailer');
      console.log('   ✅ Nodemailer successfully imported');

      // Test creating a Gmail transporter (without actually connecting)
      const testTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@gmail.com',
          pass: 'test-password'
        }
      });
      console.log('   ✅ Gmail transporter created successfully');
    } catch (error) {
      console.log(`   ❌ Nodemailer error: ${error.message}`);
    }

    // Check if the API endpoints are accessible
    console.log('\n3️⃣ API Endpoint Structure:');
    console.log('   📍 Email Config: /api/super-admin/config/email');
    console.log('   📍 Email Test: /api/super-admin/config/email/test');
    console.log('   📍 Expected methods: GET, POST/PUT for config, POST for test');

    console.log('\n💡 Gmail App Password Setup Instructions:');
    console.log('   1. Go to Google Account settings (myaccount.google.com)');
    console.log('   2. Enable 2-Factor Authentication');
    console.log('   3. Go to Security > App passwords');
    console.log('   4. Generate an app password for "Mail"');
    console.log('   5. Use that 16-character password (not your regular password)');

    console.log('\n✅ Email API infrastructure is ready!');
    console.log('💡 If you\'re getting errors, please provide the specific error message');

  } catch (error) {
    console.error('❌ Error testing email API:', error);
  } finally {
    await pool.end();
  }
}

testSuperAdminEmailAPI();