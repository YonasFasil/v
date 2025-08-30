const fs = require('fs');
const path = require('path');

console.log('🔒 Security Audit: Checking 10-Step Security Recommendations\n');

// STEP 1: Check JWT secret enforcement
console.log('1️⃣ STEP 1 - JWT Secret Enforcement:');
try {
  const requireEnvPath = path.join(__dirname, '../server/utils/requireEnv.ts');
  const hasRequireEnv = fs.existsSync(requireEnvPath);
  console.log(`   ✅ requireEnv.ts exists: ${hasRequireEnv}`);
  
  if (hasRequireEnv) {
    const content = fs.readFileSync(requireEnvPath, 'utf8');
    const hasProperImplementation = content.includes('Missing required env') && content.includes('throw new Error');
    console.log(`   ✅ Proper implementation: ${hasProperImplementation}`);
  } else {
    console.log('   ❌ requireEnv.ts not found');
  }
} catch (error) {
  console.log(`   ❌ Error checking: ${error.message}`);
}

// STEP 2: Check DB role lockdown
console.log('\n2️⃣ STEP 2 - Database Role Lockdown:');
try {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir);
  const lockdownMigration = files.find(f => f.includes('lockdown') || f.includes('roles'));
  console.log(`   ✅ Lockdown migration exists: ${!!lockdownMigration}`);
  if (lockdownMigration) {
    console.log(`   📄 File: ${lockdownMigration}`);
  }
} catch (error) {
  console.log(`   ❌ Error checking migrations: ${error.message}`);
}

// STEP 3: Check RLS enablement
console.log('\n3️⃣ STEP 3 - Row-Level Security:');
try {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir);
  const rlsMigrations = files.filter(f => {
    try {
      const content = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
      return content.includes('ENABLE ROW LEVEL SECURITY') || content.includes('FORCE ROW LEVEL SECURITY');
    } catch (e) {
      return false;
    }
  });
  console.log(`   ✅ RLS migrations found: ${rlsMigrations.length}`);
  rlsMigrations.forEach(f => console.log(`   📄 ${f}`));
} catch (error) {
  console.log(`   ❌ Error checking RLS: ${error.message}`);
}

// STEP 4: Check tenant context setting
console.log('\n4️⃣ STEP 4 - Tenant Context Setting:');
try {
  const tenantSupabasePath = path.join(__dirname, '../server/db/tenant-supabase.ts');
  const tenantContextPath = path.join(__dirname, '../server/db/tenant-context.ts');
  
  console.log(`   ✅ tenant-supabase.ts exists: ${fs.existsSync(tenantSupabasePath)}`);
  console.log(`   ✅ tenant-context.ts exists: ${fs.existsSync(tenantContextPath)}`);
  
  if (fs.existsSync(tenantSupabasePath)) {
    const content = fs.readFileSync(tenantSupabasePath, 'utf8');
    const hasSetConfig = content.includes('set_config') || content.includes('SET LOCAL');
    console.log(`   ✅ Uses set_config/SET LOCAL: ${hasSetConfig}`);
  }
} catch (error) {
  console.log(`   ❌ Error checking tenant context: ${error.message}`);
}

// STEP 5: Check tenant constraints
console.log('\n5️⃣ STEP 5 - Tenant Constraints:');
try {
  const schemaPath = path.join(__dirname, '../shared/schema.ts');
  if (fs.existsSync(schemaPath)) {
    const content = fs.readFileSync(schemaPath, 'utf8');
    const hasCompositeIndexes = content.includes('tenantId') && (content.includes('unique') || content.includes('index'));
    console.log(`   ✅ Schema has tenant constraints: ${hasCompositeIndexes}`);
  } else {
    console.log(`   ❌ Schema file not found`);
  }
} catch (error) {
  console.log(`   ❌ Error checking constraints: ${error.message}`);
}

// STEP 6: Check super-admin assume tenant
console.log('\n6️⃣ STEP 6 - Super-admin Assume Tenant:');
try {
  const routesPath = path.join(__dirname, '../server/routes.ts');
  if (fs.existsSync(routesPath)) {
    const content = fs.readFileSync(routesPath, 'utf8');
    const hasAssumeEndpoint = content.includes('/assume-tenant') || content.includes('assume-tenant');
    const hasAuditTable = content.includes('admin_audit') || content.includes('audit');
    console.log(`   ✅ Assume tenant endpoint: ${hasAssumeEndpoint}`);
    console.log(`   ✅ Audit logging: ${hasAuditTable}`);
  }
} catch (error) {
  console.log(`   ❌ Error checking assume tenant: ${error.message}`);
}

// STEP 7: Check CORS and security headers
console.log('\n7️⃣ STEP 7 - CORS & Security Headers:');
try {
  const serverIndexPath = path.join(__dirname, '../server/index.ts');
  if (fs.existsSync(serverIndexPath)) {
    const content = fs.readFileSync(serverIndexPath, 'utf8');
    const hasCors = content.includes('cors');
    const hasHelmet = content.includes('helmet');
    const hasOriginRestriction = content.includes('origin') && !content.includes('origin: true');
    console.log(`   ✅ CORS configured: ${hasCors}`);
    console.log(`   ✅ Helmet security headers: ${hasHelmet}`);
    console.log(`   ✅ Origin restriction: ${hasOriginRestriction}`);
  }
} catch (error) {
  console.log(`   ❌ Error checking security headers: ${error.message}`);
}

// STEP 8: Check security tests
console.log('\n8️⃣ STEP 8 - Security Tests:');
try {
  const testsDir = path.join(__dirname, '../tests/security');
  const hasSecurityTests = fs.existsSync(testsDir);
  console.log(`   ✅ Security tests directory: ${hasSecurityTests}`);
  
  if (hasSecurityTests) {
    const testFiles = fs.readdirSync(testsDir);
    console.log(`   ✅ Test files found: ${testFiles.length}`);
    testFiles.forEach(f => console.log(`   📄 ${f}`));
  }
  
  const packageJsonPath = path.join(__dirname, '../package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasSecTest = packageJson.scripts && packageJson.scripts['sec:test'];
    console.log(`   ✅ npm run sec:test script: ${!!hasSecTest}`);
  }
} catch (error) {
  console.log(`   ❌ Error checking security tests: ${error.message}`);
}

// STEP 9: Check CI guardrails
console.log('\n9️⃣ STEP 9 - CI Guardrails:');
try {
  const scriptsDir = path.join(__dirname, '../scripts');
  const files = fs.readdirSync(scriptsDir);
  const hasMigrationCheck = files.some(f => f.includes('check-migration') || f.includes('migration'));
  const hasSqlSafetyCheck = files.some(f => f.includes('check-sql') || f.includes('sql-safety'));
  
  console.log(`   ✅ Migration safety check: ${hasMigrationCheck}`);
  console.log(`   ✅ SQL safety check: ${hasSqlSafetyCheck}`);
  
  const packageJsonPath = path.join(__dirname, '../package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasSecAll = packageJson.scripts && packageJson.scripts['sec:all'];
    console.log(`   ✅ npm run sec:all script: ${!!hasSecAll}`);
  }
} catch (error) {
  console.log(`   ❌ Error checking CI guardrails: ${error.message}`);
}

// STEP 10: Check secrets & deployment hygiene
console.log('\n🔟 STEP 10 - Secrets & Deployment:');
try {
  const gitignorePath = path.join(__dirname, '../.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    const ignoresEnv = content.includes('.env');
    console.log(`   ✅ .env in .gitignore: ${ignoresEnv}`);
  }
  
  const serverIndexPath = path.join(__dirname, '../server/index.ts');
  if (fs.existsSync(serverIndexPath)) {
    const content = fs.readFileSync(serverIndexPath, 'utf8');
    const hasEnvValidation = content.includes('requireEnv') || content.includes('required');
    console.log(`   ✅ Environment validation: ${hasEnvValidation}`);
  }
  
  const docsPath = path.join(__dirname, '../VERCEL_ENV_SETUP.md');
  const hasEnvDocs = fs.existsSync(docsPath);
  console.log(`   ✅ Environment documentation: ${hasEnvDocs}`);
} catch (error) {
  console.log(`   ❌ Error checking deployment hygiene: ${error.message}`);
}

console.log('\n🔒 Security Audit Complete!');
console.log('\nRecommendations:');
console.log('- Fix customers API tenant isolation issue');
console.log('- Complete any missing security implementations');
console.log('- Run comprehensive security tests');
console.log('- Verify RLS policies are properly enforced');