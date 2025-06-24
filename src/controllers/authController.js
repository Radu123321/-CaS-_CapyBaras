const log = require('../core/logger');
const authService = require('../services/authService');

async function register(req, res) {
  log.info('POST /api/register or /api/auth/register');
  
  try {
    log.debug(`Register request body: ${JSON.stringify(req.body)}`);
    
    const { email, password, full_name } = req.body;
    
    // Validation
    if (!email || !password || !full_name) {
      log.warn('Register: Missing required fields');
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Missing required fields: email, password, full_name' 
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
    
    const userData = {
      email: email.toLowerCase().trim(),
      password,
      full_name: full_name.trim()
    };
    
    log.debug(`Register: Processing user ${userData.email}`);
    
    const result = await authService.registerUser(userData);
    
    log.info(`Register: Success for user ${userData.email}`);
    res.writeHead(201, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      message: "User registered successfully",
      userId: result.userId
    }));
  } catch (error) {
    log.error(`Register error: ${error.message}`);
    
    let statusCode = 500;
    let errorMessage = 'Registration failed';
    
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      statusCode = 409;
      errorMessage = 'An account with this email already exists';
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
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      log.warn('Login: Missing email or password');
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Email and password are required' 
      }));
      return;
    }
    
    log.debug(`Login: Processing user ${email}`);
    
    const result = await authService.loginUser(email.toLowerCase().trim(), password);
    
    log.info(`Login: Success for user ${email}`);
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      token: result.token,
      userId: result.user.id
    }));
  } catch (error) {
    log.error(`Login error: ${error.message}`);
    
    let statusCode = 401;
    let errorMessage = 'Invalid email or password';
    
    if (error.message.includes('not found')) {
      errorMessage = 'No account found with this email';
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
    res.writeHead(401, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Invalid or expired token'
    }));
  }
}

module.exports = { 
  register, 
  login, 
  logout, 
  getProfile 
}; 