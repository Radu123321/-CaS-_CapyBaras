const statsRepository = require('../repositories/statsRepository');
const alertService = require('./alertService');
const log = require('../core/logger');

class StatsService {
  // ===== ORDER ANALYTICS =====
  
  async getOrderAnalytics(locationId = null, period = 'day', startDate = null, endDate = null) {
    try {
      const orders = await statsRepository.getOrdersPerPeriod(locationId, period, startDate, endDate);
      const statusStats = await statsRepository.getOrdersByStatus(locationId, period);
      
      // Calculate trends
      const trends = this.calculateOrderTrends(orders);
      
      return {
        orders,
        statusDistribution: statusStats,
        trends,
        summary: {
          totalOrders: orders.reduce((sum, o) => sum + parseInt(o.order_count), 0),
          totalRevenue: orders.reduce((sum, o) => sum + parseFloat(o.total_revenue || 0), 0),
          avgOrderValue: orders.length > 0 ? 
            orders.reduce((sum, o) => sum + parseFloat(o.avg_order_value || 0), 0) / orders.length : 0
        }
      };
    } catch (error) {
      log.error(`Error getting order analytics: ${error.message}`);
      throw error;
    }
  }
  
  calculateOrderTrends(orders) {
    if (orders.length < 2) return { trend: 'stable', change: 0 };
    
    const recent = orders.slice(0, Math.ceil(orders.length / 2));
    const older = orders.slice(Math.ceil(orders.length / 2));
    
    const recentAvg = recent.reduce((sum, o) => sum + parseInt(o.order_count), 0) / recent.length;
    const olderAvg = older.reduce((sum, o) => sum + parseInt(o.order_count), 0) / older.length;
    
    const change = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    
    return {
      trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
      change: Math.round(change * 100) / 100,
      recentAverage: Math.round(recentAvg * 100) / 100,
      previousAverage: Math.round(olderAvg * 100) / 100
    };
  }
  
  // ===== RESOURCE ANALYTICS =====
  
  async getResourceAnalytics(locationId = null, period = 'month') {
    try {
      const consumption = await statsRepository.getResourceConsumption(locationId, period);
      const efficiency = await statsRepository.getResourceEfficiency(locationId);
      
      // Identify resource usage patterns
      const patterns = this.analyzeResourcePatterns(consumption);
      
      // Check for waste or optimization opportunities
      const optimizations = this.identifyResourceOptimizations(efficiency);
      
      return {
        consumption,
        efficiency,
        patterns,
        optimizations,
        summary: {
          totalConsumption: consumption.reduce((sum, r) => sum + parseFloat(r.total_consumed || 0), 0),
          avgEfficiency: efficiency.length > 0 ? 
            efficiency.reduce((sum, r) => sum + parseFloat(r.efficiency_percentage || 0), 0) / efficiency.length : 0,
          resourceTypes: [...new Set(consumption.map(r => r.resource_type))]
        }
      };
    } catch (error) {
      log.error(`Error getting resource analytics: ${error.message}`);
      throw error;
    }
  }
  
  analyzeResourcePatterns(consumption) {
    const patterns = {
      highUsage: consumption.filter(r => parseFloat(r.total_consumed) > 1000),
      lowEfficiency: consumption.filter(r => parseFloat(r.avg_per_transaction) > 50),
      frequentUse: consumption.filter(r => parseInt(r.transaction_count) > 100)
    };
    
    return {
      ...patterns,
      insights: [
        ...patterns.highUsage.map(r => `High consumption detected for ${r.resource_name}: ${r.total_consumed} units`),
        ...patterns.lowEfficiency.map(r => `Low efficiency for ${r.resource_name}: ${r.avg_per_transaction} units per transaction`),
        ...patterns.frequentUse.map(r => `Frequent usage of ${r.resource_name}: ${r.transaction_count} transactions`)
      ]
    };
  }
  
  identifyResourceOptimizations(efficiency) {
    const optimizations = [];
    
    efficiency.forEach(resource => {
      const efficiencyRate = parseFloat(resource.efficiency_percentage || 0);
      
      if (efficiencyRate < 70) {
        optimizations.push({
          resource: resource.resource_name,
          type: 'LOW_EFFICIENCY',
          current: efficiencyRate,
          recommendation: 'Review usage patterns and training procedures',
          priority: efficiencyRate < 50 ? 'HIGH' : 'MEDIUM'
        });
      }
      
      if (parseFloat(resource.total_consumed || 0) === 0) {
        optimizations.push({
          resource: resource.resource_name,
          type: 'UNUSED_RESOURCE',
          recommendation: 'Consider removing or redistributing this resource',
          priority: 'LOW'
        });
      }
    });
    
    return optimizations;
  }
  
  // ===== EQUIPMENT ANALYTICS =====
  
  async getEquipmentAnalytics(locationId = null) {
    try {
      const efficiency = await statsRepository.getEquipmentEfficiency(locationId);
      const maintenanceTrends = await statsRepository.getMaintenanceTrends(locationId);
      
      // Analyze equipment health
      const healthAnalysis = this.analyzeEquipmentHealth(efficiency);
      
      // Predict maintenance needs
      const maintenancePredictions = this.predictMaintenanceNeeds(efficiency);
      
      return {
        efficiency,
        maintenanceTrends,
        healthAnalysis,
        maintenancePredictions,
        summary: {
          totalEquipment: efficiency.length,
          operativeCount: efficiency.filter(e => e.status === 'OPERATIVE').length,
          avgEfficiency: efficiency.length > 0 ? 
            efficiency.reduce((sum, e) => sum + parseInt(e.efficiency_score), 0) / efficiency.length : 0,
          maintenanceOverdue: efficiency.filter(e => parseInt(e.days_since_maintenance) > 90).length
        }
      };
    } catch (error) {
      log.error(`Error getting equipment analytics: ${error.message}`);
      throw error;
    }
  }
  
  analyzeEquipmentHealth(efficiency) {
    const analysis = {
      healthy: efficiency.filter(e => e.status === 'OPERATIVE' && parseInt(e.days_since_maintenance) <= 30),
      warning: efficiency.filter(e => e.status === 'OPERATIVE' && parseInt(e.days_since_maintenance) > 30 && parseInt(e.days_since_maintenance) <= 90),
      critical: efficiency.filter(e => e.status !== 'OPERATIVE' || parseInt(e.days_since_maintenance) > 90),
      aging: efficiency.filter(e => parseInt(e.age_days) > 365)
    };
    
    return {
      ...analysis,
      healthScore: efficiency.length > 0 ? 
        (analysis.healthy.length * 100 + analysis.warning.length * 60 + analysis.critical.length * 20) / efficiency.length : 0,
      recommendations: [
        ...analysis.critical.map(e => `URGENT: ${e.equipment_name} needs immediate attention`),
        ...analysis.warning.map(e => `Schedule maintenance for ${e.equipment_name} (${e.days_since_maintenance} days since last service)`),
        ...analysis.aging.map(e => `Consider replacement planning for ${e.equipment_name} (${Math.round(parseInt(e.age_days) / 365)} years old)`)
      ]
    };
  }
  
  predictMaintenanceNeeds(efficiency) {
    const predictions = [];
    
    efficiency.forEach(equipment => {
      const daysSinceMaintenance = parseInt(equipment.days_since_maintenance);
      const maintenanceCount = parseInt(equipment.maintenance_count);
      
      // Predict next maintenance based on patterns
      let predictedDays = 90; // Default maintenance cycle
      
      if (maintenanceCount > 0) {
        const avgCycle = parseInt(equipment.age_days) / maintenanceCount;
        predictedDays = Math.min(avgCycle, 120); // Cap at 4 months
      }
      
      const daysUntilMaintenance = predictedDays - daysSinceMaintenance;
      
      if (daysUntilMaintenance <= 30) {
        predictions.push({
          equipment: equipment.equipment_name,
          location: equipment.location_name,
          daysUntilMaintenance: Math.max(daysUntilMaintenance, 0),
          priority: daysUntilMaintenance <= 7 ? 'URGENT' : daysUntilMaintenance <= 14 ? 'HIGH' : 'MEDIUM',
          estimatedDate: new Date(Date.now() + daysUntilMaintenance * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    });
    
    return predictions.sort((a, b) => a.daysUntilMaintenance - b.daysUntilMaintenance);
  }
  
  // ===== EMPLOYEE ANALYTICS =====
  
  async getEmployeeAnalytics(locationId = null, period = 'month') {
    try {
      const productivity = await statsRepository.getEmployeeProductivity(locationId, period);
      
      // Analyze performance patterns
      const performanceAnalysis = this.analyzeEmployeePerformance(productivity);
      
      return {
        productivity,
        performanceAnalysis,
        summary: {
          totalEmployees: productivity.length,
          avgProductivity: productivity.length > 0 ? 
            productivity.reduce((sum, e) => sum + parseFloat(e.completion_rate || 0), 0) / productivity.length : 0,
          topPerformer: productivity.length > 0 ? 
            productivity.reduce((max, e) => parseFloat(e.revenue_generated || 0) > parseFloat(max.revenue_generated || 0) ? e : max) : null,
          totalRevenue: productivity.reduce((sum, e) => sum + parseFloat(e.revenue_generated || 0), 0)
        }
      };
    } catch (error) {
      log.error(`Error getting employee analytics: ${error.message}`);
      throw error;
    }
  }
  
  analyzeEmployeePerformance(productivity) {
    const analysis = {
      highPerformers: productivity.filter(e => parseFloat(e.completion_rate) >= 90 && parseInt(e.orders_handled) >= 10),
      underPerformers: productivity.filter(e => parseFloat(e.completion_rate) < 70 || parseInt(e.orders_handled) < 5),
      newEmployees: productivity.filter(e => parseInt(e.orders_handled) < 3),
      specialists: {}
    };
    
    // Group by employee type
    productivity.forEach(emp => {
      if (!analysis.specialists[emp.employee_type]) {
        analysis.specialists[emp.employee_type] = [];
      }
      analysis.specialists[emp.employee_type].push(emp);
    });
    
    return {
      ...analysis,
      insights: [
        `${analysis.highPerformers.length} high-performing employees`,
        `${analysis.underPerformers.length} employees may need additional support`,
        `${analysis.newEmployees.length} new employees in training phase`
      ],
      recommendations: [
        ...analysis.underPerformers.map(e => `Provide additional training for ${e.employee_name} (${e.completion_rate}% completion rate)`),
        ...analysis.newEmployees.map(e => `Monitor progress of new employee ${e.employee_name}`)
      ]
    };
  }
  
  // ===== WEATHER IMPACT ANALYTICS =====
  
  async getWeatherImpactAnalytics(locationId = null, period = 'month') {
    try {
      const weatherStats = await statsRepository.getWeatherImpactStats(locationId, period);
      
      // Analyze weather patterns
      const impactAnalysis = this.analyzeWeatherImpact(weatherStats);
      
      return {
        weatherStats,
        impactAnalysis,
        summary: {
          totalDataPoints: weatherStats.length,
          avgOrdersPerWeatherType: weatherStats.reduce((acc, w) => {
            if (!acc[w.condition]) acc[w.condition] = [];
            acc[w.condition].push(parseInt(w.order_count || 0));
            return acc;
          }, {}),
          weatherTypes: [...new Set(weatherStats.map(w => w.condition))]
        }
      };
    } catch (error) {
      log.error(`Error getting weather impact analytics: ${error.message}`);
      throw error;
    }
  }
  
  analyzeWeatherImpact(weatherStats) {
    const impactByCondition = {};
    
    weatherStats.forEach(stat => {
      if (!impactByCondition[stat.condition]) {
        impactByCondition[stat.condition] = {
          totalOrders: 0,
          totalRevenue: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          dataPoints: 0
        };
      }
      
      const impact = impactByCondition[stat.condition];
      impact.totalOrders += parseInt(stat.order_count || 0);
      impact.totalRevenue += parseFloat(stat.total_revenue || 0);
      impact.completedOrders += parseInt(stat.completed_orders || 0);
      impact.cancelledOrders += parseInt(stat.cancelled_orders || 0);
      impact.dataPoints += 1;
    });
    
    // Calculate impact scores
    const impactScores = Object.entries(impactByCondition).map(([condition, data]) => ({
      condition,
      avgOrdersPerDay: data.dataPoints > 0 ? data.totalOrders / data.dataPoints : 0,
      avgRevenuePerDay: data.dataPoints > 0 ? data.totalRevenue / data.dataPoints : 0,
      completionRate: data.totalOrders > 0 ? (data.completedOrders / data.totalOrders) * 100 : 0,
      cancellationRate: data.totalOrders > 0 ? (data.cancelledOrders / data.totalOrders) * 100 : 0,
      impactScore: data.totalOrders > 0 ? (data.completedOrders / data.totalOrders) * 100 : 0
    }));
    
    return {
      impactByCondition: impactScores.sort((a, b) => b.impactScore - a.impactScore),
      insights: [
        `Best weather for business: ${impactScores[0]?.condition || 'N/A'}`,
        `Most challenging weather: ${impactScores[impactScores.length - 1]?.condition || 'N/A'}`,
        `Average completion rate varies by ${Math.max(...impactScores.map(s => s.completionRate)) - Math.min(...impactScores.map(s => s.completionRate))}% across weather conditions`
      ]
    };
  }
  
  // ===== COMPREHENSIVE DASHBOARD =====
  
  async getDashboardData(locationId = null) {
    try {
      const [
        summary,
        kpis,
        orderAnalytics,
        resourceAnalytics,
        equipmentAnalytics,
        employeeAnalytics,
        weatherAnalytics
      ] = await Promise.all([
        statsRepository.getDashboardSummary(locationId),
        statsRepository.getPerformanceKPIs(locationId),
        this.getOrderAnalytics(locationId, 'day'),
        this.getResourceAnalytics(locationId),
        this.getEquipmentAnalytics(locationId),
        this.getEmployeeAnalytics(locationId),
        this.getWeatherImpactAnalytics(locationId)
      ]);
      
      // Generate alerts for critical issues
      await this.checkForCriticalIssues(summary, kpis, equipmentAnalytics);
      
      return {
        summary,
        kpis,
        analytics: {
          orders: orderAnalytics,
          resources: resourceAnalytics,
          equipment: equipmentAnalytics,
          employees: employeeAnalytics,
          weather: weatherAnalytics
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      log.error(`Error getting dashboard data: ${error.message}`);
      throw error;
    }
  }
  
  async checkForCriticalIssues(summary, kpis, equipmentAnalytics) {
    try {
      const alerts = [];
      
      // Check for critical equipment issues
      if (equipmentAnalytics.summary.maintenanceOverdue > 0) {
        alerts.push({
          type: 'EQUIPMENT_MAINTENANCE_OVERDUE',
          severity: 'HIGH',
          message: `${equipmentAnalytics.summary.maintenanceOverdue} equipment items overdue for maintenance`,
          data: { count: equipmentAnalytics.summary.maintenanceOverdue }
        });
      }
      
      // Check for low completion rates
      kpis.forEach(kpi => {
        if (parseFloat(kpi.completion_rate || 0) < 70) {
          alerts.push({
            type: 'LOW_COMPLETION_RATE',
            severity: 'MEDIUM',
            message: `Low completion rate at ${kpi.location_name}: ${kpi.completion_rate}%`,
            data: { location: kpi.location_name, rate: kpi.completion_rate }
          });
        }
      });
      
      // Send alerts if any critical issues found
      for (const alert of alerts) {
        await alertService.createAlert(alert.type, alert.message, alert.severity, alert.data);
      }
      
    } catch (error) {
      log.error(`Error checking for critical issues: ${error.message}`);
    }
  }
  
  // ===== REPORT GENERATION =====
  
  async generateReport(type, locationId = null, period = 'month', format = 'json') {
    try {
      let reportData;
      
      switch (type) {
        case 'comprehensive':
          reportData = await this.getDashboardData(locationId);
          break;
        case 'orders':
          reportData = await this.getOrderAnalytics(locationId, 'day');
          break;
        case 'resources':
          reportData = await this.getResourceAnalytics(locationId, period);
          break;
        case 'equipment':
          reportData = await this.getEquipmentAnalytics(locationId);
          break;
        case 'employees':
          reportData = await this.getEmployeeAnalytics(locationId, period);
          break;
        case 'weather':
          reportData = await this.getWeatherImpactAnalytics(locationId, period);
          break;
        default:
          throw new Error(`Unknown report type: ${type}`);
      }
      
      const report = {
        type,
        locationId,
        period,
        generatedAt: new Date().toISOString(),
        data: reportData
      };
      
      if (format === 'summary') {
        return this.generateReportSummary(report);
      }
      
      return report;
    } catch (error) {
      log.error(`Error generating report: ${error.message}`);
      throw error;
    }
  }
  
  generateReportSummary(report) {
    const summary = {
      type: report.type,
      generatedAt: report.generatedAt,
      keyMetrics: {},
      insights: [],
      recommendations: []
    };
    
    // Extract key metrics based on report type
    if (report.data.summary) {
      summary.keyMetrics = report.data.summary;
    }
    
    if (report.data.analytics) {
      summary.insights = [
        ...(report.data.analytics.orders?.trends ? [`Order trend: ${report.data.analytics.orders.trends.trend}`] : []),
        ...(report.data.analytics.equipment?.healthAnalysis?.recommendations || []),
        ...(report.data.analytics.employees?.performanceAnalysis?.insights || [])
      ];
      
      summary.recommendations = [
        ...(report.data.analytics.resources?.optimizations?.map(o => o.recommendation) || []),
        ...(report.data.analytics.equipment?.healthAnalysis?.recommendations || []),
        ...(report.data.analytics.employees?.performanceAnalysis?.recommendations || [])
      ];
    }
    
    return summary;
  }
}

module.exports = new StatsService(); 