const crypto = require('crypto');
const log = require('../core/logger');
const authRepository = require('../repositories/authRepository');
const customerRepository = require('../repositories/customerRepository');
const employeeRepository = require('../repositories/employeeRepository');

// PBKDF2 parameters
const ITERATIONS = 310000;
const KEYLEN = 32;
const DIGEST = 'sha256';

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
}

function verifyPassword(password, salt, hash) {
  const computedHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
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

function generateUsername(firstName, lastName) {
  const base = `${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${base}${randomSuffix}`;
}

async function registerUser(userData) {
  log.debug(`AuthService: Registering user ${userData.email}`);
  
  try {
    // Check if email already exists
    const emailExists = await authRepository.emailExists(userData.email);
    if (emailExists) {
      throw new Error('User with this email already exists');
    }
    
    // Generate username if not provided
    let username = userData.username;
    if (!username) {
      username = generateUsername(userData.firstName, userData.lastName);
      
      // Ensure username is unique
      let counter = 1;
      while (await authRepository.usernameExists(username)) {
        username = `${generateUsername(userData.firstName, userData.lastName)}${counter}`;
        counter++;
      }
    } else {
      // Check if provided username exists
      const usernameExists = await authRepository.usernameExists(username);
      if (usernameExists) {
        throw new Error('Username already exists');
      }
    }
    
    // Generate salt and hash password
    const salt = generateSalt();
    const password_hash = hashPassword(userData.password, salt);
    
    // Create user
    const newUserData = {
      username,
      email: userData.email.toLowerCase().trim(),
      password_hash,
      salt,
      role: userData.role || 'CUSTOMER',
      first_name: userData.firstName.trim(),
      last_name: userData.lastName.trim(),
      phone: userData.phone?.trim() || null
    };
    
    const user = await authRepository.createUser(newUserData);
    
    if (!user) {
      throw new Error('Failed to create user');
    }
    
    // Create role-specific records
    if (user.role === 'CUSTOMER') {
      // Generate customer code
      const customerCode = `CUS${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
      
      const customerData = {
        user_id: user.user_id,
        customer_code: customerCode,
        company_name: userData.companyName || null,
        billing_address: userData.billingAddress || null,
        preferred_location_id: userData.locationId || null,
        preferred_contact_method: userData.preferredContactMethod || 'EMAIL'
      };
      
      await customerRepository.create(customerData);
      log.debug(`AuthService: Created customer record for user ${userData.email}`);
      
    } else if (['EMPLOYEE', 'MANAGER'].includes(user.role)) {
      if (!userData.locationId) {
        throw new Error('Location ID is required for employees and managers');
      }
      
      // Generate employee code
      const employeeCode = `EMP${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
      
      const employeeData = {
        user_id: user.user_id,
        location_id: userData.locationId,
        employee_code: employeeCode,
        position: userData.position || user.role,
        hourly_rate: userData.hourlyRate || 15.00,
        hire_date: new Date(),
        skills: userData.skills || []
      };
      
      await employeeRepository.create(employeeData);
      log.debug(`AuthService: Created employee record for user ${userData.email}`);
    }
    
    log.info(`AuthService: Successfully registered user ${userData.email} with ID ${user.user_id}`);
    
    return {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at
    };
  } catch (error) {
    log.error(`AuthService: Registration failed for ${userData.email}: ${error.message}`);
    throw error;
  }
}

async function loginUser(identifier, password) {
  log.debug(`AuthService: Login attempt for ${identifier}`);
  
  try {
    // Try to find user by email or username
    let user = await authRepository.findUserByEmail(identifier);
    if (!user) {
      user = await authRepository.findUserByUsername(identifier);
    }
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify password
    const isValid = verifyPassword(password, user.salt, user.password_hash);
    
    if (!isValid) {
      throw new Error('Invalid password');
    }
    
    // Update last login
    await authRepository.updateLastLogin(user.user_id);
    
    // Get additional user data based on role
    let additionalData = {};
    
    if (user.role === 'CUSTOMER') {
      const customer = await customerRepository.findByUserId(user.user_id);
      if (customer) {
        additionalData = {
          customerId: customer.customer_id,
          customerCode: customer.customer_code,
          companyName: customer.company_name,
          loyaltyPoints: customer.loyalty_points,
          preferredLocationId: customer.preferred_location_id,
          preferredLocationName: customer.preferred_location_name
        };
      }
    } else if (['EMPLOYEE', 'MANAGER'].includes(user.role)) {
      const employee = await employeeRepository.findByUserId(user.user_id);
      if (employee) {
        additionalData = {
          employeeId: employee.employee_id,
          employeeCode: employee.employee_code,
          position: employee.position,
          locationId: employee.location_id,
          locationName: employee.location_name,
          skills: employee.skills,
          isAvailable: employee.is_available
        };
      }
    }
    
    // Create token payload
    const tokenPayload = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      ...additionalData,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    const token = signToken(tokenPayload);
    
    // Prepare user data for response
    const userData = {
      id: user.user_id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`,
      phone: user.phone,
      role: user.role,
      lastLogin: user.last_login,
      ...additionalData
    };
    
    log.info(`AuthService: Successful login for ${identifier}`);
    return { token, user: userData };
  } catch (error) {
    log.error(`AuthService: Login failed for ${identifier}: ${error.message}`);
    throw error;
  }
}

async function logout(token) {
  log.debug('AuthService: Processing logout');
  
  try {
    // For now, we just log the logout
    // In a production system, you might want to maintain a blacklist of tokens
    const payload = verifyToken(token);
    if (payload) {
      log.info(`AuthService: User ${payload.email} logged out`);
    }
    
    return true;
  } catch (error) {
    log.error(`AuthService: Logout error: ${error.message}`);
    throw error;
  }
}

async function getUserFromToken(token) {
  try {
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }
    
    // Get fresh user data from database
    const user = await authRepository.findUserById(payload.userId);
    if (!user || !user.is_active) {
      return null;
    }
    
    return {
      id: user.user_id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`,
      phone: user.phone,
      role: user.role,
      lastLogin: user.last_login
    };
  } catch (error) {
    log.error(`AuthService: Token verification error: ${error.message}`);
    return null;
  }
}

async function changePassword(userId, currentPassword, newPassword) {
  log.debug(`AuthService: Password change request for user ${userId}`);
  
  try {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isValid = verifyPassword(currentPassword, user.salt, user.password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Generate new salt and hash
    const newSalt = generateSalt();
    const newPasswordHash = hashPassword(newPassword, newSalt);
    
    // Update password
    const updated = await authRepository.updatePassword(userId, newPasswordHash, newSalt);
    if (!updated) {
      throw new Error('Failed to update password');
    }
    
    log.info(`AuthService: Password changed successfully for user ${userId}`);
    return true;
  } catch (error) {
    log.error(`AuthService: Password change failed for user ${userId}: ${error.message}`);
    throw error;
  }
}

async function updateProfile(userId, profileData) {
  log.debug(`AuthService: Profile update request for user ${userId}`);
  
  try {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update user basic info if provided
    if (profileData.firstName || profileData.lastName || profileData.phone) {
      // Note: We would need to add an update method to authRepository
      // For now, this is a placeholder
      log.debug('Profile update would happen here');
    }
    
    // Update role-specific data
    if (user.role === 'CUSTOMER') {
      const customer = await customerRepository.findByUserId(userId);
      if (customer && (profileData.companyName !== undefined || 
          profileData.billingAddress !== undefined || 
          profileData.preferredLocationId !== undefined)) {
        
        await customerRepository.update(customer.customer_id, {
          company_name: profileData.companyName,
          billing_address: profileData.billingAddress,
          preferred_location_id: profileData.preferredLocationId,
          preferred_contact_method: profileData.preferredContactMethod
        });
      }
    } else if (['EMPLOYEE', 'MANAGER'].includes(user.role)) {
      const employee = await employeeRepository.findByUserId(userId);
      if (employee && (profileData.position !== undefined || 
          profileData.skills !== undefined)) {
        
        await employeeRepository.update(employee.employee_id, {
          position: profileData.position,
          skills: profileData.skills
        });
      }
    }
    
    log.info(`AuthService: Profile updated successfully for user ${userId}`);
    return true;
  } catch (error) {
    log.error(`AuthService: Profile update failed for user ${userId}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  registerUser,
  loginUser,
  logout,
  getUserFromToken,
  changePassword,
  updateProfile,
  verifyToken
}; 