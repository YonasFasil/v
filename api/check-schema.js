const { Pool } = require('pg');
const { getDatabaseUrl } = require('./db-config.js');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
      return res.status(500).json({ message: 'Database not configured' });
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    // Get the actual columns of the proposals table
    const columnsQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'proposals'
      ORDER BY ordinal_position
    `);

    console.log('Proposals table columns:', columnsQuery.rows);

    return res.status(200).json({
      table: 'proposals',
      columns: columnsQuery.rows.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES'
      }))
    });

  } catch (error) {
    console.error('Schema check error:', error);
    return res.status(500).json({
      error: 'Failed to check schema',
      message: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}