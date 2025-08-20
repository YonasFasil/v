import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const sql = neon(process.env.DATABASE_URL);

async function resetDatabase() {
  console.log('🗑️  Resetting Neon database...');

  try {
    // Drop all tables to start fresh
    console.log('Dropping existing tables...');
    
    await sql`DROP SCHEMA IF EXISTS public CASCADE`;
    await sql`CREATE SCHEMA public`;
    await sql`GRANT ALL ON SCHEMA public TO neondb_owner`;
    await sql`GRANT ALL ON SCHEMA public TO public`;
    
    console.log('✅ Database reset complete!');
    console.log('🚀 Now run: npm run db:push');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Reset script failed:', error);
  process.exit(1);
});