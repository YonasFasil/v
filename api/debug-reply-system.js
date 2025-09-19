const { Pool } = require('pg');
const { getDatabaseUrl } = require('./db-config.js');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let pool;
  try {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      return res.json({
        success: false,
        message: 'Database not configured',
        debug: { databaseUrl: false }
      });
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    // Check if communication_tokens table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'communication_tokens'
      );
    `;
    const tableExists = await pool.query(tableExistsQuery);

    // Get recent tokens
    let recentTokens = [];
    if (tableExists.rows[0].exists) {
      const tokensQuery = `
        SELECT token, tenant_id, record_type, record_id, customer_email,
               created_at, expires_at, thread_id
        FROM communication_tokens
        ORDER BY created_at DESC
        LIMIT 5
      `;
      const tokenResult = await pool.query(tokensQuery);
      recentTokens = tokenResult.rows;
    }

    // Get recent communications
    const communicationsQuery = `
      SELECT id, tenant_id, type, subject, sender, recipient,
             direction, sent_at, thread_id, reply_to_address
      FROM communications
      ORDER BY sent_at DESC
      LIMIT 5
    `;
    const communicationsResult = await pool.query(communicationsQuery);

    // Check environment variables
    const envCheck = {
      hasEmailAddress: !!process.env.GLOBAL_EMAIL_ADDRESS,
      hasEmailPassword: !!process.env.GLOBAL_EMAIL_PASSWORD,
      hasEmailHost: !!process.env.GLOBAL_EMAIL_HOST,
      hasEmailPort: !!process.env.GLOBAL_EMAIL_PORT,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET
    };

    return res.json({
      success: true,
      debug: {
        environment: envCheck,
        database: {
          connected: true,
          communicationTokensTableExists: tableExists.rows[0].exists,
          recentTokens: recentTokens.map(token => ({
            ...token,
            created_at: token.created_at?.toISOString(),
            expires_at: token.expires_at?.toISOString()
          })),
          recentCommunications: communicationsResult.rows.map(comm => ({
            ...comm,
            sent_at: comm.sent_at?.toISOString()
          }))
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}