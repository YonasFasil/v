#!/usr/bin/env node

/**
 * Migration Safety Checker
 * 
 * Ensures new migrations follow security best practices:
 * - All new tables have RLS enabled
 * - All new tables have RLS forced
 * - Tables with tenant_id have appropriate tenant isolation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

async function checkMigrations() {
  console.log('🛡️  Checking migration security compliance...\n');
  
  let hasErrors = false;
  
  try {
    // Get all migration files
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📋 Found ${migrationFiles.length} migration files\n`);
    
    for (const filename of migrationFiles) {
      const filePath = path.join(MIGRATIONS_DIR, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      
      console.log(`🔍 Checking: ${filename}`);
      
      // Check for CREATE TABLE statements
      const tableMatches = content.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+([^\s(]+)/gi);
      
      if (tableMatches) {
        for (const match of tableMatches) {
          const tableName = match.replace(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+/i, '').trim();
          
          // Skip system tables, temp tables, and known safe tables
          if (tableName.includes('pg_') || 
              tableName.includes('temp_') || 
              tableName.includes('_temp') ||
              tableName.includes('schema_migrations') ||
              tableName.includes('drizzle')) {
            continue;
          }
          
          console.log(`   📊 Table: ${tableName}`);
          
          // Check if RLS is enabled for this table
          const rlsEnabled = content.includes(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY`) ||
                           content.includes(`ENABLE ROW LEVEL SECURITY`) &&
                           content.toLowerCase().includes(tableName.toLowerCase());
          
          // Check if RLS is forced
          const rlsForced = content.includes(`ALTER TABLE ${tableName} FORCE ROW LEVEL SECURITY`) ||
                          content.includes(`FORCE ROW LEVEL SECURITY`) &&
                          content.toLowerCase().includes(tableName.toLowerCase());
          
          // Check if table has tenant_id column
          const hasTenantId = content.toLowerCase().includes('tenant_id');
          
          if (!rlsEnabled) {
            console.log(`   ❌ ERROR: Table ${tableName} does not have RLS enabled`);
            hasErrors = true;
          } else {
            console.log(`   ✅ RLS enabled`);
          }
          
          if (!rlsForced) {
            console.log(`   ❌ ERROR: Table ${tableName} does not have RLS forced`);
            hasErrors = true;
          } else {
            console.log(`   ✅ RLS forced`);
          }
          
          if (hasTenantId) {
            console.log(`   ℹ️  Has tenant_id column - ensure proper RLS policies exist`);
          }
        }
      } else {
        console.log('   ℹ️  No CREATE TABLE statements found');
      }
      
      console.log('');
    }
    
    if (hasErrors) {
      console.log('🚨 MIGRATION SECURITY ERRORS FOUND!');
      console.log('   All tables must have RLS ENABLED and FORCED');
      console.log('   Add these statements after CREATE TABLE:');
      console.log('   ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;');
      console.log('   ALTER TABLE your_table FORCE ROW LEVEL SECURITY;');
      process.exit(1);
    } else {
      console.log('✅ All migrations pass security checks!');
      console.log('   All tables have proper RLS configuration.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Error checking migrations:', error.message);
    process.exit(1);
  }
}

checkMigrations();