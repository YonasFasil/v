const { spawn } = require('child_process');
const path = require('path');

/**
 * Security Test: JWT Secret Enforcement
 * 
 * This test verifies that the application fails fast when JWT_SECRET is missing,
 * preventing attackers from using hardcoded fallback secrets to forge tokens.
 */

async function testJWTSecretEnforcement() {
  console.log('🔐 Testing JWT Secret Enforcement...\n');
  
  const serverPath = path.join(__dirname, '../../server/index.ts');
  const testResults = [];

  // Test 1: App should FAIL when JWT_SECRET is missing
  console.log('📋 Test 1: App should fail without JWT_SECRET');
  
  const failTest = new Promise((resolve) => {
    const childEnv = { ...process.env };
    delete childEnv.JWT_SECRET; // Remove JWT_SECRET
    
    const child = spawn('node', ['-r', 'tsx/cjs', serverPath], {
      env: childEnv,
      stdio: 'pipe'
    });

    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.log('✅ PASS: App failed fast without JWT_SECRET (exit code:', code + ')');
        console.log('   Error output:', errorOutput.split('\n')[0]);
        testResults.push({ test: 'fail_without_secret', passed: true, message: 'App correctly failed without JWT_SECRET' });
      } else {
        console.log('❌ FAIL: App started successfully without JWT_SECRET (SECURITY RISK!)');
        testResults.push({ test: 'fail_without_secret', passed: false, message: 'App should not start without JWT_SECRET' });
      }
      resolve();
    });

    // Kill the process after 5 seconds if it's still running
    setTimeout(() => {
      if (!child.killed) {
        child.kill();
        console.log('❌ FAIL: App did not fail fast - had to kill after 5s (SECURITY RISK!)');
        testResults.push({ test: 'fail_without_secret', passed: false, message: 'App did not fail fast without JWT_SECRET' });
        resolve();
      }
    }, 5000);
  });

  await failTest;

  // Test 2: App should START when JWT_SECRET is provided
  console.log('\n📋 Test 2: App should start with valid JWT_SECRET');
  
  const successTest = new Promise((resolve) => {
    const childEnv = { ...process.env };
    childEnv.JWT_SECRET = 'test-secret-for-security-validation-12345';
    
    const child = spawn('node', ['-r', 'tsx/cjs', serverPath], {
      env: childEnv,
      stdio: 'pipe'
    });

    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      
      // Look for server startup indication
      if (output.includes('serving on port') || output.includes('Server running') || output.includes('listening')) {
        child.kill();
        console.log('✅ PASS: App started successfully with JWT_SECRET');
        testResults.push({ test: 'start_with_secret', passed: true, message: 'App correctly started with JWT_SECRET' });
        resolve();
      }
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ PASS: App started and shut down cleanly with JWT_SECRET');
        testResults.push({ test: 'start_with_secret', passed: true, message: 'App started with JWT_SECRET' });
      } else if (!testResults.find(r => r.test === 'start_with_secret')) {
        console.log('❌ FAIL: App failed to start with valid JWT_SECRET');
        console.log('   Error output:', errorOutput);
        testResults.push({ test: 'start_with_secret', passed: false, message: 'App failed with valid JWT_SECRET' });
      }
      resolve();
    });

    // Kill the process after 10 seconds if it hasn't started
    setTimeout(() => {
      if (!child.killed) {
        child.kill();
        console.log('⚠️  TIMEOUT: App took too long to start (may still be valid)');
        if (!testResults.find(r => r.test === 'start_with_secret')) {
          testResults.push({ test: 'start_with_secret', passed: false, message: 'App startup timeout' });
        }
        resolve();
      }
    }, 10000);
  });

  await successTest;

  // Summary
  console.log('\n📊 Security Test Results:');
  console.log('========================');
  
  const allPassed = testResults.every(result => result.passed);
  
  testResults.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${result.test} - ${result.message}`);
  });

  if (allPassed) {
    console.log('\n🎉 ALL SECURITY TESTS PASSED!');
    console.log('   JWT secret enforcement is working correctly.');
    process.exit(0);
  } else {
    console.log('\n🚨 SECURITY TESTS FAILED!');
    console.log('   JWT token forging vulnerability may exist.');
    process.exit(1);
  }
}

// Run the test
testJWTSecretEnforcement().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});