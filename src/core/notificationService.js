const alertService = require('../services/alertService');
const { broadcastToAll, broadcastToLocation } = require('./websocket');
const log = require('./logger');

class NotificationService {
  constructor() {
    this.subscribers = new Map(); // WebSocket clients that want notifications
    this.notificationQueue = []; // Queue for failed notifications
    this.recentNotifications = []; // Store recent notifications
    this.config = {
      enabled: true,
      channels: {
        email: true,
        websocket: true,
        browser: true,
        rss: true
      },
      priorities: {
        CRITICAL: ['email', 'websocket', 'browser'],
        HIGH: ['email', 'websocket', 'browser'],
        MEDIUM: ['websocket', 'browser'],
        LOW: ['websocket']
      },
      retryAttempts: 3,
      retryDelay: 5000 // 5 seconds
    };
  }

  // ===== SUBSCRIBER MANAGEMENT =====
  
  getRecentNotifications(limit = 10, locationId = null) {
    let notifications = this.recentNotifications;
    
    // Filter by location if specified
    if (locationId) {
      notifications = notifications.filter(n => n.locationId === locationId || n.locationId === null);
    }
    
    // Sort by timestamp (newest first) and limit
    return notifications
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }
  
  addSubscriber(clientId, preferences = {}) {
    this.subscribers.set(clientId, {
      id: clientId,
      addedAt: new Date(),
      preferences: {
        types: preferences.types || ['ALL'],
        locations: preferences.locations || [],
        priorities: preferences.priorities || ['HIGH', 'CRITICAL'],
        channels: preferences.channels || ['websocket', 'browser']
      },
      stats: {
        sent: 0,
        failed: 0,
        lastNotification: null
      }
    });
    
    log.info(`Notification subscriber added: ${clientId}`);
    return true;
  }
  
  removeSubscriber(clientId) {
    const removed = this.subscribers.delete(clientId);
    if (removed) {
      log.info(`Notification subscriber removed: ${clientId}`);
    }
    return removed;
  }
  
  updateSubscriberPreferences(clientId, preferences) {
    const subscriber = this.subscribers.get(clientId);
    if (subscriber) {
      subscriber.preferences = { ...subscriber.preferences, ...preferences };
      log.info(`Subscriber preferences updated: ${clientId}`);
      return true;
    }
    return false;
  }

  // ===== NOTIFICATION CREATION =====
  
  async createNotification(type, message, priority = 'MEDIUM', data = {}, locationId = null) {
    try {
      const notification = {
        id: this.generateNotificationId(),
        type,
        message,
        priority,
        data,
        locationId,
        timestamp: new Date().toISOString(),
        channels: this.config.priorities[priority] || ['websocket'],
        status: 'PENDING',
        attempts: 0,
        maxAttempts: this.config.retryAttempts
      };
      
      log.info(`Creating notification: ${type} - ${priority} - ${message}`);
      
      // Store in recent notifications (keep last 100)
      this.recentNotifications.unshift(notification);
      if (this.recentNotifications.length > 100) {
        this.recentNotifications = this.recentNotifications.slice(0, 100);
      }
      
      // Route to appropriate channels
      await this.routeNotification(notification);
      
      return notification;
      
    } catch (error) {
      log.error(`Error creating notification: ${error.message}`);
      throw error;
    }
  }
  
  async routeNotification(notification) {
    const results = {
      email: null,
      websocket: null,
      browser: null,
      rss: null
    };
    
    for (const channel of notification.channels) {
      if (!this.config.channels[channel]) {
        continue;
      }
      
      try {
        switch (channel) {
          case 'email':
            results.email = await this.sendEmailNotification(notification);
            break;
          case 'websocket':
            results.websocket = await this.sendWebSocketNotification(notification);
            break;
          case 'browser':
            results.browser = await this.sendBrowserNotification(notification);
            break;
          case 'rss':
            results.rss = await this.sendRSSNotification(notification);
            break;
        }
        
        log.info(`Notification sent via ${channel}: ${notification.id}`);
        
      } catch (error) {
        log.error(`Failed to send notification via ${channel}: ${error.message}`);
        results[channel] = { error: error.message };
      }
    }
    
    notification.results = results;
    notification.status = this.calculateNotificationStatus(results);
    
    return results;
  }

  // ===== CHANNEL IMPLEMENTATIONS =====
  
  async sendEmailNotification(notification) {
    try {
      // Use existing alert service for email
      await alertService.createAlert(
        notification.type,
        notification.message,
        notification.priority,
        notification.data
      );
      
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      throw new Error(`Email notification failed: ${error.message}`);
    }
  }
  
  async sendWebSocketNotification(notification) {
    try {
      const wsMessage = {
        type: 'notification',
        notification: {
          id: notification.id,
          type: notification.type,
          message: notification.message,
          priority: notification.priority,
          data: notification.data,
          timestamp: notification.timestamp
        }
      };
      
      if (notification.locationId) {
        await broadcastToLocation(notification.locationId, JSON.stringify(wsMessage));
      } else {
        await broadcastToAll(JSON.stringify(wsMessage));
      }
      
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      throw new Error(`WebSocket notification failed: ${error.message}`);
    }
  }
  
  async sendBrowserNotification(notification) {
    try {
      // Send browser notification data to WebSocket clients
      // The frontend will handle the actual browser notification API
      const browserMessage = {
        type: 'browser_notification',
        notification: {
          id: notification.id,
          title: this.getBrowserTitle(notification.type),
          body: notification.message,
          icon: this.getBrowserIcon(notification.type, notification.priority),
          badge: '/favicon.ico',
          tag: notification.type,
          data: notification.data,
          requireInteraction: notification.priority === 'CRITICAL',
          silent: notification.priority === 'LOW'
        }
      };
      
      // Send to subscribers who want browser notifications
      const eligibleSubscribers = Array.from(this.subscribers.values()).filter(
        sub => sub.preferences.channels.includes('browser') &&
               this.matchesSubscriberPreferences(sub, notification)
      );
      
      for (const subscriber of eligibleSubscribers) {
        await broadcastToAll(JSON.stringify(browserMessage));
        subscriber.stats.sent++;
        subscriber.stats.lastNotification = new Date();
      }
      
      return { 
        success: true, 
        timestamp: new Date().toISOString(),
        subscriberCount: eligibleSubscribers.length
      };
    } catch (error) {
      throw new Error(`Browser notification failed: ${error.message}`);
    }
  }
  
  async sendRSSNotification(notification) {
    try {
      // RSS notifications are handled by the RSS service
      // This is just for tracking purposes
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      throw new Error(`RSS notification failed: ${error.message}`);
    }
  }

  // ===== ENHANCED EXCEPTION DETECTION =====
  
  async detectStaffUnavailability(locationId = null) {
    try {
      const { query } = require('./psql');
      
      let sql = `
        SELECT 
          l.id as location_id,
          l.name as location_name,
          COUNT(e.id) as total_employees,
          COUNT(CASE WHEN e.status = 'ACTIVE' THEN 1 END) as active_employees,
          COUNT(CASE WHEN e.status = 'SICK' THEN 1 END) as sick_employees,
          COUNT(CASE WHEN e.status = 'VACATION' THEN 1 END) as vacation_employees
        FROM locations l
        LEFT JOIN employees e ON l.id = e.location_id
      `;
      
      const params = [];
      if (locationId) {
        sql += ' WHERE l.id = $1';
        params.push(locationId);
      }
      
      sql += ' GROUP BY l.id, l.name';
      
      const result = await query(sql, params);
      const issues = [];
      
      for (const location of result.rows) {
        const totalEmployees = parseInt(location.total_employees || 0);
        const activeEmployees = parseInt(location.active_employees || 0);
        const availabilityRate = totalEmployees > 0 ? (activeEmployees / totalEmployees) * 100 : 0;
        
        if (availabilityRate < 50) {
          issues.push({
            type: 'CRITICAL_STAFF_SHORTAGE',
            locationId: location.location_id,
            locationName: location.location_name,
            availabilityRate: availabilityRate.toFixed(1),
            activeEmployees,
            totalEmployees,
            severity: availabilityRate < 25 ? 'CRITICAL' : 'HIGH'
          });
        }
      }
      
      // Send notifications for detected issues
      for (const issue of issues) {
        await this.createNotification(
          issue.type,
          `Critical staff shortage at ${issue.locationName}: Only ${issue.activeEmployees}/${issue.totalEmployees} employees available (${issue.availabilityRate}%)`,
          issue.severity,
          issue,
          issue.locationId
        );
      }
      
      return issues;
      
    } catch (error) {
      log.error(`Error detecting staff unavailability: ${error.message}`);
      throw error;
    }
  }
  
  async detectPowerOutage(locationId = null) {
    try {
      // Simulate power outage detection based on equipment status
      const { query } = require('./psql');
      
      let sql = `
        SELECT 
          l.id as location_id,
          l.name as location_name,
          COUNT(e.id) as total_equipment,
          COUNT(CASE WHEN e.status = 'OUT_OF_SERVICE' THEN 1 END) as out_of_service,
          COUNT(CASE WHEN e.updated_at < NOW() - INTERVAL '2 hours' THEN 1 END) as stale_equipment
        FROM locations l
        LEFT JOIN equipment e ON l.id = e.location_id
      `;
      
      const params = [];
      if (locationId) {
        sql += ' WHERE l.id = $1';
        params.push(locationId);
      }
      
      sql += ' GROUP BY l.id, l.name';
      
      const result = await query(sql, params);
      const issues = [];
      
      for (const location of result.rows) {
        const totalEquipment = parseInt(location.total_equipment || 0);
        const outOfService = parseInt(location.out_of_service || 0);
        const staleEquipment = parseInt(location.stale_equipment || 0);
        
        // Detect potential power outage if too much equipment is out of service or stale
        const outageRate = totalEquipment > 0 ? (outOfService / totalEquipment) * 100 : 0;
        const staleRate = totalEquipment > 0 ? (staleEquipment / totalEquipment) * 100 : 0;
        
        if (outageRate > 70 || staleRate > 80) {
          issues.push({
            type: 'POWER_OUTAGE_DETECTED',
            locationId: location.location_id,
            locationName: location.location_name,
            outageRate: outageRate.toFixed(1),
            staleRate: staleRate.toFixed(1),
            totalEquipment,
            outOfService,
            staleEquipment,
            severity: 'CRITICAL'
          });
        }
      }
      
      // Send notifications for detected issues
      for (const issue of issues) {
        await this.createNotification(
          issue.type,
          `Potential power outage detected at ${issue.locationName}: ${issue.outOfService}/${issue.totalEquipment} equipment out of service (${issue.outageRate}%)`,
          issue.severity,
          issue,
          issue.locationId
        );
      }
      
      return issues;
      
    } catch (error) {
      log.error(`Error detecting power outage: ${error.message}`);
      throw error;
    }
  }
  
  async detectEquipmentFailures(locationId = null) {
    try {
      const { query } = require('./psql');
      
      let sql = `
        SELECT 
          e.id,
          e.name,
          e.type,
          e.status,
          e.location_id,
          l.name as location_name,
          EXTRACT(days FROM (NOW() - e.updated_at)) as days_since_update,
          COUNT(em.id) as recent_maintenance
        FROM equipment e
        JOIN locations l ON e.location_id = l.id
        LEFT JOIN equipment_maintenance em ON e.id = em.equipment_id 
          AND em.created_at >= NOW() - INTERVAL '30 days'
      `;
      
      const params = [];
      if (locationId) {
        sql += ' WHERE e.location_id = $1';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY e.id, e.name, e.type, e.status, e.location_id, l.name, e.updated_at
        HAVING e.status = 'OUT_OF_SERVICE' 
          OR EXTRACT(days FROM (NOW() - e.updated_at)) > 7
        ORDER BY days_since_update DESC
      `;
      
      const result = await query(sql, params);
      const issues = [];
      
      for (const equipment of result.rows) {
        const daysSinceUpdate = parseInt(equipment.days_since_update || 0);
        const recentMaintenance = parseInt(equipment.recent_maintenance || 0);
        
        let severity = 'MEDIUM';
        let issueType = 'EQUIPMENT_MAINTENANCE_NEEDED';
        
        if (equipment.status === 'OUT_OF_SERVICE') {
          severity = 'HIGH';
          issueType = 'EQUIPMENT_FAILURE';
        } else if (daysSinceUpdate > 14) {
          severity = 'HIGH';
          issueType = 'EQUIPMENT_UNRESPONSIVE';
        }
        
        issues.push({
          type: issueType,
          equipmentId: equipment.id,
          equipmentName: equipment.name,
          equipmentType: equipment.type,
          locationId: equipment.location_id,
          locationName: equipment.location_name,
          status: equipment.status,
          daysSinceUpdate,
          recentMaintenance,
          severity
        });
      }
      
      // Send notifications for detected issues
      for (const issue of issues) {
        await this.createNotification(
          issue.type,
          `Equipment issue detected: ${issue.equipmentName} at ${issue.locationName} - ${issue.status} (${issue.daysSinceUpdate} days since last update)`,
          issue.severity,
          issue,
          issue.locationId
        );
      }
      
      return issues;
      
    } catch (error) {
      log.error(`Error detecting equipment failures: ${error.message}`);
      throw error;
    }
  }
  
  async detectTransportIssues(locationId = null) {
    try {
      const { query } = require('./psql');
      
      let sql = `
        SELECT 
          t.id,
          t.status,
          t.location_id,
          l.name as location_name,
          o.id as order_id,
          EXTRACT(hours FROM (NOW() - t.created_at)) as hours_since_created,
          EXTRACT(hours FROM (NOW() - t.updated_at)) as hours_since_updated
        FROM transports t
        JOIN orders o ON t.order_id = o.id
        JOIN locations l ON t.location_id = l.id
        WHERE t.status IN ('PENDING', 'IN_PROGRESS')
      `;
      
      const params = [];
      if (locationId) {
        sql += ' AND t.location_id = $1';
        params.push(locationId);
      }
      
      sql += ' ORDER BY t.created_at ASC';
      
      const result = await query(sql, params);
      const issues = [];
      
      for (const transport of result.rows) {
        const hoursSinceCreated = parseFloat(transport.hours_since_created || 0);
        const hoursSinceUpdated = parseFloat(transport.hours_since_updated || 0);
        
        let severity = 'LOW';
        let issueType = 'TRANSPORT_DELAY';
        
        if (hoursSinceCreated > 24) {
          severity = 'HIGH';
          issueType = 'TRANSPORT_CRITICAL_DELAY';
        } else if (hoursSinceCreated > 8) {
          severity = 'MEDIUM';
        }
        
        if (hoursSinceUpdated > 4) {
          issues.push({
            type: issueType,
            transportId: transport.id,
            orderId: transport.order_id,
            locationId: transport.location_id,
            locationName: transport.location_name,
            status: transport.status,
            hoursSinceCreated: hoursSinceCreated.toFixed(1),
            hoursSinceUpdated: hoursSinceUpdated.toFixed(1),
            severity
          });
        }
      }
      
      // Send notifications for detected issues
      for (const issue of issues) {
        await this.createNotification(
          issue.type,
          `Transport delay detected: Order #${issue.orderId} at ${issue.locationName} - ${issue.status} for ${issue.hoursSinceCreated} hours`,
          issue.severity,
          issue,
          issue.locationId
        );
      }
      
      return issues;
      
    } catch (error) {
      log.error(`Error detecting transport issues: ${error.message}`);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====
  
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getBrowserTitle(type) {
    const titles = {
      'EQUIPMENT_FAILURE': '🔧 Equipment Alert',
      'STAFF_UNAVAILABLE': '👥 Staff Alert',
      'POWER_OUTAGE': '⚡ Power Alert',
      'CRITICAL_INVENTORY': '📦 Inventory Alert',
      'TRANSPORT_DELAY': '🚚 Transport Alert',
      'MAINTENANCE_DUE': '🛠️ Maintenance Alert',
      'WEATHER_ALERT': '🌤️ Weather Alert'
    };
    
    return titles[type] || '🔔 CaS Alert';
  }
  
  getBrowserIcon(type, priority) {
    if (priority === 'CRITICAL') {
      return '/icons/alert-critical.png';
    } else if (priority === 'HIGH') {
      return '/icons/alert-high.png';
    }
    return '/icons/alert-medium.png';
  }
  
  matchesSubscriberPreferences(subscriber, notification) {
    // Check if notification matches subscriber preferences
    const prefs = subscriber.preferences;
    
    // Check priority
    if (!prefs.priorities.includes(notification.priority)) {
      return false;
    }
    
    // Check location
    if (prefs.locations.length > 0 && notification.locationId) {
      if (!prefs.locations.includes(notification.locationId)) {
        return false;
      }
    }
    
    // Check type
    if (!prefs.types.includes('ALL') && !prefs.types.includes(notification.type)) {
      return false;
    }
    
    return true;
  }
  
  calculateNotificationStatus(results) {
    const channels = Object.keys(results);
    const successful = channels.filter(ch => results[ch] && results[ch].success).length;
    const total = channels.filter(ch => results[ch] !== null).length;
    
    if (successful === 0) return 'FAILED';
    if (successful === total) return 'SUCCESS';
    return 'PARTIAL';
  }

  // ===== MONITORING & HEALTH =====
  
  getStats() {
    const subscriberStats = Array.from(this.subscribers.values()).reduce((acc, sub) => {
      acc.totalSent += sub.stats.sent;
      acc.totalFailed += sub.stats.failed;
      return acc;
    }, { totalSent: 0, totalFailed: 0 });
    
    return {
      subscribers: this.subscribers.size,
      queueSize: this.notificationQueue.length,
      config: this.config,
      stats: subscriberStats
    };
  }
  
  async runExceptionDetection(locationId = null) {
    try {
      log.info('Running comprehensive exception detection...');
      
      const results = await Promise.allSettled([
        this.detectStaffUnavailability(locationId),
        this.detectPowerOutage(locationId),
        this.detectEquipmentFailures(locationId),
        this.detectTransportIssues(locationId)
      ]);
      
      const summary = {
        staffIssues: results[0].status === 'fulfilled' ? results[0].value : [],
        powerIssues: results[1].status === 'fulfilled' ? results[1].value : [],
        equipmentIssues: results[2].status === 'fulfilled' ? results[2].value : [],
        transportIssues: results[3].status === 'fulfilled' ? results[3].value : [],
        errors: results.filter(r => r.status === 'rejected').map(r => r.reason.message)
      };
      
      const totalIssues = summary.staffIssues.length + 
                         summary.powerIssues.length + 
                         summary.equipmentIssues.length + 
                         summary.transportIssues.length;
      
      log.info(`Exception detection completed: ${totalIssues} issues found`);
      
      return summary;
      
    } catch (error) {
      log.error(`Error in exception detection: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new NotificationService(); 