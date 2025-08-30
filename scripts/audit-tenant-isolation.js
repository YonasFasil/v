const fs = require('fs');
const path = require('path');

console.log('🔍 Auditing Tenant Isolation in API Endpoints\n');

// Read the routes file
const routesPath = path.join(__dirname, '../server/routes.ts');
const routesContent = fs.readFileSync(routesPath, 'utf8');

// Extract all API endpoints
const endpointRegex = /app\.(get|post|put|patch|delete)\("([^"]+)"[^{]*{([^}]*(?:{[^}]*}[^}]*)*)/g;
const endpoints = [];
let match;

while ((match = endpointRegex.exec(routesContent)) !== null) {
  const [, method, path, body] = match;
  endpoints.push({ method: method.toUpperCase(), path, body });
}

console.log(`Found ${endpoints.length} API endpoints\n`);

// Patterns that indicate proper tenant isolation
const securePatterns = [
  'getTenantIdFromAuth',
  'tenantId',
  'filter.*tenantId',
  'where.*tenantId',
  'requireTenant',
  'withTenantContext',
  'tenant.*filter',
  'manual.*filter'
];

// Patterns that indicate potential bypass
const bypassPatterns = [
  'storage\\.get.*\\(\\)',  // Calling storage methods without tenant context
  'db\\.select\\(\\)\\.from\\(.*\\)(?!.*where.*tenant)', // Direct DB queries without tenant filtering
  'return.*db\\.select', // Direct returns without filtering
  'await.*storage\\.get.*\\(\\).*\\[', // Getting all data then filtering in memory (less secure)
];

// Analyze each endpoint
let secureCount = 0;
let insecureCount = 0;
let unknownCount = 0;

console.log('🔍 SECURITY ANALYSIS:\n');

endpoints.forEach(endpoint => {
  if (endpoint.path.startsWith('/api/')) {
    const hasSecurePattern = securePatterns.some(pattern => 
      new RegExp(pattern, 'i').test(endpoint.body)
    );
    
    const hasBypassPattern = bypassPatterns.some(pattern => 
      new RegExp(pattern).test(endpoint.body)
    );
    
    let status = '❓';
    let classification = 'UNKNOWN';
    
    if (hasSecurePattern && !hasBypassPattern) {
      status = '✅';
      classification = 'SECURE';
      secureCount++;
    } else if (hasBypassPattern) {
      status = '❌';
      classification = 'INSECURE';
      insecureCount++;
    } else {
      status = '❓';
      classification = 'UNKNOWN';
      unknownCount++;
    }
    
    console.log(`${status} ${endpoint.method} ${endpoint.path} - ${classification}`);
    
    if (classification === 'INSECURE') {
      // Show specific bypass patterns found
      bypassPatterns.forEach(pattern => {
        if (new RegExp(pattern).test(endpoint.body)) {
          console.log(`    ⚠️  Found pattern: ${pattern}`);
        }
      });
    }
  }
});

console.log(`\n📊 SUMMARY:`);
console.log(`✅ Secure endpoints: ${secureCount}`);
console.log(`❌ Insecure endpoints: ${insecureCount}`);
console.log(`❓ Unknown/needs review: ${unknownCount}`);

if (insecureCount > 0) {
  console.log(`\n🚨 CRITICAL: ${insecureCount} endpoints may have tenant isolation bypass issues!`);
  console.log('These endpoints need immediate review and fixing.');
}

// Check for specific problematic patterns
console.log(`\n🔍 SPECIFIC ISSUES TO FIX:`);

// Check for storage calls without tenant context
const storageCallRegex = /storage\.(get[A-Za-z]+)\(\)/g;
let storageMatch;
const problematicStorageCalls = new Set();

while ((storageMatch = storageCallRegex.exec(routesContent)) !== null) {
  problematicStorageCalls.add(storageMatch[1]);
}

if (problematicStorageCalls.size > 0) {
  console.log(`❌ Found ${problematicStorageCalls.size} storage calls that may bypass tenant filtering:`);
  Array.from(problematicStorageCalls).forEach(call => {
    console.log(`   - storage.${call}()`);
  });
}

// Check for withTenantNeon usage (now implemented with Supabase)
const withTenantNeonCount = (routesContent.match(/withTenantNeon/g) || []).length;
if (withTenantNeonCount > 0) {
  console.log(`✅ Found ${withTenantNeonCount} uses of withTenantNeon function (now using Supabase)`);
}

console.log(`\nRecommendations:`);
console.log(`1. Replace all storage.getX() calls with direct DB queries + tenant filtering`);
console.log(`2. withTenantNeon function now uses Supabase backend`);
console.log(`3. Add manual tenant filtering: .where(eq(schema.table.tenantId, tenantId))`);
console.log(`4. Use the secure pattern from venues endpoint as a template`);