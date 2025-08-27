// Database configuration helper for API endpoints
function getDatabaseUrl() {
  // Priority order for database URL
  const databaseUrl = 
    process.env.DATABASE_URL ||
    process.env.SUPABASE_POSTGRES_URL ||
    process.env.POSTGRES_URL;
    
  if (!databaseUrl) {
    throw new Error('No database URL configured. Please set DATABASE_URL, SUPABASE_POSTGRES_URL, or POSTGRES_URL');
  }
  
  return databaseUrl;
}

module.exports = { getDatabaseUrl };