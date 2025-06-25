const { query } = require('../core/psql');
const notificationService = require('../core/notificationService');
const { log } = require('../core/logger');

class ExceptionDetection {
  constructor() {
    this.name = 'Exception Detection';
    this.schedule = '*/10 * * * *'; // Every 10 minutes
    this.isRunning = false;
    this.lastRun = null;
    this.results = null;
    this.errors = [];
  }

  // ===== MAIN EXECUTION METHOD =====
  
  async execute() {
    if (this.isRunning) {
      log.warn('Exception detection job already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    this.lastRun = new Date();
    this.errors = [];
    
    try {
      log.info('Starting automated exception detection...');
      
      const results = {
        staffShortages: [],
        systemIssues: [],
        anomalies: [],
        totalIssuesDetected: 0
      };

      // Run all detection methods
      try {
        results.staffShortages = await this.detectCriticalStaffShortage();
        log.info(`Staff shortages detected: ${results.staffShortages.length}`);
      } catch (error) {
        log.error(`Error in staff shortage detection: ${error.message}`);
        this.errors.push(`Staff shortage detection: ${error.message}`);
      }

      try {
        results.systemIssues = await this.detectSystemWideIssues();
        log.info(`System issues detected: ${results.systemIssues.length}`);
      } catch (error) {
        log.error(`Error in system issues detection: ${error.message}`);
        this.errors.push(`System issues detection: ${error.message}`);
      }

      try {
        results.anomalies = await this.detectAnomalies();
        log.info(`Anomalies detected: ${results.anomalies.length}`);
      } catch (error) {
        log.error(`Error in anomaly detection: ${error.message}`);
        this.errors.push(`Anomaly detection: ${error.message}`);
      }

      // Calculate totals
      results.totalIssuesDetected = 
        results.staffShortages.length + 
        results.systemIssues.length + 
        results.anomalies.length;

      this.results = results;

      // Send summary if issues found
      if (results.totalIssuesDetected > 0) {
        await this.sendSummaryNotification(results.totalIssuesDetected, results);
      }

      log.info(`Exception detection completed. Total issues: ${results.totalIssuesDetected}`);
      
    } catch (error) {
      log.error(`Critical error in exception detection: ${error.message}`);
      this.errors.push(`Critical error: ${error.message}`);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // ===== DETECTION METHODS =====

  async detectCriticalStaffShortage() {
    try {
      const sql = `
        SELECT 
          l.location_id as location_id,
          l.name as location_name,
          COUNT(e.employee_id) as total_employees,
          COUNT(CASE WHEN e.is_available = true THEN 1 END) as active_employees
        FROM locations l
        LEFT JOIN employees e ON l.location_id = e.location_id
        GROUP BY l.location_id, l.name
        HAVING COUNT(CASE WHEN e.is_available = true THEN 1 END) = 0
          OR (COUNT(e.employee_id) > 0 AND COUNT(CASE WHEN e.is_available = true THEN 1 END) * 100.0 / COUNT(e.employee_id) < 25)
      `;
      
      const result = await query(sql);
      
      for (const location of result) {
        await notificationService.createNotification(
          'CRITICAL_STAFF_SHORTAGE',
          `URGENT: Critical staff shortage at ${location.location_name}. Only ${location.active_employees}/${location.total_employees} employees available.`,
          'CRITICAL',
          {
            locationId: location.location_id,
            locationName: location.location_name,
            activeEmployees: parseInt(location.active_employees),
            totalEmployees: parseInt(location.total_employees),
            availabilityRate: location.total_employees > 0 ? 
              (parseInt(location.active_employees) / parseInt(location.total_employees)) * 100 : 0
          },
          location.location_id
        );
      }
      
      return result;
      
    } catch (error) {
      log.error(`Error detecting critical staff shortage: ${error.message}`);
      throw error;
    }
  }

  async detectSystemWideIssues() {
    try {
      // Check for system-wide patterns - using only existing v2.0 tables
      const sql = `
        SELECT 
          'equipment' as issue_type,
          COUNT(*) as affected_count,
          COUNT(DISTINCT location_id) as affected_locations
        FROM equipment 
        WHERE status = 'OUT_OF_SERVICE'
        
        UNION ALL
        
        SELECT 
          'inventory' as issue_type,
          COUNT(*) as affected_count,
          COUNT(DISTINCT location_id) as affected_locations
        FROM inventory 
        WHERE current_stock <= minimum_stock
      `;
      
      const result = await query(sql);
      const systemIssues = [];
      
      for (const issue of result) {
        const affectedCount = parseInt(issue.affected_count);
        const affectedLocations = parseInt(issue.affected_locations);
        
        if (affectedCount > 10 || affectedLocations > 3) {
          systemIssues.push({
            type: issue.issue_type,
            affectedCount,
            affectedLocations,
            severity: affectedLocations > 5 ? 'CRITICAL' : 'HIGH'
          });
        }
      }
      
      // Send system-wide alerts
      for (const issue of systemIssues) {
        await notificationService.createNotification(
          'SYSTEM_WIDE_ISSUE',
          `System-wide ${issue.type} issues detected: ${issue.affectedCount} items affected across ${issue.affectedLocations} locations`,
          issue.severity,
          {
            issueType: issue.type,
            affectedCount: issue.affectedCount,
            affectedLocations: issue.affectedLocations,
            detectionTime: new Date().toISOString()
          }
        );
      }
      
      return systemIssues;
      
    } catch (error) {
      log.error(`Error detecting system-wide issues: ${error.message}`);
      throw error;
    }
  }

  async detectAnomalies() {
    try {
      // Detect unusual patterns in the last 24 hours
      const sql = `
        SELECT 
          l.name as location_name,
          l.location_id as location_id,
          COUNT(o.order_id) as orders_today,
          AVG(COUNT(o.order_id)) OVER() as avg_orders,
          STDDEV(COUNT(o.order_id)) OVER() as stddev_orders
        FROM locations l
        LEFT JOIN orders o ON l.location_id = o.location_id 
          AND o.created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY l.location_id, l.name
        HAVING COUNT(o.order_id) < (AVG(COUNT(o.order_id)) OVER() - 2 * STDDEV(COUNT(o.order_id)) OVER())
          OR COUNT(o.order_id) > (AVG(COUNT(o.order_id)) OVER() + 2 * STDDEV(COUNT(o.order_id)) OVER())
      `;
      
      const result = await query(sql);
      const anomalies = [];
      
      for (const location of result) {
        const ordersToday = parseInt(location.orders_today);
        const avgOrders = parseFloat(location.avg_orders || 0);
        const deviation = Math.abs(ordersToday - avgOrders);
        
        let anomalyType = 'UNUSUAL_ORDER_PATTERN';
        let severity = 'MEDIUM';
        let message = '';
        
        if (ordersToday === 0 && avgOrders > 5) {
          anomalyType = 'NO_ORDERS_ANOMALY';
          severity = 'HIGH';
          message = `No orders received at ${location.location_name} in the last 24 hours (average: ${avgOrders.toFixed(1)})`;
        } else if (ordersToday < avgOrders * 0.3) {
          anomalyType = 'LOW_ORDER_VOLUME';
          severity = 'MEDIUM';
          message = `Unusually low order volume at ${location.location_name}: ${ordersToday} orders (average: ${avgOrders.toFixed(1)})`;
        } else if (ordersToday > avgOrders * 3) {
          anomalyType = 'HIGH_ORDER_VOLUME';
          severity = 'MEDIUM';
          message = `Unusually high order volume at ${location.location_name}: ${ordersToday} orders (average: ${avgOrders.toFixed(1)})`;
        }
        
        if (message) {
          anomalies.push({
            type: anomalyType,
            locationId: location.location_id,
            locationName: location.location_name,
            ordersToday,
            avgOrders: avgOrders.toFixed(1),
            deviation: deviation.toFixed(1),
            severity
          });
          
          await notificationService.createNotification(
            anomalyType,
            message,
            severity,
            {
              locationId: location.location_id,
              locationName: location.location_name,
              ordersToday,
              avgOrders: avgOrders.toFixed(1),
              deviation: deviation.toFixed(1),
              detectionTime: new Date().toISOString()
            },
            location.location_id
          );
        }
      }
      
      return anomalies;
      
    } catch (error) {
      log.error(`Error detecting anomalies: ${error.message}`);
      throw error;
    }
  }

  async sendSummaryNotification(totalIssues, results) {
    try {
      const summary = {
        totalIssues,
        staffShortages: results.staffShortages.length,
        systemIssues: results.systemIssues.length,
        anomalies: results.anomalies.length,
        detectionTime: new Date().toISOString()
      };

      let message = `Exception Detection Summary:\n`;
      message += `- Total Issues: ${totalIssues}\n`;
      message += `- Staff Shortages: ${summary.staffShortages}\n`;
      message += `- System Issues: ${summary.systemIssues}\n`;
      message += `- Anomalies: ${summary.anomalies}`;

      await notificationService.createNotification(
        'EXCEPTION_DETECTION_SUMMARY',
        message,
        totalIssues > 10 ? 'CRITICAL' : totalIssues > 5 ? 'HIGH' : 'MEDIUM',
        summary
      );
      
    } catch (error) {
      log.error(`Error sending summary notification: ${error.message}`);
    }
  }

  // ===== HEALTH CHECK METHODS =====
  
  getStatus() {
    return {
      name: this.name,
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      schedule: this.schedule,
      errors: this.errors,
      hasErrors: this.errors.length > 0
    };
  }

  getNextScheduledRun() {
    if (!this.lastRun) return 'Not scheduled';
    
    const nextRun = new Date(this.lastRun);
    nextRun.setMinutes(nextRun.getMinutes() + 10);
    
    return nextRun;
  }

  async getHealthCheck() {
    return {
      status: this.isRunning ? 'running' : 'ready',
      lastRun: this.lastRun,
      nextRun: this.getNextScheduledRun(),
      errorsCount: this.errors.length,
      lastResults: this.results ? {
        totalIssues: this.results.totalIssuesDetected,
        staffShortages: this.results.staffShortages.length,
        systemIssues: this.results.systemIssues.length,
        anomalies: this.results.anomalies.length
      } : null
    };
  }

  async triggerManual() {
    log.info('Manual trigger for exception detection job');
    await this.execute();
  }

  getDetailedResults() {
    return this.results;
  }
}

module.exports = new ExceptionDetection(); 