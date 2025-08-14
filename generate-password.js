const bcrypt = require('bcryptjs');

// Generate a password hash for super admin
const password = process.argv[2] || 'admin123';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nAdd this to your .env file:');
console.log(`SUPER_ADMIN_PASSWORD_HASH=${hash}`);