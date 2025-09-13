
const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

// The list of all migration files that should be marked as applied.
const migrations = [
  '0000_loose_robin_chapel',
  '0001_remove_subdomain',
  '001_add_tenant_isolation',
  '002_lockdown_roles',
  '003_enable_force_rls',
  '004_remove_custom_domain',
  '004_tenant_constraints',
  '005_admin_audit',
  '005_grants_for_app_role',
  '006_super_admin_role',
  '007_bootstrap_super_admin'
];

async function syncMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Error: DATABASE_URL is not set in .env.development');
    process.exit(1);
  }

  console.log('Connecting to the database...');
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected successfully.');

    // Drizzle's internal table name is quoted.
    const tableName = '"__drizzle_migrations"';

    console.log(`Ensuring ${tableName} table exists...`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT
      );
    `);

    console.log(`Clearing existing entries from ${tableName} for a clean sync...`);
    await client.query(`DELETE FROM ${tableName};`);

    console.log('Inserting migration records...');
    for (const migration of migrations) {
      const hash = migration; // In this version of drizzle, the hash is the filename without extension.
      const createdAt = Date.now();
      await client.query(`INSERT INTO ${tableName} (hash, created_at) VALUES ($1, $2);`, [hash, createdAt]);
      console.log(`  -> Marked '${migration}' as applied.`);
    }

    console.log('\nMigration table synced successfully.');

  } catch (err) {
    console.error('\nError during migration sync:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

syncMigrations();
