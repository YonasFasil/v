const { Pool } = require('pg');
const { getDatabaseUrl } = require('../db-config.js');

// Get the configured notification email from IMAP settings
async function getNotificationEmail() {
  let pool;

  try {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      console.warn('No database URL - using default notification email');
      return 'notification@venuine.com';
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    // Get the configured IMAP email
    const result = await pool.query(
      'SELECT email FROM imap_config WHERE enabled = true LIMIT 1'
    );

    if (result.rows.length > 0) {
      return result.rows[0].email;
    }

    // Fallback to default
    return 'notification@venuine.com';

  } catch (error) {
    console.warn('Failed to get notification email from database:', error.message);
    return 'notification@venuine.com';
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

module.exports = { getNotificationEmail };