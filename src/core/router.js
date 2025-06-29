const log = require('./logger');

// Minimal in-memory router (method + path → handler)
// Now supports parameterized routes like /api/locations/:id

const routes = {};
const globalMiddlewares = [];

function key(method, path) {
  return `${method.toUpperCase()} ${path}`;
}

/**
 * Register a route.
 * Signature options:
 *   add('GET','/path', handler)
 *   add('POST','/path', [mw1,mw2], handler)
 */
function add(method, path, middlewares, handler) {
  if (typeof middlewares === 'function') {
    handler = middlewares;
    middlewares = [];
  }
  if (!Array.isArray(middlewares)) middlewares = [middlewares].filter(Boolean);
  routes[key(method, path)] = { handler, middlewares };
  log.debug(`Route registered: ${method.toUpperCase()} ${path}`);
}

function use(mw) { globalMiddlewares.push(mw); }

function dispatch(method, path, req, res) {
  req.params = {};
  const routeKey = key(method, path);

  // exact
  if (routes[routeKey]) {
    return runChain([...globalMiddlewares, ...routes[routeKey].middlewares, routes[routeKey].handler], req, res);
  }
  // param match
  for (const rk in routes) {
    if (!rk.startsWith(method.toUpperCase())) continue;
    const registeredPath = rk.substring(method.length + 1);
    const params = extractParams(path, registeredPath);
    if (params) {
      req.params = params;
      const { handler, middlewares } = routes[rk];
      return runChain([...globalMiddlewares, ...middlewares, handler], req, res);
    }
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'Route not found' }));
}

function runChain(chain, req, res, idx = 0) {
  if (idx >= chain.length) return; // done
  const next = () => runChain(chain, req, res, idx + 1);
  chain[idx](req, res, next);
}

// Extract parameters from URL path using route pattern
function extractParams(actualPath, patternPath) {
  const actualParts = actualPath.split('/');
  const patternParts = patternPath.split('/');
  
  if (actualParts.length !== patternParts.length) {
    return null;
  }
  
  const params = {};
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const actualPart = actualParts[i];
    
    // If pattern part starts with :, it's a parameter - extract it
    if (patternPart.startsWith(':')) {
      const paramName = patternPart.substring(1); // Remove the ':'
      params[paramName] = actualPart;
      continue;
    }
    
    // Exact match required for non-parameter parts
    if (patternPart !== actualPart) {
      return null;
    }
  }
  
  return params;
}

// Simple pattern matching for routes like /api/locations/:id (legacy function)
function matchesPattern(actualPath, patternPath) {
  return extractParams(actualPath, patternPath) !== null;
}

module.exports = { add, dispatch, use }; 