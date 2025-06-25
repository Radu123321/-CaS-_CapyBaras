const log = require('../core/logger');
const authService = require('../services/authService');

async function register(req, res) {
  log.info('POST /api/register or /api/auth/register');
  
  try {
    log.debug(`Register request body: ${JSON.stringify(req.body)}`);
    
    const { 
      email, 
      password, 
      username,
      firstName, 
      lastName, 
      phone, 
      role, 
      locationId,
      companyName,
      billingAddress,
      position,
      hourlyRate,
      skills,
      preferredContactMethod
    } = req.body;
    
    // Validation
    if (!email || !password || !firstName || !lastName) {
      log.warn('Register: Missing required fields');
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Missing required fields: email, password, firstName, lastName' 
      }));
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Invalid email format' 
      }));
      return;
    }
    
    // Password validation
    if (password.length < 6) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Password must be at least 6 characters long' 
      }));
      return;
    }
    
    // Username validation if provided
    if (username) {
      if (username.length < 3 || username.length > 20) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false,
          error: 'Username must be between 3 and 20 characters' 
        }));
        return;
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false,
          error: 'Username can only contain letters, numbers, and underscores' 
        }));
        return;
      }
    }
    
    // Role validation
    const validRoles = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER'];
    const userRole = role || 'CUSTOMER';
    if (!validRoles.includes(userRole)) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Invalid role. Must be one of: ' + validRoles.join(', ')
      }));
      return;
    }
    
    // Location validation for employees and managers
    if (['EMPLOYEE', 'MANAGER'].includes(userRole) && !locationId) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Location ID is required for employees and managers'
      }));
      return;
    }
    
    const userData = {
      email: email.toLowerCase().trim(),
      password,
      username: username?.trim() || null,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim() || null,
      role: userRole,
      locationId: locationId || null,
      companyName: companyName?.trim() || null,
      billingAddress: billingAddress?.trim() || null,
      position: position?.trim() || null,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      skills: Array.isArray(skills) ? skills : (skills ? [skills] : []),
      preferredContactMethod: preferredContactMethod || 'EMAIL'
    };
    
    log.debug(`Register: Processing user ${userData.email}`);
    
    const result = await authService.registerUser(userData);
    
    log.info(`Register: Success for user ${userData.email}`);
    res.writeHead(201, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Registration successful! You can now login.',
      data: result
    }));
  } catch (error) {
    log.error(`Register error: ${error.message}`);
    
    let statusCode = 500;
    let errorMessage = 'Registration failed';
    
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      statusCode = 409;
      errorMessage = error.message;
    } else if (error.message.includes('required')) {
      statusCode = 400;
      errorMessage = error.message;
    }
    
    res.writeHead(statusCode, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: errorMessage
    }));
  }
}

async function login(req, res) {
  log.info('POST /api/login or /api/auth/login');
  
  try {
    log.debug(`Login request body: ${JSON.stringify(req.body)}`);
    
    const { identifier, email, username, password } = req.body;
    
    // Support multiple ways to login
    const loginIdentifier = identifier || email || username;
    
    if (!loginIdentifier || !password) {
      log.warn('Login: Missing login credentials');
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Email/username and password are required' 
      }));
      return;
    }
    
    log.debug(`Login: Processing user ${loginIdentifier}`);
    
    const result = await authService.loginUser(loginIdentifier.toLowerCase().trim(), password);
    
    log.info(`Login: Success for user ${loginIdentifier}`);
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Login successful',
      data: {
        token: result.token,
        user: result.user
      }
    }));
  } catch (error) {
    log.error(`Login error: ${error.message}`);
    
    let statusCode = 401;
    let errorMessage = 'Invalid credentials';
    
    if (error.message.includes('not found')) {
      errorMessage = 'No account found with this email/username';
    } else if (error.message.includes('Invalid password')) {
      errorMessage = 'Invalid password';
    }
    
    res.writeHead(statusCode, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: errorMessage
    }));
  }
}

async function logout(req, res) {
  log.info('POST /api/auth/logout');
  
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      await authService.logout(token);
    }
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Logout successful'
    }));
  } catch (error) {
    log.error(`Logout error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Logout failed'
    }));
  }
}

async function getProfile(req, res) {
  log.info('GET /api/auth/profile');
  
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      res.writeHead(401, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'No token provided'
      }));
      return;
    }
    
    const user = await authService.getUserFromToken(token);
    
    if (!user) {
      res.writeHead(401, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'Invalid or expired token'
      }));
      return;
    }
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: user
    }));
  } catch (error) {
    log.error(`Get profile error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Failed to get profile'
    }));
  }
}

async function changePassword(req, res) {
  log.info('POST /api/auth/change-password');
  
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      res.writeHead(401, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'No token provided'
      }));
      return;
    }
    
    const payload = authService.verifyToken(token);
    if (!payload) {
      res.writeHead(401, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'Invalid or expired token'
      }));
      return;
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'Current password and new password are required'
      }));
      return;
    }
    
    if (newPassword.length < 6) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'New password must be at least 6 characters long'
      }));
      return;
    }
    
    await authService.changePassword(payload.userId, currentPassword, newPassword);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Password changed successfully'
    }));
  } catch (error) {
    log.error(`Change password error: ${error.message}`);
    
    let statusCode = 500;
    let errorMessage = 'Failed to change password';
    
    if (error.message.includes('incorrect')) {
      statusCode = 400;
      errorMessage = error.message;
    }
    
    res.writeHead(statusCode, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: errorMessage
    }));
  }
}

async function updateProfile(req, res) {
  log.info('PUT /api/auth/profile');
  
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      res.writeHead(401, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'No token provided'
      }));
      return;
    }
    
    const payload = authService.verifyToken(token);
    if (!payload) {
      res.writeHead(401, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'Invalid or expired token'
      }));
      return;
    }
    
    const profileData = req.body;
    
    await authService.updateProfile(payload.userId, profileData);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Profile updated successfully'
    }));
  } catch (error) {
    log.error(`Update profile error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Failed to update profile'
    }));
  }
}

module.exports = {
  register,
  login,
  logout,
  getProfile,
  changePassword,
  updateProfile
}; 