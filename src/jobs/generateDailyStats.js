const statsService = require('../services/statsService');
const alertService = require('../services/alertService');
const log = require('../core/logger');

class GenerateDailyStats {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.errors = [];
    this.successCount = 0;
  }

  async execute() {
    if (this.isRunning) {
      log.warn('Daily stats generation already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      log.info('Starting daily statistics generation...');
      
      // Generate comprehensive statistics for all locations
      await this.generateLocationStats();
      
      // Generate performance reports
      await this.generatePerformanceReports();
      
      // Generate trend analysis
      await this.generateTrendAnalysis();
      
      // Check for critical issues and send alerts
      await this.checkCriticalIssues();
      
      // Update job status
      this.lastRun = new Date();
      this.successCount++;
      this.errors = []; // Clear errors on successful run
      
      const duration = Date.now() - startTime;
      log.info(`Daily statistics generation completed successfully in ${duration}ms`);
      
    } catch (error) {
      this.errors.push({
        timestamp: new Date(),
        error: error.message,
        stack: error.stack
      });
      
      log.error(`Daily stats generation failed: ${error.message}`);
      
      // Send alert about failed stats generation
      try {
        await alertService.createAlert(
          'STATS_GENERATION_FAILED',
          `Daily statistics generation failed: ${error.message}`,
          'HIGH',
          { 
            error: error.message,
            timestamp: new Date().toISOString()
          }
        );
      } catch (alertError) {
        log.error(`Failed to send stats generation failure alert: ${alertError.message}`);
      }
      
    } finally {
      this.isRunning = false;
    }
  }

  async generateLocationStats() {
    try {
      log.info('Generating location-specific statistics...');
      
      // Get all locations
      const { query } = require('../core/psql');
      const locationsResult = await query('SELECT id, name FROM locations ORDER BY name');
      const locations = locationsResult.rows;
      
      const locationStats = [];
      
      for (const location of locations) {
        try {
          // Generate comprehensive dashboard data for each location
          const dashboardData = await statsService.getDashboardData(location.id);
          
          locationStats.push({
            locationId: location.id,
            locationName: location.name,
            stats: dashboardData,
            generatedAt: new Date().toISOString()
          });
          
          log.info(`Generated stats for location: ${location.name}`);
          
        } catch (error) {
          log.error(`Failed to generate stats for location ${location.name}: ${error.message}`);
        }
      }
      
      // Store or cache location stats if needed
      // For now, we'll just log the summary
      log.info(`Generated statistics for ${locationStats.length} locations`);
      
      return locationStats;
      
    } catch (error) {
      log.error(`Error generating location stats: ${error.message}`);
      throw error;
    }
  }

  async generatePerformanceReports() {
    try {
      log.info('Generating performance reports...');
      
      const reports = {
        orders: await statsService.generateReport('orders', null, 'day', 'summary'),
        resources: await statsService.generateReport('resources', null, 'month', 'summary'),
        equipment: await statsService.generateReport('equipment', null, 'month', 'summary'),
        employees: await statsService.generateReport('employees', null, 'month', 'summary'),
        weather: await statsService.generateReport('weather', null, 'month', 'summary')
      };
      
      // Log key insights from each report
      Object.entries(reports).forEach(([type, report]) => {
        if (report.insights && report.insights.length > 0) {
          log.info(`${type.toUpperCase()} insights: ${report.insights.join(', ')}`);
        }
        
        if (report.recommendations && report.recommendations.length > 0) {
          log.info(`${type.toUpperCase()} recommendations: ${report.recommendations.length} items`);
        }
      });
      
      return reports;
      
    } catch (error) {
      log.error(`Error generating performance reports: ${error.message}`);
      throw error;
    }
  }

  async generateTrendAnalysis() {
    try {
      log.info('Generating trend analysis...');
      
      // Analyze order trends
      const orderAnalytics = await statsService.getOrderAnalytics(null, 'day');
      const orderTrends = orderAnalytics.trends;
      
      if (orderTrends) {
        log.info(`Order trend: ${orderTrends.trend} (${orderTrends.change}% change)`);
        
        // Alert on significant negative trends
        if (orderTrends.trend === 'decreasing' && Math.abs(orderTrends.change) > 20) {
          await alertService.createAlert(
            'NEGATIVE_ORDER_TREND',
            `Significant decrease in orders detected: ${orderTrends.change}% decline`,
            'HIGH',
            {
              trend: orderTrends.trend,
              change: orderTrends.change,
              recentAverage: orderTrends.recentAverage,
              previousAverage: orderTrends.previousAverage
            }
          );
        }
      }
      
      // Analyze resource efficiency trends
      const resourceAnalytics = await statsService.getResourceAnalytics(null, 'month');
      const avgEfficiency = resourceAnalytics.summary.avgEfficiency;
      
      if (avgEfficiency < 70) {
        log.warn(`Low average resource efficiency detected: ${avgEfficiency.toFixed(1)}%`);
        
        await alertService.createAlert(
          'LOW_RESOURCE_EFFICIENCY',
          `Average resource efficiency is below threshold: ${avgEfficiency.toFixed(1)}%`,
          'MEDIUM',
          {
            avgEfficiency: avgEfficiency,
            threshold: 70,
            optimizations: resourceAnalytics.optimizations.length
          }
        );
      }
      
      // Analyze equipment health trends
      const equipmentAnalytics = await statsService.getEquipmentAnalytics();
      const equipmentHealth = equipmentAnalytics.healthAnalysis.healthScore;
      
      if (equipmentHealth < 60) {
        log.warn(`Low equipment health score detected: ${equipmentHealth.toFixed(1)}`);
        
        await alertService.createAlert(
          'LOW_EQUIPMENT_HEALTH',
          `Equipment health score is below threshold: ${equipmentHealth.toFixed(1)}`,
          'HIGH',
          {
            healthScore: equipmentHealth,
            threshold: 60,
            criticalCount: equipmentAnalytics.healthAnalysis.critical.length,
            warningCount: equipmentAnalytics.healthAnalysis.warning.length
          }
        );
      }
      
      return {
        orderTrends,
        avgResourceEfficiency: avgEfficiency,
        equipmentHealthScore: equipmentHealth
      };
      
    } catch (error) {
      log.error(`Error generating trend analysis: ${error.message}`);
      throw error;
    }
  }

  async checkCriticalIssues() {
    try {
      log.info('Checking for critical issues...');
      
      const issues = [];
      
      // Check equipment maintenance overdue
      const equipmentAnalytics = await statsService.getEquipmentAnalytics();
      const maintenanceOverdue = equipmentAnalytics.summary.maintenanceOverdue;
      
      if (maintenanceOverdue > 0) {
        issues.push({
          type: 'MAINTENANCE_OVERDUE',
          severity: 'HIGH',
          count: maintenanceOverdue,
          message: `${maintenanceOverdue} equipment items are overdue for maintenance`
        });
      }
      
      // Check for urgent maintenance predictions
      const urgentMaintenance = equipmentAnalytics.maintenancePredictions.filter(
        pred => pred.priority === 'URGENT'
      );
      
      if (urgentMaintenance.length > 0) {
        issues.push({
          type: 'URGENT_MAINTENANCE_NEEDED',
          severity: 'HIGH',
          count: urgentMaintenance.length,
          message: `${urgentMaintenance.length} equipment items need urgent maintenance`,
          details: urgentMaintenance.map(pred => ({
            equipment: pred.equipment,
            location: pred.location,
            daysUntil: pred.daysUntilMaintenance
          }))
        });
      }
      
      // Check resource efficiency issues
      const resourceAnalytics = await statsService.getResourceAnalytics();
      const highPriorityOptimizations = resourceAnalytics.optimizations.filter(
        opt => opt.priority === 'HIGH'
      );
      
      if (highPriorityOptimizations.length > 0) {
        issues.push({
          type: 'RESOURCE_EFFICIENCY_CRITICAL',
          severity: 'MEDIUM',
          count: highPriorityOptimizations.length,
          message: `${highPriorityOptimizations.length} critical resource efficiency issues detected`
        });
      }
      
      // Check employee performance issues
      const employeeAnalytics = await statsService.getEmployeeAnalytics();
      const underPerformers = employeeAnalytics.performanceAnalysis.underPerformers;
      
      if (underPerformers.length > 0) {
        const criticalUnderPerformers = underPerformers.filter(
          emp => parseFloat(emp.completion_rate || 0) < 50
        );
        
        if (criticalUnderPerformers.length > 0) {
          issues.push({
            type: 'CRITICAL_EMPLOYEE_PERFORMANCE',
            severity: 'MEDIUM',
            count: criticalUnderPerformers.length,
            message: `${criticalUnderPerformers.length} employees have critically low performance`
          });
        }
      }
      
      // Send alerts for all critical issues
      for (const issue of issues) {
        await alertService.createAlert(
          issue.type,
          issue.message,
          issue.severity,
          {
            count: issue.count,
            details: issue.details || null,
            detectedAt: new Date().toISOString()
          }
        );
      }
      
      log.info(`Checked critical issues: ${issues.length} issues found`);
      return issues;
      
    } catch (error) {
      log.error(`Error checking critical issues: ${error.message}`);
      throw error;
    }
  }

  // Health check methods
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      successCount: this.successCount,
      errorCount: this.errors.length,
      recentErrors: this.errors.slice(-5), // Last 5 errors
      nextScheduledRun: this.getNextScheduledRun()
    };
  }

  getNextScheduledRun() {
    if (!this.lastRun) {
      return 'Not scheduled yet';
    }
    
    // Daily job runs at midnight
    const tomorrow = new Date(this.lastRun);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return tomorrow.toISOString();
  }

  async getHealthCheck() {
    const status = this.getStatus();
    const isHealthy = !status.isRunning && 
                     status.errorCount === 0 && 
                     status.lastRun && 
                     (Date.now() - new Date(status.lastRun).getTime()) < 25 * 60 * 60 * 1000; // Less than 25 hours ago
    
    return {
      healthy: isHealthy,
      status: status,
      message: isHealthy ? 'Daily stats generation is working properly' : 'Daily stats generation has issues'
    };
  }

  // Manual trigger for testing
  async triggerManual() {
    log.info('Manual trigger for daily stats generation');
    return await this.execute();
  }
}

module.exports = new GenerateDailyStats(); 