const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

async function generateSchemaDump() {
  try {
    console.log('📄 Generating schema dump...');

    // Get all table definitions
    const tablesQuery = `
      SELECT 
        schemaname, 
        tablename,
        'CREATE TABLE ' || schemaname || '.' || tablename || ' (' AS table_start
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    const tables = await pool.query(tablesQuery);
    
    let schemaDump = `-- Schema dump generated on ${new Date().toISOString()}\n`;
    schemaDump += `-- Database: venuedb\n`;
    schemaDump += `-- Purpose: Pre-hardening backup for tenant isolation implementation\n\n`;

    // Get detailed schema information
    const detailedSchemaQuery = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;

    const columns = await pool.query(detailedSchemaQuery);
    
    // Group columns by table
    const tableColumns = {};
    columns.rows.forEach(col => {
      if (!tableColumns[col.table_name]) {
        tableColumns[col.table_name] = [];
      }
      tableColumns[col.table_name].push(col);
    });

    // Generate CREATE TABLE statements
    for (const tableName of Object.keys(tableColumns).sort()) {
      schemaDump += `-- Table: ${tableName}\n`;
      schemaDump += `CREATE TABLE ${tableName} (\n`;
      
      const cols = tableColumns[tableName];
      cols.forEach((col, index) => {
        let colDef = `  ${col.column_name} ${col.data_type}`;
        
        if (col.character_maximum_length) {
          colDef += `(${col.character_maximum_length})`;
        } else if (col.numeric_precision && col.numeric_scale) {
          colDef += `(${col.numeric_precision},${col.numeric_scale})`;
        } else if (col.numeric_precision) {
          colDef += `(${col.numeric_precision})`;
        }
        
        if (col.is_nullable === 'NO') {
          colDef += ' NOT NULL';
        }
        
        if (col.column_default) {
          colDef += ` DEFAULT ${col.column_default}`;
        }
        
        if (index < cols.length - 1) {
          colDef += ',';
        }
        
        schemaDump += colDef + '\n';
      });
      
      schemaDump += ');\n\n';
    }

    // Get indexes
    const indexQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;

    const indexes = await pool.query(indexQuery);
    
    if (indexes.rows.length > 0) {
      schemaDump += '-- Indexes\n';
      indexes.rows.forEach(idx => {
        schemaDump += `${idx.indexdef};\n`;
      });
      schemaDump += '\n';
    }

    // Write to file
    const filePath = 'backups/schema-pre-hardening.sql';
    fs.writeFileSync(filePath, schemaDump);
    
    console.log(`✅ Schema dump saved to: ${filePath}`);
    console.log(`📊 Tables included: ${Object.keys(tableColumns).length}`);
    console.log(`🔍 Indexes included: ${indexes.rows.length}`);
    console.log(`📝 File size: ${(schemaDump.length / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('❌ Error generating schema dump:', error.message);
  } finally {
    await pool.end();
  }
}

generateSchemaDump();