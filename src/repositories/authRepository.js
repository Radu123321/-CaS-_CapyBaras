const pool = require('../core/psql');

class AuthRepository {
  /** Return user with pwd_hash for login */
  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    return rows[0] || null;
  }

  updatePassword(userId, newHash) {
    return pool.query('UPDATE users SET pwd_hash=$2, updated_at=now() WHERE id=$1', [userId, newHash]);
  }
}

module.exports = new AuthRepository(); 