const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function diagnosePostgresPermissions() {
  console.log('🔍 Diagnosing "postgres" role and schema permissions...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Checking what role we actually connect as...');
    
    const sessionInfo = await pool.query(`
      SELECT 
        current_user,
        session_user,
        current_database(),
        current_schema(),
        current_schemas(true) as search_path
    `);
    
    const info = sessionInfo.rows[0];
    console.log(`   Current user: ${info.current_user}`);
    console.log(`   Session user: ${info.session_user}`);
    console.log(`   Database: ${info.current_database}`);
    console.log(`   Current schema: ${info.current_schema}`);
    console.log(`   Search path: ${info.search_path}`);
    
    console.log('\n2️⃣ Checking if this "postgres" is actually superuser...');
    
    const roleCheck = await pool.query(`
      SELECT 
        rolname,
        rolsuper,
        rolbypassrls,
        rolcreaterole,
        rolcreatedb,
        rolcanlogin,
        rolconnlimit
      FROM pg_roles 
      WHERE rolname = current_user
    `);
    
    if (roleCheck.rows.length > 0) {
      const role = roleCheck.rows[0];
      console.log(`   Role name: ${role.rolname}`);
      console.log(`   Is superuser: ${role.rolsuper}`);
      console.log(`   Can bypass RLS: ${role.rolbypassrls}`);
      console.log(`   Can create roles: ${role.rolcreaterole}`);
      console.log(`   Can create databases: ${role.rolcreatedb}`);
      console.log(`   Can login: ${role.rolcanlogin}`);
      console.log(`   Connection limit: ${role.rolconnlimit}`);
      
      if (!role.rolsuper) {
        console.log('\n   🎯 FOUND ISSUE: This "postgres" is NOT a superuser!');
        console.log('   This explains the permission denied errors.');
      }
    }
    
    console.log('\n3️⃣ Checking public schema ownership and privileges...');
    
    const schemaInfo = await pool.query(`
      SELECT 
        schema_name,
        schema_owner,
        has_schema_privilege(current_user, 'public', 'CREATE') as can_create,
        has_schema_privilege(current_user, 'public', 'USAGE') as can_use
      FROM information_schema.schemata 
      WHERE schema_name = 'public'
    `);
    
    if (schemaInfo.rows.length > 0) {
      const schema = schemaInfo.rows[0];
      console.log(`   Schema owner: ${schema.schema_owner}`);
      console.log(`   Current user can CREATE: ${schema.can_create}`);
      console.log(`   Current user can USE: ${schema.can_use}`);
      
      if (!schema.can_create) {
        console.log('\n   🎯 FOUND ISSUE: Current user cannot CREATE in public schema!');
      }
    }
    
    console.log('\n4️⃣ Checking table-specific permissions for tenants...');
    
    const tablePerms = await pool.query(`
      SELECT 
        table_name,
        has_table_privilege(current_user, 'tenants', 'INSERT') as can_insert,
        has_table_privilege(current_user, 'tenants', 'SELECT') as can_select,
        has_table_privilege(current_user, 'tenants', 'UPDATE') as can_update,
        has_table_privilege(current_user, 'tenants', 'DELETE') as can_delete
      FROM information_schema.tables 
      WHERE table_name = 'tenants'
    `);
    
    if (tablePerms.rows.length > 0) {
      const perms = tablePerms.rows[0];
      console.log(`   Can INSERT: ${perms.can_insert}`);
      console.log(`   Can SELECT: ${perms.can_select}`);
      console.log(`   Can UPDATE: ${perms.can_update}`);
      console.log(`   Can DELETE: ${perms.can_delete}`);
      
      if (!perms.can_insert) {
        console.log('\n   🎯 FOUND ISSUE: Current user cannot INSERT into tenants!');
      }
    }
    
    console.log('\n5️⃣ Checking for any explicit REVOKE statements affecting public...');
    
    try {
      const grantInfo = await pool.query(`
        SELECT 
          grantee,
          privilege_type,
          is_grantable
        FROM information_schema.schema_privileges 
        WHERE schema_name = 'public'
        ORDER BY grantee, privilege_type
      `);
      
      console.log('   Schema privileges on public:');
      if (grantInfo.rows.length > 0) {
        grantInfo.rows.forEach(row => {
          console.log(`     ${row.grantee}: ${row.privilege_type} (grantable: ${row.is_grantable})`);
        });
      } else {
        console.log('     No explicit schema privileges found');
        console.log('     This might indicate privileges were revoked from PUBLIC');
      }
    } catch (e) {
      console.log(`   Could not check schema privileges: ${e.message}`);
    }
    
    console.log('\n6️⃣ Checking connection string details...');
    
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      // Parse without showing password
      const urlParts = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (urlParts) {
        console.log(`   Host: ${urlParts[3]}`);
        console.log(`   Port: ${urlParts[4]}`);
        console.log(`   Database: ${urlParts[5]}`);
        console.log(`   Username: ${urlParts[1]}`);
        
        if (urlParts[3].includes('neon') || urlParts[3].includes('cloud') || urlParts[3].includes('aws')) {
          console.log('\n   🎯 DETECTED: This appears to be a managed database service!');
          console.log('   Managed services often restrict superuser privileges.');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  } finally {
    await pool.end();
  }
}

diagnosePostgresPermissions();