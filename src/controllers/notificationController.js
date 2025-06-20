const notificationService = require('../core/notificationService');
const log = require('../core/logger');

class NotificationController {
  // ===== SUBSCRIPTION MANAGEMENT =====
  
  async subscribe(req, res) {
    try {
      const { clientId, preferences = {} } = req.body;
      
      if (!clientId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Client ID is required'
        }));
      }
      
      const result = notificationService.addSubscriber(clientId, preferences);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          clientId,
          subscribed: result,
          preferences
        }
      }));
    } catch (error) {
      log.error(`Error subscribing to notifications: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to subscribe to notifications'
      }));
    }
  }
  
  async unsubscribe(req, res) {
    try {
      const { clientId } = req.body;
      
      if (!clientId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Client ID is required'
        }));
      }
      
      const result = notificationService.removeSubscriber(clientId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          clientId,
          unsubscribed: result
        }
      }));
    } catch (error) {
      log.error(`Error unsubscribing from notifications: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to unsubscribe from notifications'
      }));
    }
  }
  
  async updatePreferences(req, res) {
    try {
      const { clientId, preferences } = req.body;
      
      if (!clientId || !preferences) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Client ID and preferences are required'
        }));
      }
      
      const result = notificationService.updateSubscriberPreferences(clientId, preferences);
      
      if (!result) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Subscriber not found'
        }));
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          clientId,
          updated: result,
          preferences
        }
      }));
    } catch (error) {
      log.error(`Error updating notification preferences: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to update notification preferences'
      }));
    }
  }

  // ===== MANUAL NOTIFICATION TRIGGERS =====
  
  async sendTestNotification(req, res) {
    try {
      const { 
        type = 'TEST_NOTIFICATION',
        message = 'This is a test notification',
        priority = 'MEDIUM',
        locationId = null
      } = req.body;
      
      const notification = await notificationService.createNotification(
        type,
        message,
        priority,
        { test: true, timestamp: new Date().toISOString() },
        locationId
      );
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: notification
      }));
    } catch (error) {
      log.error(`Error sending test notification: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to send test notification'
      }));
    }
  }
  
  async sendCustomNotification(req, res) {
    try {
      const { type, message, priority, data, locationId } = req.body;
      
      if (!type || !message) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Type and message are required'
        }));
      }
      
      const notification = await notificationService.createNotification(
        type,
        message,
        priority || 'MEDIUM',
        data || {},
        locationId || null
      );
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: notification
      }));
    } catch (error) {
      log.error(`Error sending custom notification: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to send custom notification'
      }));
    }
  }

  // ===== EXCEPTION DETECTION ENDPOINTS =====
  
  async detectStaffIssues(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      
      const issues = await notificationService.detectStaffUnavailability(locationId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          issues,
          count: issues.length,
          detectedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      log.error(`Error detecting staff issues: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to detect staff issues'
      }));
    }
  }
  
  async detectPowerIssues(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      
      const issues = await notificationService.detectPowerOutage(locationId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          issues,
          count: issues.length,
          detectedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      log.error(`Error detecting power issues: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to detect power issues'
      }));
    }
  }
  
  async detectEquipmentIssues(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      
      const issues = await notificationService.detectEquipmentFailures(locationId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          issues,
          count: issues.length,
          detectedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      log.error(`Error detecting equipment issues: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to detect equipment issues'
      }));
    }
  }
  
  async detectTransportIssues(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      
      const issues = await notificationService.detectTransportIssues(locationId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          issues,
          count: issues.length,
          detectedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      log.error(`Error detecting transport issues: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to detect transport issues'
      }));
    }
  }
  
  async runFullExceptionDetection(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      
      const results = await notificationService.runExceptionDetection(locationId);
      
      const totalIssues = results.staffIssues.length + 
                         results.powerIssues.length + 
                         results.equipmentIssues.length + 
                         results.transportIssues.length;
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          ...results,
          summary: {
            totalIssues,
            staffIssues: results.staffIssues.length,
            powerIssues: results.powerIssues.length,
            equipmentIssues: results.equipmentIssues.length,
            transportIssues: results.transportIssues.length,
            errors: results.errors.length
          },
          detectedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      log.error(`Error running full exception detection: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to run exception detection'
      }));
    }
  }

  // ===== MONITORING & STATS =====
  
  async getNotificationStats(req, res) {
    try {
      const stats = notificationService.getStats();
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: stats
      }));
    } catch (error) {
      log.error(`Error getting notification stats: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get notification stats'
      }));
    }
  }
  
  async getSubscribers(req, res) {
    try {
      const subscribers = Array.from(notificationService.subscribers.entries()).map(([id, data]) => ({
        id,
        ...data,
        preferences: data.preferences,
        stats: data.stats
      }));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          subscribers,
          count: subscribers.length
        }
      }));
    } catch (error) {
      log.error(`Error getting subscribers: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get subscribers'
      }));
    }
  }
  
  async getNotificationConfig(req, res) {
    try {
      const config = notificationService.config;
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: config
      }));
    } catch (error) {
      log.error(`Error getting notification config: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get notification config'
      }));
    }
  }
  
  async updateNotificationConfig(req, res) {
    try {
      const { config } = req.body;
      
      if (!config) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Configuration is required'
        }));
      }
      
      // Update configuration
      Object.assign(notificationService.config, config);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          updated: true,
          config: notificationService.config
        }
      }));
    } catch (error) {
      log.error(`Error updating notification config: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to update notification config'
      }));
    }
  }

  // ===== UTILITY ENDPOINTS =====
  
  async getNotificationTypes(req, res) {
    try {
      const types = [
        {
          type: 'EQUIPMENT_FAILURE',
          description: 'Equipment failures and malfunctions',
          priority: 'HIGH',
          icon: '🔧'
        },
        {
          type: 'STAFF_UNAVAILABLE',
          description: 'Staff unavailability and shortages',
          priority: 'HIGH',
          icon: '👥'
        },
        {
          type: 'POWER_OUTAGE',
          description: 'Power outages and electrical issues',
          priority: 'CRITICAL',
          icon: '⚡'
        },
        {
          type: 'CRITICAL_INVENTORY',
          description: 'Critical inventory shortages',
          priority: 'HIGH',
          icon: '📦'
        },
        {
          type: 'TRANSPORT_DELAY',
          description: 'Transport delays and issues',
          priority: 'MEDIUM',
          icon: '🚚'
        },
        {
          type: 'MAINTENANCE_DUE',
          description: 'Scheduled maintenance reminders',
          priority: 'MEDIUM',
          icon: '🛠️'
        },
        {
          type: 'WEATHER_ALERT',
          description: 'Weather-related alerts',
          priority: 'MEDIUM',
          icon: '🌤️'
        },
        {
          type: 'SYSTEM_ALERT',
          description: 'System-wide alerts and notices',
          priority: 'LOW',
          icon: '🔔'
        }
      ];
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: types
      }));
    } catch (error) {
      log.error(`Error getting notification types: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get notification types'
      }));
    }
  }
  
  async getPriorities(req, res) {
    try {
      const priorities = [
        {
          level: 'CRITICAL',
          description: 'Immediate attention required',
          channels: ['email', 'websocket', 'browser'],
          color: '#e74c3c'
        },
        {
          level: 'HIGH',
          description: 'High priority issues',
          channels: ['email', 'websocket', 'browser'],
          color: '#f39c12'
        },
        {
          level: 'MEDIUM',
          description: 'Medium priority notifications',
          channels: ['websocket', 'browser'],
          color: '#3498db'
        },
        {
          level: 'LOW',
          description: 'Low priority information',
          channels: ['websocket'],
          color: '#95a5a6'
        }
      ];
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: priorities
      }));
    } catch (error) {
      log.error(`Error getting priorities: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get priorities'
      }));
    }
  }
  
  async getChannels(req, res) {
    try {
      const channels = [
        {
          name: 'email',
          description: 'Email notifications via SMTP',
          enabled: notificationService.config.channels.email,
          suitable: ['CRITICAL', 'HIGH']
        },
        {
          name: 'websocket',
          description: 'Real-time WebSocket notifications',
          enabled: notificationService.config.channels.websocket,
          suitable: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
        },
        {
          name: 'browser',
          description: 'Browser push notifications',
          enabled: notificationService.config.channels.browser,
          suitable: ['CRITICAL', 'HIGH', 'MEDIUM']
        },
        {
          name: 'rss',
          description: 'RSS feed updates',
          enabled: notificationService.config.channels.rss,
          suitable: ['HIGH', 'MEDIUM', 'LOW']
        }
      ];
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: channels
      }));
    } catch (error) {
      log.error(`Error getting channels: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get channels'
      }));
    }
  }
}

module.exports = new NotificationController(); 