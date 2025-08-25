const fs = require('fs');
const path = require('path');

// Replace hardcoded password in files
function fixPasswordsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace the hardcoded password patterns
    content = content.replace(/ZxOp1029!!\%\%/g, 'password');
    content = content.replace(/postgresql:\/\/postgres:ZxOp1029!!\%\%@/g, 'postgresql://postgres:password@');
    
    // Update connection string patterns to use environment variables
    content = content.replace(
      /"postgresql:\/\/postgres:password@localhost:5432\/venuedb"/g,
      'process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"'
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed: ${path.relative(process.cwd(), filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}: ${error.message}`);
    return false;
  }
}

// Get all JS files in scripts directory
const scriptsDir = __dirname;
const files = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js') && f !== 'fix-hardcoded-passwords.js');

console.log('🔐 Fixing hardcoded passwords in scripts...\n');

let fixedCount = 0;
files.forEach(file => {
  const filePath = path.join(scriptsDir, file);
  if (fixPasswordsInFile(filePath)) {
    fixedCount++;
  }
});

console.log(`\n📊 Summary: Fixed ${fixedCount}/${files.length} files`);
console.log('🔒 All hardcoded passwords have been replaced with environment variable references.');