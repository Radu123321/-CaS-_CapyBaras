const log = require('./logger');
const authService = require('../services/authService');

/**
 * Authenticate request and optionally enforce allowed roles.
 * If `allowedRoles` is null ⇒ any authenticated user.
 * If string ⇒ must match; if array ⇒ must include.
 */
function auth(allowedRoles = null) {
  return (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] || null;
    const user = token ? authService.verifyToken(token) : null;
    if (!user) {
      return res.unauth();
    }
    if (allowedRoles) {
      const rolesArr = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      if (!rolesArr.includes(user.role)) {
        return res.forbid();
      }
    }
    req.user = user;
    next();
  };
}

/** Simple request logger middleware */
const logReq = (req, _res, next) => {
  log.info(`${req.method} ${req.url}`);
  next();
};

/**
 * Enforce branch-level scope for MANAGER role.
 * - For GET requests: forces/query-param branchId to manager's branch.
 * - For mutating requests (POST/PUT/PATCH): overrides/sets body.branchId.
 * - For DELETE without body: allows but relies on controller to validate ownership.
 * ADMIN role is not restricted.
 */
function branchScope() {
  return (req, res, next) => {
    if (!req.user || !['MANAGER','EMPLOYEE'].includes(req.user.role)) return next();

    const branchId = req.user.branchId || req.user.branch_id;
    if (!branchId) return res.forbid(); // manager must belong to a branch

    // Ensure req.query exists (server sets it for API routes)
    req.query = req.query || {};

    if (req.method === 'GET') {
      // Force branch filter
      req.query.branchId = branchId;
    } else if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      // Override body branch
      if (req.body && typeof req.body === 'object') {
        req.body.branchId = branchId;
      }
    }
    // For DELETE or others, controller should validate (optional TODO)
    next();
  };
}

module.exports = { auth, logReq, branchScope }; 