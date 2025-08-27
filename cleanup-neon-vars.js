// Script to clean up old Neon environment variables from Vercel
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const neonVars = [
  'NEON_PROJECT_ID',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL', 
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_URL_NO_SSL',
  'POSTGRES_HOST',
  'POSTGRES_PASSWORD',
  'POSTGRES_USER',
  'POSTGRES_DATABASE',
  'PGHOST',
  'PGHOST_UNPOOLED',
  'PGUSER',
  'PGPASSWORD',
  'PGDATABASE',
  'DATABASE_URL_UNPOOLED'
];

async function cleanupNeonVars() {
  console.log('🧹 Cleaning up old Neon environment variables...\n');
  
  for (const varName of neonVars) {
    try {
      console.log(`Removing ${varName}...`);
      // First check if it exists
      const { stdout } = await execAsync(`vercel env ls --json`);
      const envVars = JSON.parse(stdout);
      const varExists = envVars.some(env => env.name === varName);
      
      if (varExists) {
        // Remove from all environments 
        await execAsync(`echo "y" | vercel env rm ${varName} production`).catch(() => {});
        await execAsync(`echo "y" | vercel env rm ${varName} preview`).catch(() => {});
        await execAsync(`echo "y" | vercel env rm ${varName} development`).catch(() => {});
        console.log(`  ✅ Removed ${varName}`);
      } else {
        console.log(`  ⏭️  ${varName} not found`);
      }
    } catch (error) {
      console.log(`  ❌ Failed to remove ${varName}: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Cleanup completed!');
}

cleanupNeonVars().catch(console.error);