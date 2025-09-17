const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function testEmailDirect() {
  try {
    console.log('🔍 Testing Email Configuration Directly...\n');

    // Test 1: Check if email config exists
    console.log('1️⃣ Checking email configuration in database...');
    const configResult = await pool.query(`
      SELECT setting_key, setting_value, created_at, updated_at
      FROM system_settings
      WHERE setting_key = 'email_config'
    `);

    let emailConfig = null;
    if (configResult.rows.length > 0) {
      emailConfig = JSON.parse(configResult.rows[0].setting_value);
      console.log('✅ Email config found:');
      console.log('   Provider:', emailConfig.provider);
      console.log('   Email:', emailConfig.email);
      console.log('   Enabled:', emailConfig.enabled);
      console.log('   Has Password:', emailConfig.password ? 'YES' : 'NO');
    } else {
      console.log('❌ No email config found. Creating test config...');

      // Create a test email config
      emailConfig = {
        provider: 'gmail',
        email: 'noreplyvenuine@gmail.com',
        password: 'fexb kdqo ygdo pmud', // Replace with actual app password
        enabled: true,
        smtp: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: 'noreplyvenuine@gmail.com',
            pass: 'fexb kdqo ygdo pmud'
          }
        },
        updatedAt: new Date().toISOString()
      };

      await pool.query(`
        INSERT INTO system_settings (setting_key, setting_value, created_at, updated_at)
        VALUES ('email_config', $1, NOW(), NOW())
        ON CONFLICT (setting_key)
        DO UPDATE SET setting_value = $1, updated_at = NOW()
      `, [JSON.stringify(emailConfig)]);

      console.log('✅ Test email config created');
    }

    // Test 2: Test nodemailer directly
    console.log('\n2️⃣ Testing nodemailer with configuration...');

    let nodemailer;
    try {
      nodemailer = require('nodemailer');
      console.log('✅ Nodemailer imported successfully');
    } catch (error) {
      console.log('❌ Failed to import nodemailer:', error.message);
      return;
    }

    if (!emailConfig.enabled) {
      console.log('❌ Email service is disabled in configuration');
      return;
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailConfig.email,
        pass: emailConfig.password
      }
    });

    console.log('✅ Transporter created successfully');

    // Test 3: Send actual test email
    console.log('\n3️⃣ Sending test email...');

    const mailOptions = {
      from: `"VenuinePro Test" <${emailConfig.email}>`,
      to: emailConfig.email, // Send to self for testing
      subject: 'VenuinePro Direct Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">🎉 Email Configuration Working!</h2>
          <p>This email was sent directly from the VenuinePro email configuration test.</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Configuration Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Provider:</strong> ${emailConfig.provider}</li>
              <li><strong>Email:</strong> ${emailConfig.email}</li>
              <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>

          <p style="color: #059669; font-weight: bold;">✅ Your email configuration is working correctly!</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This email confirms that VenuinePro can successfully send emails using your Gmail configuration.
          </p>
        </div>
      `,
      text: `
VenuinePro Direct Email Test

This email was sent directly from the VenuinePro email configuration test.

Configuration Details:
- Provider: ${emailConfig.provider}
- Email: ${emailConfig.email}
- Test Time: ${new Date().toLocaleString()}

✅ Your email configuration is working correctly!

This email confirms that VenuinePro can successfully send emails using your Gmail configuration.
      `
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);

    console.log('\n🎉 EMAIL SYSTEM IS WORKING CORRECTLY!');
    console.log('The issue is likely with the server endpoints, not the email configuration itself.');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);

    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication Error - Please check:');
      console.log('   1. Gmail account has 2-factor authentication enabled');
      console.log('   2. App password is generated correctly');
      console.log('   3. App password is copied without spaces');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection Error - Please check:');
      console.log('   1. Internet connection is working');
      console.log('   2. Firewall is not blocking SMTP port 587');
    }
  } finally {
    await pool.end();
  }
}

testEmailDirect();