const log = require('./logger');
const authLib = require('./auth'); // expects verify(token) -> user or null

function auth(requiredRole = null) {
  return (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] || null;
    const user = token ? authLib.verifyToken?.(token) || authLib.verify?.(token) : null;
    if (!user) {
      return res.unauth();
    }
    if (requiredRole && user.role !== requiredRole) {
      return res.forbid();
    }
    req.user = user;
    next();
  };
}

const logReq = (req, _res, next) => {
  log.info(`${req.method} ${req.url}`);
  next();
};

module.exports = { auth, logReq }; 