const { spawn } = require('child_process');
const path = require('path');
const { setupTestEnvironment, teardownTestEnvironment } = require('./test-utils');

/**
 * Security Test Runner
 * 
 * Runs all security tests in sequence to validate tenant isolation
 * and authentication security measures with proper test isolation.
 */

async function runSecurityTests() {
  console.log('🛡️  VENUE PROJECT SECURITY TEST SUITE');
  console.log('=====================================\n');
  
  // Setup isolated test environment
  await setupTestEnvironment();
  
  const tests = [
    {
      name: 'JWT Secret Enforcement',
      file: 'step1_jwt_secret.js',
      description: 'Prevents JWT token forging by enforcing secret configuration'
    },
    {
      name: 'Database Role Lockdown',
      file: 'step2_roles.js',
      description: 'Ensures least-privilege database roles prevent RLS bypass'
    },
    {
      name: 'Row-Level Security Enforcement',
      file: 'step3_rls_flags.js',
      description: 'Validates RLS enabled and FORCED on all tenant tables'
    },
    {
      name: 'RLS Context Enforcement',
      file: 'step4_context_enforced.js',
      description: 'Validates per-request set_config binds tenant context to RLS policies'
    },
    {
      name: 'RLS Session Variable Enforcement',
      file: 'test-rls-session-variables.js',
      description: 'Validates PostgreSQL session variables enforce tenant isolation'
    },
    {
      name: 'Tenant-Safe Uniqueness & FK Integrity',
      file: 'step5_constraints.js',
      description: 'Validates per-tenant unique indexes and cross-tenant FK protection'
    },
    {
      name: 'Super-Admin Assume Tenant & Audit',
      file: 'step6_superadmin.js',
      description: 'Tests time-boxed super-admin tenant assumption with audit logging'
    },
    {
      name: 'CORS Restrictions & Debug Blocking',
      file: 'step7_cors_and_debug.js',
      description: 'Validates production CORS allowlist and debug/init route blocking'
    },
    {
      name: 'Environment Validation & Deployment Hygiene',
      file: 'step10_envs.js',
      description: 'Tests environment variable validation and deployment security'
    }
  ];

  let allTestsPassed = true;
  
  for (const test of tests) {
    console.log(`🔍 Running: ${test.name}`);
    console.log(`📝 ${test.description}\n`);
    
    try {
      const testFile = path.join(__dirname, test.file);
      
      const result = await new Promise((resolve) => {
        const child = spawn('node', [testFile], {
          stdio: 'inherit',
          cwd: __dirname
        });
        
        child.on('close', (code) => {
          resolve(code);
        });
      });
      
      if (result === 0) {
        console.log(`✅ ${test.name}: PASSED\n`);
      } else {
        console.log(`❌ ${test.name}: FAILED\n`);
        allTestsPassed = false;
      }
      
    } catch (error) {
      console.error(`💥 ${test.name}: ERROR - ${error.message}\n`);
      allTestsPassed = false;
    }
  }

  // Clean up test environment
  await teardownTestEnvironment();

  console.log('=====================================');
  if (allTestsPassed) {
    console.log('🎉 ALL SECURITY TESTS PASSED!');
    console.log('   Your application meets the security requirements.');
    console.log('   All tests passed without order dependency.');
    process.exit(0);
  } else {
    console.log('🚨 SECURITY TESTS FAILED!');
    console.log('   Please fix the failing tests before deploying.');
    process.exit(1);
  }
}

// Run all tests
runSecurityTests().catch(error => {
  console.error('💥 Security test suite failed:', error);
  process.exit(1);
});