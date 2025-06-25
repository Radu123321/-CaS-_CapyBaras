const log = require('./logger');

// Minimal in-memory router (method + path → handler)
// Now supports parameterized routes like /api/locations/:id

const routes = {};

function key(method, path) {
  return `${method.toUpperCase()} ${path}`;
}

function add(method, path, handler) {
  log.debug(`Route registered: ${method.toUpperCase()} ${path}`);
  routes[key(method, path)] = handler;
}

function dispatch(method, path, req, res) {
  const routeKey = key(method, path);
  
  // Initialize params object
  req.params = {};
  
  // First try exact match
  if (routes[routeKey]) {
    log.debug(`Dispatching ${method} ${path} (exact match)`);
    return routes[routeKey](req, res);
  }
  
  // Try pattern matching for parameterized routes
  for (const registeredRoute in routes) {
    if (registeredRoute.startsWith(method.toUpperCase())) {
      const registeredPath = registeredRoute.substring(method.length + 1);
      
      // Check if this is a parameterized route match
      const params = extractParams(path, registeredPath);
      if (params !== null) {
        // Add extracted parameters to request
        req.params = params;
        log.debug(`Dispatching ${method} ${path} (pattern match: ${registeredPath}), params:`, params);
        return routes[registeredRoute](req, res);
      }
    }
  }
  
  // 404 fallback
  log.warn(`Route not found: ${method} ${path}`);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
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

module.exports = { add, dispatch }; 