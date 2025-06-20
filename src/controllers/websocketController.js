'use strict';
const { broadcastToLocation, broadcastToAll, getStats } = require('../core/websocket');
const log = require('../core/logger');

// Get WebSocket connection statistics
async function getWebSocketStats(req, res) {
  log.info('GET /api/websocket/stats');
  
  try {
    const stats = getStats();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: stats
    }));
    
    log.info(`WebSocket stats: ${stats.totalClients} total clients across ${Object.keys(stats.locationClients).length} locations`);
    
  } catch (error) {
    log.error(`WebSocket stats error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Failed to get WebSocket statistics' 
    }));
  }
}

// Broadcast message to all clients in a location
async function broadcastToLocationClients(req, res) {
  log.info(`POST /api/websocket/broadcast/location/${req.params.id}`);
  
  try {
    const locationId = parseInt(req.params.id);
    
    if (isNaN(locationId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid location ID' }));
      return;
    }
    
    const { parseRequest } = require('../core/json');
    const body = await parseRequest(req);
    
    if (!body.message) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Message is required' }));
      return;
    }
    
    const messageData = {
      type: body.type || 'notification',
      message: body.message,
      timestamp: new Date().toISOString(),
      locationId: locationId
    };
    
    const sentCount = broadcastToLocation(locationId, messageData);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: `Broadcasted to ${sentCount} clients in location ${locationId}`,
      sentCount: sentCount
    }));
    
    log.info(`Broadcasted message to ${sentCount} clients in location ${locationId}`);
    
  } catch (error) {
    log.error(`WebSocket broadcast to location error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Failed to broadcast message' 
    }));
  }
}

// Broadcast message to all clients
async function broadcastToAllClients(req, res) {
  log.info('POST /api/websocket/broadcast');
  
  try {
    const { parseRequest } = require('../core/json');
    const body = await parseRequest(req);
    
    if (!body.message) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Message is required' }));
      return;
    }
    
    const messageData = {
      type: body.type || 'notification',
      message: body.message,
      timestamp: new Date().toISOString()
    };
    
    const sentCount = broadcastToAll(messageData);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: `Broadcasted to ${sentCount} total clients`,
      sentCount: sentCount
    }));
    
    log.info(`Broadcasted message to ${sentCount} total clients`);
    
  } catch (error) {
    log.error(`WebSocket broadcast to all error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Failed to broadcast message' 
    }));
  }
}

// Send order status update via WebSocket
async function sendOrderStatusUpdate(orderId, oldStatus, newStatus, locationId, locationName) {
  try {
    const updateData = {
      type: 'order_status_update',
      orderId: orderId,
      oldStatus: oldStatus,
      newStatus: newStatus,
      locationId: locationId,
      locationName: locationName,
      timestamp: new Date().toISOString()
    };
    
    // Broadcast to location-specific clients
    const locationSentCount = broadcastToLocation(locationId, updateData);
    
    // Also broadcast to all clients for general awareness
    const allSentCount = broadcastToAll({
      ...updateData,
      type: 'global_order_update'
    });
    
    log.info(`Order status update sent: ${locationSentCount} location clients, ${allSentCount} total clients`);
    
    return { locationSentCount, allSentCount };
  } catch (error) {
    log.error(`Failed to send order status update: ${error.message}`);
    return { error: error.message };
  }
}

// Send transport status update via WebSocket
async function sendTransportStatusUpdate(transportId, orderId, oldStatus, newStatus, locationId, locationName) {
  try {
    const updateData = {
      type: 'transport_status_update',
      transportId: transportId,
      orderId: orderId,
      oldStatus: oldStatus,
      newStatus: newStatus,
      locationId: locationId,
      locationName: locationName,
      timestamp: new Date().toISOString()
    };
    
    // Broadcast to location-specific clients
    const locationSentCount = broadcastToLocation(locationId, updateData);
    
    log.info(`Transport status update sent to ${locationSentCount} location clients`);
    
    return { locationSentCount };
  } catch (error) {
    log.error(`Failed to send transport status update: ${error.message}`);
    return { error: error.message };
  }
}

// Send inventory alert via WebSocket
async function sendInventoryAlert(alert, locationName) {
  try {
    const alertData = {
      type: 'inventory_alert',
      resourceName: alert.resource_name,
      locationId: alert.location_id,
      locationName: locationName,
      quantity: alert.quantity,
      unit: alert.unit,
      alertType: alert.quantity <= 0 ? 'out_of_stock' : 'low_stock',
      timestamp: new Date().toISOString()
    };
    
    // Broadcast to location-specific clients
    const locationSentCount = broadcastToLocation(alert.location_id, alertData);
    
    // Also broadcast critical alerts (out of stock) to all clients
    if (alert.quantity <= 0) {
      const allSentCount = broadcastToAll({
        ...alertData,
        type: 'critical_inventory_alert'
      });
      
      log.info(`Critical inventory alert sent: ${locationSentCount} location clients, ${allSentCount} total clients`);
      return { locationSentCount, allSentCount };
    } else {
      log.info(`Inventory alert sent to ${locationSentCount} location clients`);
      return { locationSentCount };
    }
  } catch (error) {
    log.error(`Failed to send inventory alert: ${error.message}`);
    return { error: error.message };
  }
}

// Send system status update via WebSocket
async function sendSystemStatusUpdate(status, message) {
  try {
    const statusData = {
      type: 'system_status',
      status: status,
      message: message,
      timestamp: new Date().toISOString()
    };
    
    const sentCount = broadcastToAll(statusData);
    
    log.info(`System status update sent to ${sentCount} clients`);
    
    return { sentCount };
  } catch (error) {
    log.error(`Failed to send system status update: ${error.message}`);
    return { error: error.message };
  }
}

module.exports = {
  getWebSocketStats,
  broadcastToLocationClients,
  broadcastToAllClients,
  sendOrderStatusUpdate,
  sendTransportStatusUpdate,
  sendInventoryAlert,
  sendSystemStatusUpdate
}; 