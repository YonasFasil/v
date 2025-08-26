const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function diagnosticStep1() {
  console.log('🔍 Step 1: Object type & owner diagnostics...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Object type & owner:');
    
    const objectInfo = await pool.query(`
      SELECT c.oid, n.nspname AS schema, c.relname AS name, c.relkind,
             pg_get_userbyid(c.relowner) AS owner
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname IN ('tenants','settings')
    `);
    
    console.log('Results:');
    objectInfo.rows.forEach(row => {
      console.log(`  oid: ${row.oid}, schema: ${row.schema}, name: ${row.name}, relkind: ${row.relkind}, owner: ${row.owner}`);
    });
    
    console.log('\n2️⃣ Table ACLs:');
    
    const aclInfo = await pool.query(`
      SELECT relname, relacl
      FROM pg_class
      WHERE relnamespace='public'::regnamespace AND relname IN ('tenants','settings')
    `);
    
    console.log('Results:');
    aclInfo.rows.forEach(row => {
      console.log(`  ${row.relname}: ${row.relacl || 'NULL (default permissions)'}`);
    });
    
    console.log('\n3️⃣ Schema owner & schema usage for app role:');
    
    const schemaOwner = await pool.query(`
      SELECT nspname, pg_get_userbyid(nspowner) AS owner
      FROM pg_namespace WHERE nspname='public'
    `);
    
    console.log('Schema owner:');
    schemaOwner.rows.forEach(row => {
      console.log(`  ${row.nspname}: ${row.owner}`);
    });
    
    const hasUsage = await pool.query(`
      SELECT has_schema_privilege('venuine_app','public','USAGE') AS have_usage
    `);
    
    console.log('venuine_app usage privilege:');
    console.log(`  has USAGE on public: ${hasUsage.rows[0].have_usage}`);
    
    console.log('\n4️⃣ Current user sanity check:');
    
    const currentUser = await pool.query(`
      SELECT current_user, session_user
    `);
    
    console.log('Current session:');
    console.log(`  current_user: ${currentUser.rows[0].current_user}, session_user: ${currentUser.rows[0].session_user}`);
    
    const roleInfo = await pool.query(`
      SELECT rolname, rolsuper, rolbypassrls
      FROM pg_roles WHERE rolname=current_user
    `);
    
    console.log('Current role privileges:');
    roleInfo.rows.forEach(row => {
      console.log(`  ${row.rolname}: superuser=${row.rolsuper}, bypass_rls=${row.rolbypassrls}`);
    });
    
  } catch (error) {
    console.error('❌ Diagnostic step 1 failed:', error.message);
  } finally {
    await pool.end();
  }
}

diagnosticStep1();