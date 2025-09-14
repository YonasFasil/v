module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    return res.json({
      success: true,
      message: 'Debug endpoint working',
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'NOT SET',
        hasSupabaseUrl: !!process.env.SUPABASE_POSTGRES_URL,
        hasPostgresUrl: !!process.env.POSTGRES_URL
      },
      query: req.query,
      method: req.method
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Debug failed',
      message: error.message
    });
  }
};