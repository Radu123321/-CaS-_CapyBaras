const log = require('./logger');
const { verifyToken } = require('../services/authService');

// Simple authentication middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    log.warn('Auth: Missing or invalid authorization header');
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Authorization required' }));
    return;
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const payload = verifyToken(token);
    
    if (!payload) {
      log.warn('Auth: Invalid token');
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid token' }));
      return;
    }
    
    // Add user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      locationId: payload.locationId
    };
    
    log.debug(`Auth: Authenticated user ${payload.email}`);
    next();
  } catch (error) {
    log.error(`Auth: Token verification error: ${error.message}`);
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid token' }));
  }
}

// Optional auth - doesn't block if no token, but sets user if valid token provided
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No auth provided, continue without user
    next();
    return;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = verifyToken(token);
    
    if (payload) {
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        locationId: payload.locationId
      };
      log.debug(`Auth: Optional auth successful for ${payload.email}`);
    }
  } catch (error) {
    log.debug(`Auth: Optional auth failed: ${error.message}`);
    // Continue anyway for optional auth
  }
  
  next();
}

// Check if user has specific role
function requireRole(role) {
  return async function(req, res, next) {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Authentication required' }));
      return;
    }
    
    // For now, just check if user exists - role checking can be enhanced later
    // TODO: Query user_roles table for actual role checking
    log.debug(`Auth: Role check for ${role} - user ${req.user.email}`);
    next();
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole
}; 