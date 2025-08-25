#!/usr/bin/env node

/**
 * SQL Safety Scanner
 * 
 * Scans codebase for potentially unsafe SQL that doesn't respect tenant boundaries
 * Flags raw SQL touching tenant tables outside approved wrappers
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');

// Tables that contain tenant data and should be accessed through approved wrappers
const TENANT_TABLES = [
  'users', 'customers', 'venues', 'bookings', 'proposals', 'payments',
  'communications', 'tasks', 'leads', 'companies', 'services', 'packages',
  'setup_styles', 'campaign_sources', 'tags', 'tax_settings'
];

// Approved SQL wrappers and patterns that are safe
const APPROVED_PATTERNS = [
  'storage\\.', // storage layer methods
  'db\\.', // database abstraction layer
  'getRLSClient', // RLS-aware client
  'setTenantContext', // tenant context setting
  'set_config\\(\'app\\.current_tenant_id\'', // explicit tenant context
  'WITH RECURSIVE', // complex queries that might need raw SQL
  'CONSTRAINT', // constraint definitions
  'POLICY', // RLS policy definitions
  'GRANT', 'REVOKE', // permission management
  'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', // schema changes
  'CREATE INDEX', 'DROP INDEX', // index management
  'INSERT INTO.*VALUES.*\\$', // parameterized queries
  'SELECT.*FROM.*WHERE.*tenant_id', // queries that explicitly filter by tenant
  'migration', 'Migration' // migration files
];

async function scanSQLSafety() {
  console.log('🔍 Scanning SQL safety across codebase...\n');
  
  let hasIssues = false;
  const issues = [];
  
  try {
    // Scan server directory for SQL usage
    await scanDirectory(path.join(PROJECT_ROOT, 'server'), issues);
    
    // Scan client directory for any direct DB access
    await scanDirectory(path.join(PROJECT_ROOT, 'client'), issues);
    
    // Report findings
    if (issues.length === 0) {
      console.log('✅ No SQL safety issues found!');
      console.log('   All database access appears to use approved patterns.');
      process.exit(0);
    } else {
      console.log(`🚨 Found ${issues.length} potential SQL safety issues:\n`);
      
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.file}:${issue.line}`);
        console.log(`   Table: ${issue.table}`);
        console.log(`   Code: ${issue.code.trim()}`);
        console.log(`   Issue: ${issue.reason}\n`);
      });
      
      console.log('💡 To fix these issues:');
      console.log('   - Use storage layer methods instead of raw SQL');
      console.log('   - Ensure tenant context is set before queries');
      console.log('   - Add explicit WHERE tenant_id = $1 filters');
      console.log('   - Use approved database wrappers');
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error scanning SQL safety:', error.message);
    process.exit(1);
  }
}

async function scanDirectory(dirPath, issues) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules, .git, dist, build directories
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
          await scanDirectory(fullPath, issues);
        }
      } else if (entry.isFile() && shouldScanFile(entry.name)) {
        await scanFile(fullPath, issues);
      }
    }
  } catch (error) {
    // Skip directories we can't read
    if (error.code !== 'ENOENT' && error.code !== 'EACCES') {
      console.warn(`Warning: Could not scan ${dirPath}: ${error.message}`);
    }
  }
}

function shouldScanFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ['.js', '.ts', '.jsx', '.tsx', '.mjs'].includes(ext);
}

async function scanFile(filePath, issues) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Look for SQL queries touching tenant tables
      for (const table of TENANT_TABLES) {
        // Check for potential unsafe SQL patterns
        const patterns = [
          new RegExp(`(SELECT|INSERT|UPDATE|DELETE).*FROM\\s+${table}`, 'i'),
          new RegExp(`(SELECT|INSERT|UPDATE|DELETE).*\\b${table}\\b`, 'i'),
          new RegExp(`INSERT\\s+INTO\\s+${table}`, 'i'),
          new RegExp(`UPDATE\\s+${table}\\s+SET`, 'i'),
          new RegExp(`DELETE\\s+FROM\\s+${table}`, 'i')
        ];
        
        for (const pattern of patterns) {
          if (pattern.test(line)) {
            // Check if this line uses an approved pattern
            const isApproved = APPROVED_PATTERNS.some(approvedPattern => 
              new RegExp(approvedPattern, 'i').test(line)
            );
            
            if (!isApproved) {
              // Additional checks for common safe patterns
              const hasExplicitTenantFilter = /WHERE.*tenant_id\s*=/.test(line);
              const isParameterized = /\$\d+/.test(line);
              const isInMigration = filePath.includes('migration') || filePath.includes('Migration');
              const isInTest = filePath.includes('test') || filePath.includes('Test');
              
              if (!hasExplicitTenantFilter && !isParameterized && !isInMigration && !isInTest) {
                issues.push({
                  file: path.relative(PROJECT_ROOT, filePath),
                  line: lineNumber,
                  table: table,
                  code: line,
                  reason: 'Raw SQL touching tenant table without approved wrapper'
                });
              }
            }
          }
        }
      }
    });
    
  } catch (error) {
    console.warn(`Warning: Could not scan file ${filePath}: ${error.message}`);
  }
}

scanSQLSafety();