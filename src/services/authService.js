const crypto = require('crypto');
const repo = require('../repositories/authRepository');

// password hashing (simple SHA256 for demo; replace with PBKDF2/argon2 in prod)
function hash(p) { return crypto.createHash('sha256').update(p).digest('hex'); }

module.exports = {
  loginUser: (identifier,pwd) => module.exports.login(identifier,pwd),
  login: async (email, password) => {
    const u = await repo.findByEmail(email);
    if (!u || u.pwd_hash !== hash(password)) return null;
    return { id: u.id, role: u.role, branchId: u.branch_id };
  },
  changePassword: (userId, currentPwd, newPwd) => repo.updatePassword(userId, hash(newPwd)),
  // stubs for unused legacy flows
  registerUser: () => Promise.reject(new Error('register disabled')),
  logout: () => {},
  getUserFromToken: () => null,
  verifyToken: () => null,
  updateProfile: () => {}
}; 