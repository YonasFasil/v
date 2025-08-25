#!/usr/bin/env node

/**
 * Environment Variable Validation
 * 
 * Validates that all required environment variables are present
 * and exits with non-zero code if critical variables are missing.
 * Does NOT log variable values for security.
 */

const REQUIRED_ENVS = [
  'JWT_SECRET',
  'DATABASE_URL'
];

const RECOMMENDED_ENVS = [
  'NODE_ENV',
  'CORS_ORIGINS',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
  'MAX_REQUEST_SIZE'
];

function validateEnvironment() {
  console.log('🔐 Validating environment variables...\n');
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check required environment variables
  console.log('📋 Required Variables:');
  for (const envVar of REQUIRED_ENVS) {
    const value = process.env[envVar];
    if (!value || value.trim() === '') {
      console.log(`   ❌ ${envVar}: MISSING (CRITICAL)`);
      hasErrors = true;
    } else {
      // Validate specific requirements
      if (envVar === 'JWT_SECRET' && value.length < 32) {
        console.log(`   ⚠️  ${envVar}: Present but too short (minimum 32 characters)`);
        hasWarnings = true;
      } else if (envVar === 'DATABASE_URL' && !value.startsWith('postgresql://')) {
        console.log(`   ⚠️  ${envVar}: Present but may not be a valid PostgreSQL URL`);
        hasWarnings = true;
      } else {
        console.log(`   ✅ ${envVar}: Present`);
      }
    }
  }
  
  console.log('\n📋 Recommended Variables:');
  for (const envVar of RECOMMENDED_ENVS) {
    const value = process.env[envVar];
    if (!value || value.trim() === '') {
      console.log(`   ⚠️  ${envVar}: Missing (recommended)`);
      hasWarnings = true;
    } else {
      console.log(`   ✅ ${envVar}: Present`);
    }
  }
  
  // Check for insecure defaults
  console.log('\n🛡️  Security Checks:');
  
  // Check JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    if (jwtSecret === 'dev-secret' || jwtSecret === 'your-secret-key') {
      console.log('   ❌ JWT_SECRET: Using default/weak secret (CRITICAL)');
      hasErrors = true;
    } else if (jwtSecret.length >= 32) {
      console.log('   ✅ JWT_SECRET: Strong secret');
    }
  }
  
  // Check NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    console.log('   ✅ NODE_ENV: Production mode');
    
    // Additional production checks
    if (!process.env.CORS_ORIGINS) {
      console.log('   ⚠️  CORS_ORIGINS: Not set in production (will use defaults)');
      hasWarnings = true;
    }
  } else {
    console.log(`   ℹ️  NODE_ENV: ${nodeEnv || 'not set'} (development mode)`);
  }
  
  // Check for accidentally committed secrets
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('password=')) {
    console.log('   ⚠️  DATABASE_URL: Contains embedded password (ensure not committed to repo)');
    hasWarnings = true;
  }
  
  console.log('\n=====================================');
  
  if (hasErrors) {
    console.log('🚨 ENVIRONMENT VALIDATION FAILED!');
    console.log('   Critical environment variables are missing or invalid.');
    console.log('   The application cannot start safely.');
    console.log('\n💡 Set missing environment variables:');
    REQUIRED_ENVS.forEach(env => {
      if (!process.env[env]) {
        console.log(`   export ${env}="your-${env.toLowerCase().replace('_', '-')}-value"`);
      }
    });
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  ENVIRONMENT VALIDATION: WARNINGS');
    console.log('   Some recommended variables are missing or may be insecure.');
    console.log('   The application will start but may not be optimally configured.');
    process.exit(0);
  } else {
    console.log('✅ ENVIRONMENT VALIDATION PASSED!');
    console.log('   All required environment variables are present and valid.');
    process.exit(0);
  }
}

// Export for use in other scripts
module.exports = { validateEnvironment, REQUIRED_ENVS, RECOMMENDED_ENVS };

// Run validation if this script is executed directly
if (require.main === module) {
  validateEnvironment();
}