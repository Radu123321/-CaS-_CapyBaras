const crypto = require('crypto');
const log = require('../core/logger');
const { query } = require('../core/psql');

// PBKDF2 parameters
const ITERATIONS = 310000;
const KEYLEN = 32;
const DIGEST = 'sha256';

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST);
  return Buffer.concat([salt, hash]).toString('base64');
}

function verifyPassword(password, stored) {
  const buf = Buffer.from(stored, 'base64');
  const salt = buf.subarray(0, 16);
  const hash = buf.subarray(16);
  const calc = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST);
  return crypto.timingSafeEqual(hash, calc);
}

// JWT-like token implementation
const secret = process.env.JWT_SECRET || 'cas-super-secret-key-2024';

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(payload));
  const data = `${encHeader}.${encPayload}`;
  const signature = base64url(crypto.createHmac('sha256', secret).update(data).digest());
  return `${data}.${signature}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [encHeader, encPayload, signature] = parts;
  const data = `${encHeader}.${encPayload}`;
  const expected = base64url(crypto.createHmac('sha256', secret).update(data).digest());
  if (signature !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(encPayload, 'base64').toString());
    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function registerUser(userData) {
  log.debug(`AuthService: Registering user ${userData.email}`);
  
  const hashedPassword = hashPassword(userData.password);
  
  try {
    // Check if user already exists
    const existingUser = await query(
      'SELECT user_id FROM users WHERE email = $1',
      [userData.email]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists');
    }
    
    // Insert user into users table
    const insertUserSql = `
      INSERT INTO users (email, password_hash, full_name, user_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING user_id, email, full_name, user_type, created_at
    `;
    
    const fullName = `${userData.firstName} ${userData.lastName}`;
    
    const userResult = await query(insertUserSql, [
      userData.email,
      hashedPassword,
      fullName,
      userData.role
    ]);
    
    if (userResult.rows.length === 0) {
      throw new Error('Failed to create user');
    }
    
    const user = userResult.rows[0];
    
    // If role is not ADMIN, create employee record (simplified without status check)
    if (userData.role !== 'ADMIN' && userData.locationId) {
      const insertEmployeeSql = `
        INSERT INTO employees (user_id, first_name, last_name, email, phone, role, location_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id
      `;
      
      try {
        await query(insertEmployeeSql, [
          user.user_id,
          userData.firstName,
          userData.lastName,
          userData.email,
          userData.phone,
          userData.role,
          userData.locationId
        ]);
        log.debug(`AuthService: Created employee record for user ${userData.email}`);
      } catch (empError) {
        log.warn(`AuthService: Failed to create employee record for user ${userData.email}: ${empError.message}`);
        // Don't fail the registration if employee creation fails
      }
    }
    
    log.info(`AuthService: Successfully registered user ${userData.email} with ID ${user.user_id}`);
    
    return {
      userId: user.user_id,
      email: user.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      createdAt: user.created_at
    };
  } catch (error) {
    log.error(`AuthService: Registration failed for ${userData.email}: ${error.message}`);
    throw error;
  }
}

async function loginUser(email, password) {
  log.debug(`AuthService: Login attempt for ${email}`);
  
  try {
    // Simplified query without status check
    const userSql = `
      SELECT 
        u.user_id,
        u.email,
        u.password_hash,
        u.full_name,
        u.user_type,
        u.created_at,
        e.first_name,
        e.last_name,
        e.role as employee_role,
        e.location_id,
        e.phone,
        l.name as location_name
      FROM users u
      LEFT JOIN employees e ON u.user_id = e.user_id
      LEFT JOIN locations l ON e.location_id = l.location_id
      WHERE u.email = $1
    `;
    
    const result = await query(userSql, [email]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValid = verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      throw new Error('Invalid password');
    }
    
    // Create token payload
    const tokenPayload = {
      userId: user.user_id,
      email: user.email,
      role: user.employee_role || user.user_type,
      locationId: user.location_id,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    const token = signToken(tokenPayload);
    
    // Prepare user data for response
    const userData = {
      id: user.user_id,
      email: user.email,
      firstName: user.first_name || user.full_name?.split(' ')[0] || 'User',
      lastName: user.last_name || user.full_name?.split(' ').slice(1).join(' ') || '',
      fullName: user.full_name,
      role: user.employee_role || user.user_type,
      locationId: user.location_id,
      locationName: user.location_name,
      phone: user.phone,
      createdAt: user.created_at
    };
    
    log.info(`AuthService: Successful login for ${email}`);
    return { token, user: userData };
  } catch (error) {
    log.error(`AuthService: Login failed for ${email}: ${error.message}`);
    throw error;
  }
}

// Token blacklist for logout (simple in-memory store)
const tokenBlacklist = new Set();

async function logout(token) {
  log.debug('AuthService: Logout request');
  
  try {
    // Add token to blacklist
    tokenBlacklist.add(token);
    
    // Clean up old tokens periodically (simple cleanup)
    if (tokenBlacklist.size > 1000) {
      tokenBlacklist.clear();
    }
    
    log.info('AuthService: Successful logout');
    return { message: 'Logout successful' };
  } catch (error) {
    log.error(`AuthService: Logout failed: ${error.message}`);
    throw error;
  }
}

async function getUserFromToken(token) {
  log.debug('AuthService: Get user from token');
  
  try {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      throw new Error('Token is invalid');
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      throw new Error('Invalid or expired token');
    }
    
    // Get fresh user data (simplified query)
    const userSql = `
      SELECT 
        u.user_id,
        u.email,
        u.full_name,
        u.user_type,
        u.created_at,
        e.first_name,
        e.last_name,
        e.role as employee_role,
        e.location_id,
        e.phone,
        l.name as location_name
      FROM users u
      LEFT JOIN employees e ON u.user_id = e.user_id
      LEFT JOIN locations l ON e.location_id = l.location_id
      WHERE u.user_id = $1
    `;
    
    const result = await query(userSql, [payload.userId]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = result.rows[0];
    
    const userData = {
      id: user.user_id,
      email: user.email,
      firstName: user.first_name || user.full_name?.split(' ')[0] || 'User',
      lastName: user.last_name || user.full_name?.split(' ').slice(1).join(' ') || '',
      fullName: user.full_name,
      role: user.employee_role || user.user_type,
      locationId: user.location_id,
      locationName: user.location_name,
      phone: user.phone,
      createdAt: user.created_at
    };
    
    return userData;
  } catch (error) {
    log.error(`AuthService: Get user from token failed: ${error.message}`);
    throw error;
  }
}

module.exports = { 
  hashPassword, 
  verifyPassword, 
  signToken, 
  verifyToken, 
  registerUser,
  loginUser,
  logout,
  getUserFromToken
}; 