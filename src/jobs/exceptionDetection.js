const notificationService = require('../core/notificationService');
const log = require('../core/logger');

class ExceptionDetection {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.errors = [];
    this.successCount = 0;
    this.detectionResults = {
      staff: [],
      power: [],
      equipment: [],
      transport: []
    };
  }

  async execute() {
    if (this.isRunning) {
      log.warn('Exception detection already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      log.info('Starting automated exception detection...');
      
      // Run comprehensive exception detection
      const results = await notificationService.runExceptionDetection();
      
      // Store results for monitoring
      this.detectionResults = {
        staff: results.staffIssues || [],
        power: results.powerIssues || [],
        equipment: results.equipmentIssues || [],
        transport: results.transportIssues || []
      };
      
      // Calculate summary
      const totalIssues = this.detectionResults.staff.length + 
                         this.detectionResults.power.length + 
                         this.detectionResults.equipment.length + 
                         this.detectionResults.transport.length;
      
      // Log summary
      log.info(`Exception detection completed: ${totalIssues} total issues found`);
      log.info(`- Staff issues: ${this.detectionResults.staff.length}`);
      log.info(`- Power issues: ${this.detectionResults.power.length}`);
      log.info(`- Equipment issues: ${this.detectionResults.equipment.length}`);
      log.info(`- Transport issues: ${this.detectionResults.transport.length}`);
      
      // Send summary notification if there are critical issues
      await this.sendSummaryNotification(totalIssues, results);
      
      // Update job status
      this.lastRun = new Date();
      this.successCount++;
      this.errors = []; // Clear errors on successful run
      
      const duration = Date.now() - startTime;
      log.info(`Exception detection completed successfully in ${duration}ms`);
      
      return {
        success: true,
        totalIssues,
        results: this.detectionResults,
        duration,
        timestamp: this.lastRun
      };
      
    } catch (error) {
      this.errors.push({
        timestamp: new Date(),
        error: error.message,
        stack: error.stack
      });
      
      log.error(`Exception detection failed: ${error.message}`);
      
      // Send alert about failed exception detection
      try {
        await notificationService.createNotification(
          'EXCEPTION_DETECTION_FAILED',
          `Automated exception detection failed: ${error.message}`,
          'HIGH',
          { 
            error: error.message,
            timestamp: new Date().toISOString(),
            jobName: 'exceptionDetection'
          }
        );
      } catch (alertError) {
        log.error(`Failed to send exception detection failure alert: ${alertError.message}`);
      }
      
      throw error;
      
    } finally {
      this.isRunning = false;
    }
  }

  async sendSummaryNotification(totalIssues, results) {
    try {
      if (totalIssues === 0) {
        // Send all-clear notification if configured
        await notificationService.createNotification(
          'SYSTEM_STATUS_OK',
          'All systems operational - no critical issues detected',
          'LOW',
          {
            totalIssues: 0,
            detectionTime: new Date().toISOString(),
            allClear: true
          }
        );
        return;
      }

      // Count critical issues
      const criticalIssues = [
        ...results.staffIssues.filter(issue => issue.severity === 'CRITICAL'),
        ...results.powerIssues.filter(issue => issue.severity === 'CRITICAL'),
        ...results.equipmentIssues.filter(issue => issue.severity === 'CRITICAL'),
        ...results.transportIssues.filter(issue => issue.severity === 'CRITICAL')
      ];

      if (criticalIssues.length > 0) {
        await notificationService.createNotification(
          'CRITICAL_ISSUES_DETECTED',
          `${criticalIssues.length} critical issues detected across the system. Immediate attention required.`,
          'CRITICAL',
          {
            totalIssues,
            criticalIssues: criticalIssues.length,
            breakdown: {
              staff: results.staffIssues.length,
              power: results.powerIssues.length,
              equipment: results.equipmentIssues.length,
              transport: results.transportIssues.length
            },
            detectionTime: new Date().toISOString()
          }
        );
      } else if (totalIssues > 5) {
        await notificationService.createNotification(
          'MULTIPLE_ISSUES_DETECTED',
          `${totalIssues} issues detected across the system. Review recommended.`,
          'MEDIUM',
          {
            totalIssues,
            breakdown: {
              staff: results.staffIssues.length,
              power: results.powerIssues.length,
              equipment: results.equipmentIssues.length,
              transport: results.transportIssues.length
            },
            detectionTime: new Date().toISOString()
          }
        );
      }
    } catch (error) {
      log.error(`Error sending summary notification: ${error.message}`);
    }
  }

  // ===== SPECIFIC DETECTION METHODS =====

  async detectCriticalStaffShortage() {
    try {
      const { query } = require('../core/psql');
      
      const sql = `
        SELECT 
          l.id as location_id,
          l.name as location_name,
          COUNT(e.id) as total_employees,
          COUNT(CASE WHEN e.status = 'ACTIVE' THEN 1 END) as active_employees
        FROM locations l
        LEFT JOIN employees e ON l.id = e.location_id
        GROUP BY l.id, l.name
        HAVING COUNT(CASE WHEN e.status = 'ACTIVE' THEN 1 END) = 0
          OR (COUNT(e.id) > 0 AND COUNT(CASE WHEN e.status = 'ACTIVE' THEN 1 END) * 100.0 / COUNT(e.id) < 25)
      `;
      
      const result = await query(sql);
      
      for (const location of result.rows) {
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
      
      return result.rows;
      
    } catch (error) {
      log.error(`Error detecting critical staff shortage: ${error.message}`);
      throw error;
    }
  }

  async detectSystemWideIssues() {
    try {
      const { query } = require('../core/psql');
      
      // Check for system-wide patterns
      const sql = `
        SELECT 
          'equipment' as issue_type,
          COUNT(*) as affected_count,
          COUNT(DISTINCT location_id) as affected_locations
        FROM equipment 
        WHERE status = 'OUT_OF_SERVICE'
        
        UNION ALL
        
        SELECT 
          'transport' as issue_type,
          COUNT(*) as affected_count,
          COUNT(DISTINCT location_id) as affected_locations
        FROM transports 
        WHERE status IN ('PENDING', 'IN_PROGRESS') 
          AND created_at < NOW() - INTERVAL '8 hours'
        
        UNION ALL
        
        SELECT 
          'inventory' as issue_type,
          COUNT(*) as affected_count,
          COUNT(DISTINCT location_id) as affected_locations
        FROM inventory i
        JOIN resources r ON i.resource_id = r.id
        WHERE i.quantity <= r.minimum_threshold
      `;
      
      const result = await query(sql);
      const systemIssues = [];
      
      for (const issue of result.rows) {
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
      const { query } = require('../core/psql');
      
      // Detect unusual patterns in the last 24 hours
      const sql = `
        SELECT 
          l.name as location_name,
          l.id as location_id,
          COUNT(o.id) as orders_today,
          AVG(COUNT(o.id)) OVER() as avg_orders,
          STDDEV(COUNT(o.id)) OVER() as stddev_orders
        FROM locations l
        LEFT JOIN orders o ON l.id = o.location_id 
          AND o.created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY l.id, l.name
        HAVING COUNT(o.id) < (AVG(COUNT(o.id)) OVER() - 2 * STDDEV(COUNT(o.id)) OVER())
          OR COUNT(o.id) > (AVG(COUNT(o.id)) OVER() + 2 * STDDEV(COUNT(o.id)) OVER())
      `;
      
      const result = await query(sql);
      const anomalies = [];
      
      for (const location of result.rows) {
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

  // ===== HEALTH CHECK METHODS =====
  
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      successCount: this.successCount,
      errorCount: this.errors.length,
      recentErrors: this.errors.slice(-5), // Last 5 errors
      lastResults: this.detectionResults,
      nextScheduledRun: this.getNextScheduledRun()
    };
  }

  getNextScheduledRun() {
    if (!this.lastRun) {
      return 'Not scheduled yet';
    }
    
    // Job runs every 30 minutes
    const nextRun = new Date(this.lastRun);
    nextRun.setMinutes(nextRun.getMinutes() + 30);
    
    return nextRun.toISOString();
  }

  async getHealthCheck() {
    const status = this.getStatus();
    const isHealthy = !status.isRunning && 
                     status.errorCount === 0 && 
                     status.lastRun && 
                     (Date.now() - new Date(status.lastRun).getTime()) < 35 * 60 * 1000; // Less than 35 minutes ago
    
    return {
      healthy: isHealthy,
      status: status,
      message: isHealthy ? 'Exception detection is working properly' : 'Exception detection has issues'
    };
  }

  // Manual trigger for testing
  async triggerManual() {
    log.info('Manual trigger for exception detection');
    return await this.execute();
  }

  // Get detailed results
  getDetailedResults() {
    return {
      lastRun: this.lastRun,
      results: this.detectionResults,
      summary: {
        totalIssues: Object.values(this.detectionResults).reduce((sum, issues) => sum + issues.length, 0),
        breakdown: {
          staff: this.detectionResults.staff.length,
          power: this.detectionResults.power.length,
          equipment: this.detectionResults.equipment.length,
          transport: this.detectionResults.transport.length
        },
        criticalIssues: Object.values(this.detectionResults)
          .flat()
          .filter(issue => issue.severity === 'CRITICAL').length
      }
    };
  }
}

module.exports = new ExceptionDetection(); 