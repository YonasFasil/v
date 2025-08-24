const { spawn } = require('child_process');
const path = require('path');

/**
 * Security Test Runner
 * 
 * Runs all security tests in sequence to validate tenant isolation
 * and authentication security measures.
 */

async function runSecurityTests() {
  console.log('🛡️  VENUE PROJECT SECURITY TEST SUITE');
  console.log('=====================================\n');
  
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

  console.log('=====================================');
  if (allTestsPassed) {
    console.log('🎉 ALL SECURITY TESTS PASSED!');
    console.log('   Your application meets the security requirements.');
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