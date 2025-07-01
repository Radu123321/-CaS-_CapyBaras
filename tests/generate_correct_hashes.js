const crypto = require('crypto');

// PBKDF2 parameters (same as in authService.js)
const ITERATIONS = 310000;
const KEYLEN = 32;
const DIGEST = 'sha256';

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
}

// Fixed salt from seed data
const salt = 'cas_salt_2024';

// Passwords from seed comments
const passwords = {
  'admin123': 'ADMIN',
  'manager123': 'MANAGER', 
  'employee123': 'EMPLOYEE',
  'client123': 'CUSTOMER'
};

console.log('🔐 Generating correct password hashes for CaS v2.0\n');
console.log('Parameters:');
console.log(`- Iterations: ${ITERATIONS}`);
console.log(`- Key Length: ${KEYLEN}`);
console.log(`- Digest: ${DIGEST}`);
console.log(`- Salt: ${salt}\n`);

console.log('Generated hashes:');
console.log('================');

for (const [password, role] of Object.entries(passwords)) {
  const hash = hashPassword(password, salt);
  console.log(`\n${role}:`);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log(`SQL: 'pbkdf2:sha256:${ITERATIONS}$${salt}$${hash}'`);
}

console.log('\n🎯 Use these hashes in your seed data files!'); 