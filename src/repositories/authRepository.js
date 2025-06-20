const { query } = require('../core/psql');

async function createUser(email, hashedPassword, full_name, defaultRole = 'CUSTOMER') {
  const insertSQL = `
    INSERT INTO users (email, password_hash, full_name, default_role) 
    VALUES ($1, $2, $3, $4)
    RETURNING user_id
  `;
  
  const result = await query(insertSQL, [email, hashedPassword, full_name, defaultRole]);
  return result && result.length > 0 ? result[0] : null;
}

async function createUserRole(userId, role) {
  const roleSQL = `INSERT INTO user_roles (user_id, role) VALUES ($1, $2)`;
  await query(roleSQL, [userId, role]);
}

async function findUserByEmail(email) {
  const selectSQL = `SELECT user_id, password_hash FROM users WHERE email = $1 AND is_active = true LIMIT 1`;
  const rows = await query(selectSQL, [email]);
  return rows && rows.length > 0 ? rows[0] : null;
}

module.exports = {
  createUser,
  createUserRole,
  findUserByEmail
}; 