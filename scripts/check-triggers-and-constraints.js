const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function checkTriggersAndConstraints() {
  console.log('🔍 Checking triggers and constraints on tenants table...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Checking triggers on tenants table...');
    
    const triggers = await pool.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement,
        action_orientation
      FROM information_schema.triggers 
      WHERE event_object_table = 'tenants'
      ORDER BY trigger_name
    `);
    
    console.log('   Triggers on tenants table:');
    if (triggers.rows.length > 0) {
      triggers.rows.forEach(trigger => {
        console.log(`     ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
        console.log(`       Statement: ${trigger.action_statement}`);
        console.log(`       Orientation: ${trigger.action_orientation}`);
      });
    } else {
      console.log('     No triggers found');
    }
    
    console.log('\n2️⃣ Checking constraints on tenants table...');
    
    const constraints = await pool.query(`
      SELECT 
        constraint_name,
        constraint_type,
        column_name,
        is_deferrable,
        initially_deferred
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'tenants' AND tc.table_schema = 'public'
      ORDER BY constraint_type, constraint_name
    `);
    
    console.log('   Constraints on tenants table:');
    if (constraints.rows.length > 0) {
      constraints.rows.forEach(constraint => {
        console.log(`     ${constraint.constraint_name} (${constraint.constraint_type})`);
        if (constraint.column_name) {
          console.log(`       Column: ${constraint.column_name}`);
        }
      });
    } else {
      console.log('     No constraints found');
    }
    
    console.log('\n3️⃣ Checking foreign key references...');
    
    const fkeys = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'tenants'
    `);
    
    console.log('   Foreign key constraints:');
    if (fkeys.rows.length > 0) {
      fkeys.rows.forEach(fk => {
        console.log(`     ${fk.constraint_name}: ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('     No foreign key constraints found');
    }
    
    console.log('\n4️⃣ Checking for any functions or procedures that might be triggered...');
    
    const functions = await pool.query(`
      SELECT 
        p.proname as function_name,
        pg_catalog.pg_get_function_arguments(p.oid) as arguments,
        p.prosrc as source_code
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND (p.prosrc ILIKE '%tenant%' OR p.proname ILIKE '%tenant%')
      ORDER BY p.proname
    `);
    
    console.log('   Functions mentioning tenants:');
    if (functions.rows.length > 0) {
      functions.rows.forEach(func => {
        console.log(`     ${func.function_name}(${func.arguments})`);
        if (func.source_code && func.source_code.length < 200) {
          console.log(`       Source: ${func.source_code.substring(0, 100)}...`);
        }
      });
    } else {
      console.log('     No tenant-related functions found');
    }
    
    console.log('\n5️⃣ Checking RLS policies (even though RLS is disabled)...');
    
    const policies = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE tablename = 'tenants'
    `);
    
    console.log('   RLS policies on tenants (should be none since RLS is disabled):');
    if (policies.rows.length > 0) {
      policies.rows.forEach(policy => {
        console.log(`     ${policy.policyname}: ${policy.cmd} for ${policy.roles}`);
        console.log(`       Using: ${policy.qual || 'TRUE'}`);
        console.log(`       With Check: ${policy.with_check || 'TRUE'}`);
      });
    } else {
      console.log('     No RLS policies found');
    }
    
    console.log('\n6️⃣ Checking table structure and permissions more deeply...');
    
    const tableInfo = await pool.query(`
      SELECT 
        column_name,
        data_type,
        column_default,
        is_nullable,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'tenants' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('   Tenants table structure:');
    tableInfo.rows.forEach(col => {
      console.log(`     ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      if (col.column_default) {
        console.log(`       Default: ${col.column_default}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkTriggersAndConstraints();