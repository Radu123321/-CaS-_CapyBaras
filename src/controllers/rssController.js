'use strict';
const { rssGenerator } = require('../core/rss');
const orderService = require('../services/orderService');
const transportService = require('../services/transportService');
const inventoryService = require('../services/inventoryService');
const locationService = require('../services/locationService');
const log = require('../core/logger');

// Get RSS feed for a specific location
async function getLocationRSSFeed(req, res) {
  log.info(`GET /rss/location/${req.params.id}`);
  
  try {
    const locationId = parseInt(req.params.id);
    
    if (isNaN(locationId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid location ID' }));
      return;
    }
    
    // Get location details
    const location = await locationService.getLocationById(locationId);
    if (!location) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Location not found' }));
      return;
    }
    
    // Collect recent updates for this location
    const items = [];
    
    // Recent orders (last 30 days)
    const recentOrders = await orderService.getAllOrders({ 
      location_id: locationId,
      limit: 10 
    });
    
    for (const order of recentOrders.slice(0, 5)) {
      if (isRecentDate(order.created_at, 30)) {
        const item = rssGenerator.generateNewOrderItem(
          order, 
          location.name, 
          order.customer_name || 'Unknown Customer'
        );
        items.push(item);
      }
    }
    
    // Recent inventory alerts
    try {
      const lowStockItems = await inventoryService.getLowStockItems(10);
      const locationLowStock = lowStockItems.filter(item => item.location_id === locationId);
      
      for (const alert of locationLowStock.slice(0, 3)) {
        const item = rssGenerator.generateInventoryAlertItem(alert, location.name);
        items.push(item);
      }
    } catch (error) {
      log.warn(`Could not fetch inventory alerts: ${error.message}`);
    }
    
    // Sort items by date (newest first)
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    // Generate RSS feed
    const rssFeed = rssGenerator.generateLocationFeed(locationId, location.name, items);
    
    // Set appropriate headers
    res.writeHead(200, {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
    });
    
    res.end(rssFeed);
    log.info(`Generated RSS feed for location ${locationId} with ${items.length} items`);
    
  } catch (error) {
    log.error(`RSS location feed error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Failed to generate RSS feed' 
    }));
  }
}

// Get general RSS feed with system-wide updates
async function getGeneralRSSFeed(req, res) {
  log.info('GET /rss');
  
  try {
    const items = [];
    
    // Recent orders from all locations (last 7 days)
    const recentOrders = await orderService.getAllOrders({ limit: 20 });
    
    for (const order of recentOrders.slice(0, 10)) {
      if (isRecentDate(order.created_at, 7)) {
        const item = rssGenerator.generateNewOrderItem(
          order, 
          order.location_name || 'Unknown Location', 
          order.customer_name || 'Unknown Customer'
        );
        items.push(item);
      }
    }
    
    // System-wide inventory alerts
    try {
      const lowStockItems = await inventoryService.getLowStockItems(5);
      
      for (const alert of lowStockItems.slice(0, 5)) {
        const item = rssGenerator.generateInventoryAlertItem(
          alert, 
          alert.location_name || 'Unknown Location'
        );
        items.push(item);
      }
    } catch (error) {
      log.warn(`Could not fetch system inventory alerts: ${error.message}`);
    }
    
    // Add system status updates (if any)
    const systemStatus = {
      type: 'System Status',
      message: 'CaS system is operational and processing requests normally'
    };
    items.push(rssGenerator.generateSystemAlertItem(systemStatus));
    
    // Sort items by date (newest first)
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    // Generate RSS feed
    const rssFeed = rssGenerator.generateGeneralFeed(items);
    
    // Set appropriate headers
    res.writeHead(200, {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
    });
    
    res.end(rssFeed);
    log.info(`Generated general RSS feed with ${items.length} items`);
    
  } catch (error) {
    log.error(`RSS general feed error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Failed to generate RSS feed' 
    }));
  }
}

// Get RSS feed for order updates
async function getOrderUpdatesRSSFeed(req, res) {
  log.info('GET /rss/orders');
  
  try {
    const items = [];
    
    // Get recent orders (last 14 days)
    const recentOrders = await orderService.getAllOrders({ limit: 50 });
    
    for (const order of recentOrders) {
      if (isRecentDate(order.created_at, 14)) {
        const item = rssGenerator.generateNewOrderItem(
          order, 
          order.location_name || 'Unknown Location', 
          order.customer_name || 'Unknown Customer'
        );
        items.push(item);
      }
    }
    
    // Sort items by date (newest first)
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    // Generate RSS feed with custom title
    const customGenerator = new (require('../core/rss').RSSGenerator)({
      title: 'CaS - Order Updates',
      description: 'Latest order updates from Cleaning as a Service'
    });
    
    const rssFeed = customGenerator.generateGeneralFeed(items);
    
    // Set appropriate headers
    res.writeHead(200, {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600' // Cache for 10 minutes
    });
    
    res.end(rssFeed);
    log.info(`Generated order updates RSS feed with ${items.length} items`);
    
  } catch (error) {
    log.error(`RSS order updates feed error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Failed to generate RSS feed' 
    }));
  }
}

// Get RSS feed for inventory alerts
async function getInventoryAlertsRSSFeed(req, res) {
  log.info('GET /rss/inventory');
  
  try {
    const items = [];
    
    // Get inventory alerts
    try {
      const lowStockItems = await inventoryService.getLowStockItems(15);
      const outOfStockItems = await inventoryService.getOutOfStockItems();
      
      // Add low stock alerts
      for (const alert of lowStockItems) {
        const item = rssGenerator.generateInventoryAlertItem(
          alert, 
          alert.location_name || 'Unknown Location'
        );
        items.push(item);
      }
      
      // Add out of stock alerts
      for (const alert of outOfStockItems) {
        const item = rssGenerator.generateInventoryAlertItem(
          alert, 
          alert.location_name || 'Unknown Location'
        );
        items.push(item);
      }
      
    } catch (error) {
      log.warn(`Could not fetch inventory alerts for RSS: ${error.message}`);
      
      // Add a system alert about the issue
      const systemAlert = {
        type: 'Inventory System',
        message: 'Inventory monitoring system is currently unavailable'
      };
      items.push(rssGenerator.generateSystemAlertItem(systemAlert));
    }
    
    // Sort items by date (newest first)
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    // Generate RSS feed with custom title
    const customGenerator = new (require('../core/rss').RSSGenerator)({
      title: 'CaS - Inventory Alerts',
      description: 'Inventory alerts and stock status updates'
    });
    
    const rssFeed = customGenerator.generateGeneralFeed(items.slice(0, 20)); // Limit to 20 items
    
    // Set appropriate headers
    res.writeHead(200, {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=180' // Cache for 3 minutes (more frequent updates)
    });
    
    res.end(rssFeed);
    log.info(`Generated inventory alerts RSS feed with ${items.length} items`);
    
  } catch (error) {
    log.error(`RSS inventory alerts feed error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Failed to generate RSS feed' 
    }));
  }
}

// Helper function to check if a date is recent
function isRecentDate(dateString, daysAgo) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysAgo;
}

module.exports = {
  getLocationRSSFeed,
  getGeneralRSSFeed,
  getOrderUpdatesRSSFeed,
  getInventoryAlertsRSSFeed
}; 