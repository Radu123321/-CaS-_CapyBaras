const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const config = require('../config');
const router = require('./router');
const { parseRequest } = require('./json');
const log = require('./logger');
const scheduler = require('./scheduler');
const { performHandshake } = require('./websocket');
const { auth, logReq, branchScope } = require('./middleware');

// Toggle to enable/disable built-in WebSocket support
const WEBSOCKET_ENABLED = false;

// REGISTER INITIAL ROUTES
router.add('GET', '/api/ping', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString() }
  }));
});

router.add('GET', '/api/scheduler/status', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    success: true, 
    data: scheduler.getStatus() 
  }));
});

const authController = require('../controllers/authController');
router.add('POST', '/api/register', authController.register);
router.add('POST', '/api/login', authController.login);

// Auth routes for frontend integration
router.add('POST', '/api/auth/register', authController.register);
router.add('POST', '/api/auth/login', authController.login);
router.add('POST', '/api/auth/logout', authController.logout);
router.add('GET', '/api/auth/profile', authController.getProfile);

const locationController = require('../controllers/locationController');
const { auth: requireAuth } = require('../core/middleware');

router.add('GET',  '/api/locations', locationController.getAllLocations);
router.add('GET',  '/api/locations/:id', locationController.getLocationById);

// Admin-only modifications
router.add('POST',   '/api/locations',          [requireAuth('ADMIN')], locationController.createLocation);
router.add('PUT',    '/api/locations/:id',      [requireAuth('ADMIN')], locationController.updateLocation);
router.add('DELETE', '/api/locations/:id',      [requireAuth('ADMIN')], locationController.deleteLocation);

const serviceController = require('../controllers/serviceController');
router.add('GET', '/api/services', serviceController.getAllServices);
router.add('POST', '/api/services', serviceController.createService);
router.add('GET', '/api/services/:id', serviceController.getServiceById);
router.add('PUT', '/api/services/:id', serviceController.updateService);
router.add('DELETE', '/api/services/:id', serviceController.deleteService);

const customerController = require('../controllers/customerController');
router.add('GET', '/api/customers', customerController.getAllCustomers);
router.add('POST', '/api/customers', customerController.createCustomer);
router.add('GET', '/api/customers/search', customerController.searchCustomers);
router.add('GET', '/api/customers/vip', customerController.getVIPCustomers);
router.add('GET', '/api/customers/top', customerController.getTopCustomers);
router.add('GET', '/api/customers/stats', customerController.getCustomerStats);
router.add('GET', '/api/customers/code/:code', customerController.getCustomerByCode);
router.add('GET', '/api/customers/:id', customerController.getCustomerById);
router.add('PUT', '/api/customers/:id', customerController.updateCustomer);
router.add('PUT', '/api/customers/:id/loyalty', customerController.updateLoyaltyPoints);
router.add('DELETE', '/api/customers/:id', customerController.deleteCustomer);

const employeeController = require('../controllers/employeeController');
router.add('GET', '/api/employees', employeeController.getAllEmployees);
router.add('POST', '/api/employees', employeeController.createEmployee);
router.add('GET', '/api/employees/search', employeeController.searchEmployees);
router.add('GET', '/api/employees/position/:position', employeeController.getEmployeesByPosition);
router.add('GET', '/api/employees/location/:locationId', employeeController.getEmployeesByLocation);
router.add('GET', '/api/employees/stats', employeeController.getEmployeeStats);
router.add('GET', '/api/employees/code/:code', employeeController.getEmployeeByCode);
router.add('GET', '/api/employees/:id', employeeController.getEmployeeById);
router.add('PUT', '/api/employees/:id', employeeController.updateEmployee);
router.add('PUT', '/api/employees/:id/skills', employeeController.addSkill);
router.add('DELETE', '/api/employees/:id/skills', employeeController.removeSkill);
router.add('PUT', '/api/employees/:id/availability', employeeController.updateAvailability);
router.add('DELETE', '/api/employees/:id', employeeController.deleteEmployee);
router.add('GET', '/api/employees/type/:type', employeeController.getEmployeesByType);

const orderController = require('../controllers/orderController');
router.add('GET', '/api/orders', orderController.getAllOrders);
router.add('POST', '/api/orders', orderController.createOrder);
router.add('GET', '/api/orders/search', orderController.searchOrders);
router.add('GET', '/api/orders/active', orderController.getActiveOrders);
router.add('GET', '/api/orders/availability', orderController.getOrderAvailability);
router.add('GET', '/api/orders/customer/:customerId', orderController.getOrdersByCustomer);
router.add('GET', '/api/orders/employee/:employeeId', orderController.getOrdersByEmployee);
router.add('GET', '/api/orders/stats', orderController.getOrderStats);
router.add('GET', '/api/orders/:id', orderController.getOrderById);
router.add('PUT', '/api/orders/:id', orderController.updateOrder);
router.add('PUT', '/api/orders/:id/status', orderController.updateOrderStatus);
router.add('PUT', '/api/orders/:id/assign', orderController.assignEmployee);
router.add('PUT', '/api/orders/:id/start', orderController.startOrder);
router.add('PUT', '/api/orders/:id/complete', orderController.completeOrder);
router.add('PUT', '/api/orders/:id/cancel', orderController.cancelOrder);
router.add('DELETE', '/api/orders/:id/cancel', orderController.cancelOrder);
router.add('DELETE', '/api/orders/:id', orderController.cancelOrder);

const transportController = require('../controllers/transportController');
router.add('GET', '/api/transports', transportController.getAllTransports);
router.add('POST', '/api/transports', transportController.createTransport);
router.add('GET', '/api/transports/active', transportController.getActiveTransports);
router.add('GET', '/api/transports/:id', transportController.getTransportById);
router.add('GET', '/api/transports/order/:orderId', transportController.getTransportByOrderId);
router.add('PUT', '/api/transports/:id', transportController.updateTransport);
router.add('PUT', '/api/transports/:id/status', transportController.updateTransportStatus);
router.add('PUT', '/api/transports/:id/start', transportController.startTransport);
router.add('PUT', '/api/transports/:id/complete', transportController.completeTransport);
router.add('DELETE', '/api/transports/:id/cancel', transportController.cancelTransport);

const inventoryController = require('../controllers/inventoryController');
router.add('GET', '/api/resources', inventoryController.getAllResources);
router.add('POST', '/api/resources', inventoryController.createResource);
router.add('GET', '/api/inventory', inventoryController.getAllInventory);
router.add('GET', '/api/inventory/location/:locationId', inventoryController.getInventoryByLocation);
router.add('PUT', '/api/inventory/location/:locationId/resource/:resourceId', inventoryController.updateInventoryQuantity);
router.add('POST', '/api/inventory/location/:locationId/restock', inventoryController.restockResources);
router.add('POST', '/api/inventory/consume', inventoryController.consumeResourcesForOrder);
router.add('GET', '/api/inventory/alerts', inventoryController.getInventoryAlerts);
router.add('GET', '/api/inventory/low-stock', inventoryController.getLowStockItems);
router.add('GET', '/api/inventory/export/:id', inventoryController.exportInventoryCsv);
router.add('POST', '/api/inventory/import/:id', inventoryController.importInventoryCsv);
router.add('GET', '/api/inventory/export-all', [requireAuth('ADMIN')], inventoryController.exportAllInventoryCsv);

// Equipment management routes
const equipmentController = require('../controllers/equipmentController');
router.add('GET', '/api/equipment', equipmentController.getAllEquipment);
router.add('POST', '/api/equipment', equipmentController.createEquipment);
router.add('GET', '/api/equipment/dashboard', equipmentController.getDashboard);
router.add('GET', '/api/equipment/statuses', equipmentController.getEquipmentStatuses);
router.add('POST', '/api/equipment/check-status', equipmentController.checkEquipmentStatus);
router.add('GET', '/api/equipment/:id', equipmentController.getEquipmentById);
router.add('PUT', '/api/equipment/:id', equipmentController.updateEquipment);
router.add('POST', '/api/equipment/:id/maintenance', equipmentController.scheduleMaintenance);
router.add('PUT', '/api/maintenance/:id/complete', equipmentController.completeMaintenance);

// WebSocket management routes
const websocketController = require('../controllers/websocketController');
router.add('GET', '/api/websocket/stats', websocketController.getWebSocketStats);
router.add('POST', '/api/websocket/broadcast', websocketController.broadcastToAllClients);
router.add('POST', '/api/websocket/broadcast/location/:id', websocketController.broadcastToLocationClients);

// RSS feed routes
const rssController = require('../controllers/rssController');
router.add('GET', '/rss', rssController.getGeneralRSSFeed);
router.add('GET', '/rss/location/:id', rssController.getLocationRSSFeed);
router.add('GET', '/rss/orders', rssController.getOrderUpdatesRSSFeed);
router.add('GET', '/rss/inventory', rssController.getInventoryAlertsRSSFeed);

// Alert management routes
const alertController = require('../controllers/alertController');
router.add('GET', '/api/alerts/test-email', alertController.sendTestEmail);
router.add('GET', '/api/alerts/test-smtp', alertController.testSMTPConnection);
router.add('POST', '/api/alerts/equipment-failure', alertController.triggerEquipmentFailureAlert);
router.add('POST', '/api/alerts/staff-unavailable', alertController.triggerStaffUnavailabilityAlert);
router.add('POST', '/api/alerts/power-outage', alertController.triggerPowerOutageAlert);
router.add('POST', '/api/alerts/critical-inventory', alertController.triggerCriticalInventoryAlert);
router.add('POST', '/api/alerts/transport-delay', alertController.triggerTransportDelayAlert);
router.add('POST', '/api/alerts/maintenance-due', alertController.triggerMaintenanceDueAlert);
router.add('GET', '/api/alerts/history', alertController.getAlertHistory);
router.add('GET', '/api/alerts/stats', alertController.getDeliveryStats);
router.add('GET', '/api/alerts/types', alertController.getAvailableAlertTypes);
router.add('GET', '/api/alerts/config', alertController.getConfiguration);
router.add('POST', '/api/alerts/config', alertController.updateConfiguration);
router.add('GET', '/api/alerts/:alertId', alertController.getAlert);
router.add('DELETE', '/api/alerts/history', alertController.clearOldAlerts);

// Weather management routes
const weatherController = require('../controllers/weatherController');
router.add('POST', '/api/weather', weatherController.addWeatherSnapshot);
router.add('GET', '/api/weather/current', weatherController.getCurrentWeatherAll);
router.add('GET', '/api/weather/location/:id', weatherController.getCurrentWeatherByLocation);
router.add('GET', '/api/weather/impact/location/:id/service/:type', weatherController.analyzeServiceImpact);
router.add('GET', '/api/weather/recommendations/location/:id', weatherController.getSchedulingRecommendations);
router.add('POST', '/api/weather/update-all', weatherController.updateAllWeatherData);
router.add('POST', '/api/weather/check-adverse', weatherController.checkAdverseConditions);
router.add('GET', '/api/weather/service-types', weatherController.getServiceTypes);

// Statistics and dashboard routes
const statsController = require('../controllers/statsController');
router.add('GET', '/api/stats/dashboard', statsController.getDashboard);
router.add('GET', '/api/stats/summary', statsController.getDashboardSummary);
router.add('GET', '/api/stats/system-status', statsController.getSystemStatus);
router.add('GET', '/api/stats/performance', statsController.getPerformanceStats);
router.add('GET', '/api/stats/orders', statsController.getOrderStats);
router.add('GET', '/api/stats/orders/trends', statsController.getOrderTrends);
router.add('GET', '/api/stats/resources', statsController.getResourceStats);
router.add('GET', '/api/stats/resources/efficiency', statsController.getResourceEfficiency);
router.add('GET', '/api/stats/equipment', statsController.getEquipmentStats);
router.add('GET', '/api/stats/equipment/health', statsController.getEquipmentHealth);
router.add('GET', '/api/stats/employees', statsController.getEmployeeStats);
router.add('GET', '/api/stats/employees/productivity', statsController.getEmployeeProductivity);
router.add('GET', '/api/stats/weather', statsController.getWeatherImpact);
router.add('GET', '/api/stats/revenue', statsController.getRevenueStats);
router.add('GET', '/api/stats/kpis', statsController.getPerformanceKPIs);
router.add('POST', '/api/stats/reports', statsController.generateReport);
router.add('GET', '/api/stats/locations/comparison', statsController.getLocationComparison);
router.add('GET', '/api/stats/appointments', statsController.getAppointmentStats);
router.add('GET', '/api/stats/periods', statsController.getAvailablePeriods);
router.add('GET', '/api/stats/report-types', statsController.getReportTypes);

// Notification and browser alerts routes
const notificationController = require('../controllers/notificationController');
router.add('GET', '/api/notifications/recent', notificationController.getRecentNotifications);
router.add('POST', '/api/notifications/subscribe', notificationController.subscribe);
router.add('POST', '/api/notifications/unsubscribe', notificationController.unsubscribe);
router.add('PUT', '/api/notifications/preferences', notificationController.updatePreferences);
router.add('POST', '/api/notifications/test', notificationController.sendTestNotification);
router.add('POST', '/api/notifications/send', notificationController.sendCustomNotification);
router.add('GET', '/api/notifications/stats', notificationController.getNotificationStats);
router.add('GET', '/api/notifications/subscribers', notificationController.getSubscribers);
router.add('GET', '/api/notifications/config', notificationController.getNotificationConfig);
router.add('PUT', '/api/notifications/config', notificationController.updateNotificationConfig);
router.add('GET', '/api/notifications/types', notificationController.getNotificationTypes);
router.add('GET', '/api/notifications/priorities', notificationController.getPriorities);
router.add('GET', '/api/notifications/channels', notificationController.getChannels);

// Exception detection routes
router.add('POST', '/api/exceptions/detect/staff', notificationController.detectStaffIssues);
router.add('POST', '/api/exceptions/detect/power', notificationController.detectPowerIssues);
router.add('POST', '/api/exceptions/detect/equipment', notificationController.detectEquipmentIssues);
router.add('POST', '/api/exceptions/detect/transport', notificationController.detectTransportIssues);
router.add('POST', '/api/exceptions/detect/all', notificationController.runFullExceptionDetection);

// Shift management routes
const shiftController = require('../controllers/shiftController');
router.add('GET', '/api/shifts', shiftController.getAllShifts);
router.add('POST', '/api/shifts', shiftController.createShift);
router.add('GET', '/api/shifts/active', shiftController.getActiveShifts);
router.add('GET', '/api/shifts/today', shiftController.getTodayScheduled);
router.add('GET', '/api/shifts/statuses', shiftController.getValidStatuses);
router.add('GET', '/api/shifts/stats', shiftController.getShiftStats);
router.add('GET', '/api/shifts/attendance', shiftController.getAttendanceReport);
router.add('GET', '/api/shifts/weekly/:locationId', shiftController.getWeeklySchedule);
router.add('GET', '/api/shifts/employee/:employeeId', shiftController.getShiftsByEmployee);
router.add('GET', '/api/shifts/location/:locationId', shiftController.getShiftsByLocation);
router.add('GET', '/api/shifts/:id', shiftController.getShiftById);
router.add('PUT', '/api/shifts/:id', shiftController.updateShift);
router.add('PUT', '/api/shifts/:id/status', shiftController.updateShiftStatus);
router.add('PUT', '/api/shifts/:id/start', shiftController.startShift);
router.add('PUT', '/api/shifts/:id/end', shiftController.endShift);
router.add('DELETE', '/api/shifts/:id', shiftController.deleteShift);

// Maintenance management routes
const maintenanceController = require('../controllers/maintenanceController');
router.add('GET', '/api/maintenance', maintenanceController.getAllMaintenance);
router.add('POST', '/api/maintenance', maintenanceController.createMaintenance);
router.add('GET', '/api/maintenance/today', maintenanceController.getTodayScheduled);
router.add('GET', '/api/maintenance/overdue', maintenanceController.getOverdue);
router.add('GET', '/api/maintenance/urgent', maintenanceController.getUrgent);
router.add('GET', '/api/maintenance/types', maintenanceController.getMaintenanceTypes);
router.add('GET', '/api/maintenance/priorities', maintenanceController.getPriorityLevels);
router.add('GET', '/api/maintenance/stats', maintenanceController.getMaintenanceStats);
router.add('GET', '/api/maintenance/upcoming', maintenanceController.getUpcomingSchedule);
router.add('GET', '/api/maintenance/equipment/:equipmentId', maintenanceController.getMaintenanceByEquipment);
router.add('GET', '/api/maintenance/:id', maintenanceController.getMaintenanceById);
router.add('PUT', '/api/maintenance/:id', maintenanceController.updateMaintenance);
router.add('PUT', '/api/maintenance/:id/start', maintenanceController.startMaintenance);
router.add('PUT', '/api/maintenance/:id/complete', maintenanceController.completeMaintenance);
router.add('DELETE', '/api/maintenance/:id', maintenanceController.deleteMaintenance);

// Recurring schedule management routes
const recurrenceController = require('../controllers/recurrenceController');
router.add('GET', '/api/recurrences', recurrenceController.getAllRecurrences);
router.add('POST', '/api/recurrences', recurrenceController.createRecurrence);
router.add('GET', '/api/recurrences/due', recurrenceController.getDueRecurrences);
router.add('GET', '/api/recurrences/expired', recurrenceController.getExpiredRecurrences);
router.add('GET', '/api/recurrences/stats', recurrenceController.getRecurrenceStats);
router.add('GET', '/api/recurrences/stats/patterns', recurrenceController.getStatsByPattern);
router.add('GET', '/api/recurrences/customer/:customerId', recurrenceController.getRecurrencesByCustomer);
router.add('GET', '/api/recurrences/:id', recurrenceController.getRecurrenceById);
router.add('PUT', '/api/recurrences/:id', recurrenceController.updateRecurrence);
router.add('PUT', '/api/recurrences/:id/status', recurrenceController.updateActiveStatus);
router.add('POST', '/api/recurrences/process', recurrenceController.processRecurrences);
router.add('POST', '/api/recurrences/deactivate-expired', recurrenceController.deactivateExpired);
router.add('DELETE', '/api/recurrences/:id', recurrenceController.deleteRecurrence);

// Exception and incident management routes
const exceptionController = require('../controllers/exceptionController');
router.add('GET', '/api/exceptions', exceptionController.getAllExceptions);
router.add('POST', '/api/exceptions', exceptionController.createException);
router.add('GET', '/api/exceptions/active', exceptionController.getActiveExceptions);
router.add('GET', '/api/exceptions/critical', exceptionController.getCriticalExceptions);
router.add('GET', '/api/exceptions/types', exceptionController.getExceptionTypes);
router.add('GET', '/api/exceptions/stats', exceptionController.getExceptionStats);
router.add('GET', '/api/exceptions/:id', exceptionController.getExceptionById);
router.add('PUT', '/api/exceptions/:id', exceptionController.updateException);
router.add('PUT', '/api/exceptions/:id/resolve', exceptionController.resolveException);
router.add('DELETE', '/api/exceptions/:id', exceptionController.deleteException);

const userController = require('../controllers/userController');
router.add('GET','/api/users', userController.listUsers);
router.add('POST','/api/users', userController.createUser);
router.add('GET','/api/users/:id', userController.getUser);
router.add('PUT','/api/users/:id', userController.updateUser);
router.add('DELETE','/api/users/:id', userController.deleteUser);

// ----------------------------------------------------------
// Global middlewares (logging + auth)
// These are registered AFTER all routes so they apply to every
// registered path but can still examine req.url for public routes.
// ----------------------------------------------------------

// Basic request log
router.use(logReq);

// Protect all API routes except the explicitly public ones
router.use((req, res, next) => {
  // List of public (unauthenticated) endpoints
  const publicPaths = [
    '/api/ping',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/scheduler/status'
  ];

  const path = req.url.split('?')[0];

  // Allow CORS pre-flight and public endpoints without auth
  if (req.method === 'OPTIONS' || publicPaths.includes(path)) {
    return next();
  }

  // For everything else require a valid JWT
  return auth()(req, res, next);
});

// Branch scope restriction for MANAGER role (must run after auth)
router.use(branchScope());

// Helper to serve static files
function serveStatic(filePath, res) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      log.warn(`Static not found: ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    
    // Set appropriate content type
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf'
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma, Expires',
      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      log.error(`Stream error for ${filePath}`);
      res.writeHead(500);
      res.end('Internal error');
    });
    stream.pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  // response helpers
  res.json = (status, payload) => {
    if (typeof status !== 'number') { payload = status; status = 200; }
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  };

  // Express-like helper so that controller code can use res.status(400).json({...})
  res.status = (code = 200) => ({
    json: payload => res.json(code, payload)
  });
  res.unauth = () => res.json(401, { success: false, error: 'Unauthorized' });
  res.forbid  = () => res.json(403, { success: false, error: 'Forbidden' });

  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;
  log.info(`[REQ] ${req.method} ${pathname}`);

  // Add CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma, Expires');
  
  // Add security headers for all requests
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API calls
  if (pathname.startsWith('/api/')) {
    try {
      req.body = await parseRequest(req);
      
      // Add query parameters to request object
      req.query = query || {};
      
      // Add parsed URL for route parameter extraction
      req.parsedUrl = parsedUrl;
      
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: false,
        error: 'Invalid JSON request body' 
      }));
    }
    return router.dispatch(req.method, pathname, req, res);
  }
  
  // RSS feeds
  if (pathname.startsWith('/rss')) {
    // Add query parameters for RSS feeds too
    req.query = query || {};
    req.parsedUrl = parsedUrl;
    return router.dispatch(req.method, pathname, req, res);
  }

  // Serve frontend files from Cas-front directory
  const frontendDir = path.resolve(__dirname, '..', '..', 'Cas-front');
  let filePath;
  
  if (pathname === '/') {
    filePath = path.join(frontendDir, 'index.html');
  } else {
    filePath = path.join(frontendDir, pathname);
  }
  
  // If file doesn't exist, try with .html extension for SPA routing
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Try with .html extension
      const htmlPath = filePath + '.html';
      fs.stat(htmlPath, (htmlErr, htmlStats) => {
        if (htmlErr || !htmlStats.isFile()) {
          // If still not found, serve index.html for SPA routing
          const indexPath = path.join(frontendDir, 'index.html');
          serveStatic(indexPath, res);
        } else {
          serveStatic(htmlPath, res);
        }
      });
    } else {
      serveStatic(filePath, res);
    }
  });
});

// Handle WebSocket upgrade requests only if explicitly enabled
if (WEBSOCKET_ENABLED) {
  server.on('upgrade', (request, socket, head) => {
    const parsedUrl = url.parse(request.url, true);
    const { pathname } = parsedUrl;
    
    log.info(`WebSocket upgrade request: ${pathname}`);
    
    // Only handle WebSocket requests to /ws/status
    if (pathname === '/ws/status') {
      try {
        performHandshake(request, socket, head);
      } catch (error) {
        log.error(`WebSocket handshake failed: ${error.message}`);
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      }
    } else {
      log.warn(`WebSocket upgrade rejected for path: ${pathname}`);
      socket.end('HTTP/1.1 404 Not Found\r\n\r\n');
    }
  });
}

// ===== Scheduler Toggle =====
const SCHEDULER_ENABLED = false; // Set true when you want background jobs to run

if (SCHEDULER_ENABLED) {
  // Start scheduler and add jobs
  const expandRecurrences = require('../jobs/expandRecurrences');
  const checkInventory = require('../jobs/checkInventory');
  const checkEquipmentStatus = require('../jobs/checkEquipmentStatus');
  const updateWeatherData = require('../jobs/updateWeatherData');
  const generateDailyStats = require('../jobs/generateDailyStats');
  const exceptionDetection = require('../jobs/exceptionDetection');

  scheduler.addJob('expandRecurrences', '*/5 * * * *', expandRecurrences.expandRecurrences || expandRecurrences);
  scheduler.addJob('checkInventory', '0 * * * *', checkInventory.checkInventory);
  scheduler.addJob('checkEquipmentStatus', '0 */6 * * *', async () => {
    try { await checkEquipmentStatus.execute(); } catch (error) { log.error(`CheckEquipmentStatus job error: ${error.message}`); throw error; }
  });
  scheduler.addJob('updateWeatherData', '0 */3 * * *', async () => {
    try { await updateWeatherData.execute(); } catch (error) { log.error(`UpdateWeatherData job error: ${error.message}`); throw error; }
  });
  scheduler.addJob('generateDailyStats', '0 0 * * *', async () => {
    try { await generateDailyStats.execute(); } catch (error) { log.error(`GenerateDailyStats job error: ${error.message}`); throw error; }
  });
  scheduler.addJob('exceptionDetection', '*/30 * * * *', async () => {
    try { await exceptionDetection.execute(); } catch (error) { log.error(`ExceptionDetection job error: ${error.message}`); throw error; }
  });

  scheduler.start();
  log.info('Server and scheduler started successfully');
} else {
  log.info('Scheduler disabled – background jobs will not run');
}

server.listen(config.port, () => {
  log.info(`Minimal server listening on port ${config.port}`);
}); 