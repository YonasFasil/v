#!/usr/bin/env node

/**
 * MySQL Schema Conversion Script
 * Converts PostgreSQL schema to MySQL compatible schema
 */

import fs from 'fs';
import path from 'path';

const SCHEMA_FILE = './shared/schema.ts';

function convertSchema() {
  console.log('🔄 Converting PostgreSQL schema to MySQL...');
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Convert imports
  content = content.replace(
    /import { ([^}]+) } from "drizzle-orm\/pg-core"/g,
    (match, imports) => {
      const converted = imports
        .split(',')
        .map(imp => imp.trim())
        .map(imp => {
          if (imp === 'pgTable') return 'mysqlTable';
          if (imp === 'integer') return 'int';
          if (imp === 'jsonb') return 'json';
          return imp;
        })
        .join(', ');
      return `import { ${converted} } from "drizzle-orm/mysql-core"`;
    }
  );
  
  // Convert table definitions
  content = content.replace(/pgTable\(/g, 'mysqlTable(');
  
  // Convert integer to int
  content = content.replace(/integer\(/g, 'int(');
  
  // Convert jsonb to json
  content = content.replace(/jsonb\(/g, 'json(');
  
  // Convert UUID generation
  content = content.replace(
    /\.default\(sql`gen_random_uuid\(\)`\)/g,
    '.default(sql`(UUID())`)'
  );
  
  // Add length to varchar fields without length
  content = content.replace(
    /varchar\("([^"]+)"\)/g,
    'varchar("$1", { length: 255 })'
  );
  
  // Fix varchar with explicit id fields to use 36 chars for UUID
  content = content.replace(
    /varchar\("id", \{ length: 255 \}\)/g,
    'varchar("id", { length: 36 })'
  );
  
  // Convert timestamp to MySQL format
  content = content.replace(
    /timestamp\("([^"]+)"\)\.defaultNow\(\)/g,
    'timestamp("$1").default(sql`CURRENT_TIMESTAMP`)'
  );
  
  // Convert references to use proper syntax
  content = content.replace(
    /\.references\(\(\) => ([^.]+)\.id\)/g,
    '.references(() => $1.id)'
  );
  
  // Write converted content
  fs.writeFileSync(SCHEMA_FILE, content);
  
  console.log('✅ Schema conversion completed!');
  console.log('📝 Updated file:', SCHEMA_FILE);
  
  // Update package.json scripts
  updatePackageJson();
}

function updatePackageJson() {
  const packagePath = './package.json';
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Add MySQL migration script
  packageContent.scripts['migrate:mysql'] = 'drizzle-kit push';
  packageContent.scripts['convert-schema'] = 'node scripts/convert-to-mysql.js';
  
  fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));
  console.log('✅ Updated package.json scripts');
}

// Run conversion
try {
  convertSchema();
  console.log('\n🎉 MySQL conversion completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Review the converted schema.ts file');
  console.log('2. Run: npm install mysql2');
  console.log('3. Set DATABASE_URL to MySQL connection string');
  console.log('4. Run: npm run migrate:mysql');
} catch (error) {
  console.error('❌ Conversion failed:', error.message);
  process.exit(1);
}