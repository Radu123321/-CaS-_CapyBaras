const crypto = require('crypto');
const repo = require('../repositories/authRepository');
const userRepo = require('../repositories/userRepository');
const pool = require('../core/psql');

// password hashing (simple SHA256 for demo; replace with PBKDF2/argon2 in prod)
function hash(p) { return crypto.createHash('sha256').update(p).digest('hex'); }

// Very lightweight in-memory token store (non-persistent)
const tokens = new Map(); // token → { userId, role, branchId, issuedAt }

function generateToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now()/1000) + 24*3600 // 24h
  })).toString('base64url');
  return `${header}.${payload}.`;
}

module.exports = {
  // alias kept for legacy
  loginUser: (identifier,pwd) => module.exports.login(identifier,pwd),

  /** Authenticate user and return {token,user} or null */
  login: async (email, password) => {
    const u = await repo.findByEmail(email);
    if (!u || u.pwd_hash !== hash(password)) return null;
    const user = { id: u.id, email: u.email, role: u.role, branchId: u.branch_id,
                   firstName: u.first_name, lastName: u.last_name,
                   fullName: `${u.first_name||''} ${u.last_name||''}`.trim() };
    const token = generateToken(user);
    tokens.set(token, { userId: u.id, role: u.role, branchId: u.branch_id, issuedAt: Date.now() });
    return { token, user };
  },

  changePassword: (userId, currentPwd, newPwd) => repo.updatePassword(userId, hash(newPwd)),

  logout: token => tokens.delete(token),

  /** Returns user object if token valid */
  getUserFromToken: token => {
    const entry = tokens.get(token);
    if (!entry) return null;
    return { id: entry.userId, role: entry.role, branchId: entry.branchId };
  },

  /** Returns payload or null */
  verifyToken: token => tokens.get(token) || null,

  // stubs for flows not yet migrated
  registerUser: async (data) => {
    // Check duplicate email
    const existing = await repo.findByEmail(data.email);
    if (existing) throw new Error('Email already exists');

    const pwdHash = hash(data.password);
    const newId = await userRepo.create({
      email: data.email,
      pwdHash,
      role: data.role,
      branchId: data.locationId || null,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone
    });

    // If role EMPLOYEE add profile row (basic)
    if (data.role === 'EMPLOYEE') {
      await pool.query(
        `INSERT INTO employees_profiles (employee_id, staff_role, hourly_rate, hire_date)
         VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [newId, data.position || 'WASHER', data.hourlyRate || 25, new Date()]
      );
    }

    return { id: newId, email: data.email, role: data.role, branchId: data.locationId || null };
  },

  updateProfile: () => {}
}; 