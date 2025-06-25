const { query } = require('../core/psql');

class AuthRepository {
  // Creează un utilizator nou
  async createUser(userData) {
    const { 
      username, 
      email, 
      password_hash, 
      salt, 
      role, 
      first_name, 
      last_name, 
      phone 
    } = userData;
    
    const insertSQL = `
      INSERT INTO users (username, email, password_hash, salt, role, first_name, last_name, phone) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING user_id, username, email, role, first_name, last_name, phone, is_active, created_at
    `;
    
    const result = await query(insertSQL, [
      username, email, password_hash, salt, role, first_name, last_name, phone
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește utilizator prin email
  async findUserByEmail(email) {
    const selectSQL = `
      SELECT user_id, username, email, password_hash, salt, role, 
             first_name, last_name, phone, is_active, last_login
      FROM users 
      WHERE email = $1 AND is_active = true 
      LIMIT 1
    `;
    
    const result = await query(selectSQL, [email]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește utilizator prin username
  async findUserByUsername(username) {
    const selectSQL = `
      SELECT user_id, username, email, password_hash, salt, role, 
             first_name, last_name, phone, is_active, last_login
      FROM users 
      WHERE username = $1 AND is_active = true 
      LIMIT 1
    `;
    
    const result = await query(selectSQL, [username]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește utilizator prin ID
  async findUserById(userId) {
    const selectSQL = `
      SELECT user_id, username, email, role, first_name, last_name, 
             phone, is_active, last_login, created_at
      FROM users 
      WHERE user_id = $1
    `;
    
    const result = await query(selectSQL, [userId]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Actualizează ultima autentificare
  async updateLastLogin(userId) {
    const updateSQL = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE user_id = $1
      RETURNING last_login
    `;
    
    const result = await query(updateSQL, [userId]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Verifică dacă email-ul există
  async emailExists(email) {
    const selectSQL = `SELECT 1 FROM users WHERE email = $1`;
    const result = await query(selectSQL, [email]);
    return result && result.length > 0;
  }

  // Verifică dacă username-ul există
  async usernameExists(username) {
    const selectSQL = `SELECT 1 FROM users WHERE username = $1`;
    const result = await query(selectSQL, [username]);
    return result && result.length > 0;
  }

  // Actualizează parola utilizatorului
  async updatePassword(userId, password_hash, salt) {
    const updateSQL = `
      UPDATE users 
      SET password_hash = $2, salt = $3 
      WHERE user_id = $1
      RETURNING user_id
    `;
    
    const result = await query(updateSQL, [userId, password_hash, salt]);
    return result && result.length > 0;
  }

  // Activează/dezactivează utilizator
  async updateUserStatus(userId, isActive) {
    const updateSQL = `
      UPDATE users 
      SET is_active = $2 
      WHERE user_id = $1
      RETURNING user_id, is_active
    `;
    
    const result = await query(updateSQL, [userId, isActive]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Obține toți utilizatorii (pentru admin)
  async getAllUsers(role = null) {
    let selectSQL = `
      SELECT user_id, username, email, role, first_name, last_name, 
             phone, is_active, last_login, created_at
      FROM users
    `;
    
    const params = [];
    if (role) {
      selectSQL += ` WHERE role = $1`;
      params.push(role);
    }
    
    selectSQL += ` ORDER BY created_at DESC`;
    
    return await query(selectSQL, params);
  }

  // Obține statistici utilizatori
  async getUserStats() {
    const statsSQL = `
      SELECT 
        role,
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN last_login > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active_last_month
      FROM users
      GROUP BY role
      ORDER BY 
        CASE role 
          WHEN 'ADMIN' THEN 1 
          WHEN 'MANAGER' THEN 2 
          WHEN 'EMPLOYEE' THEN 3 
          WHEN 'CUSTOMER' THEN 4 
        END
    `;
    
    return await query(statsSQL);
  }
}

module.exports = new AuthRepository(); 