const statsService = require('../services/statsService');
const log = require('../core/logger');

class StatsController {
  // ===== DASHBOARD ENDPOINTS =====
  
  async getDashboard(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      
      const dashboardData = await statsService.getDashboardData(locationId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: dashboardData
      }));
    } catch (error) {
      log.error(`Error getting dashboard: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get dashboard data'
      }));
    }
  }
  
  async getDashboardSummary(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      
      const summary = await statsService.generateReport('comprehensive', locationId, 'month', 'summary');
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: summary
      }));
    } catch (error) {
      log.error(`Error getting dashboard summary: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get dashboard summary'
      }));
    }
  }
  
  // ===== ORDER ANALYTICS =====
  
  async getOrderStats(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      const period = req.query.period || 'day';
      const startDate = req.query.startDate || null;
      const endDate = req.query.endDate || null;
      
      const orderAnalytics = await statsService.getOrderAnalytics(locationId, period, startDate, endDate);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: orderAnalytics
      }));
    } catch (error) {
      log.error(`Error getting order stats: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get order statistics'
      }));
    }
  }
  
  async getOrderTrends(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      const period = req.query.period || 'day';
      
      const analytics = await statsService.getOrderAnalytics(locationId, period);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          trends: analytics.trends,
          orders: analytics.orders,
          summary: analytics.summary
        }
      }));
    } catch (error) {
      log.error(`Error getting order trends: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get order trends'
      }));
    }
  }
  
  // ===== RESOURCE ANALYTICS =====
  
  async getResourceStats(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      const period = req.query.period || 'month';
      
      const resourceAnalytics = await statsService.getResourceAnalytics(locationId, period);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: resourceAnalytics
      }));
    } catch (error) {
      log.error(`Error getting resource stats: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get resource statistics'
      }));
    }
  }
  
  async getResourceEfficiency(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      
      const analytics = await statsService.getResourceAnalytics(locationId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          efficiency: analytics.efficiency,
          optimizations: analytics.optimizations,
          summary: analytics.summary
        }
      }));
    } catch (error) {
      log.error(`Error getting resource efficiency: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get resource efficiency'
      }));
    }
  }
  
  // ===== EQUIPMENT ANALYTICS =====
  
  async getEquipmentStats(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      
      const equipmentAnalytics = await statsService.getEquipmentAnalytics(locationId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: equipmentAnalytics
      }));
    } catch (error) {
      log.error(`Error getting equipment stats: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get equipment statistics'
      }));
    }
  }
  
  async getEquipmentHealth(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      
      const analytics = await statsService.getEquipmentAnalytics(locationId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          healthAnalysis: analytics.healthAnalysis,
          maintenancePredictions: analytics.maintenancePredictions,
          summary: analytics.summary
        }
      }));
    } catch (error) {
      log.error(`Error getting equipment health: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get equipment health data'
      }));
    }
  }
  
  // ===== EMPLOYEE ANALYTICS =====
  
  async getEmployeeStats(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      const period = req.query.period || 'month';
      
      const employeeAnalytics = await statsService.getEmployeeAnalytics(locationId, period);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: employeeAnalytics
      }));
    } catch (error) {
      log.error(`Error getting employee stats: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get employee statistics'
      }));
    }
  }
  
  async getEmployeeProductivity(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      const period = req.query.period || 'month';
      
      const analytics = await statsService.getEmployeeAnalytics(locationId, period);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          productivity: analytics.productivity,
          performanceAnalysis: analytics.performanceAnalysis,
          summary: analytics.summary
        }
      }));
    } catch (error) {
      log.error(`Error getting employee productivity: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get employee productivity data'
      }));
    }
  }
  
  // ===== WEATHER IMPACT ANALYTICS =====
  
  async getWeatherImpact(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      const period = req.query.period || 'month';
      
      const weatherAnalytics = await statsService.getWeatherImpactAnalytics(locationId, period);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: weatherAnalytics
      }));
    } catch (error) {
      log.error(`Error getting weather impact: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get weather impact data'
      }));
    }
  }
  
  // ===== REVENUE ANALYTICS =====
  
  async getRevenueStats(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      const period = req.query.period || 'month';
      
      const orderAnalytics = await statsService.getOrderAnalytics(locationId, 'day');
      
      // Calculate revenue trends
      const revenueData = {
        totalRevenue: orderAnalytics.summary.totalRevenue,
        avgOrderValue: orderAnalytics.summary.avgOrderValue,
        revenueByPeriod: orderAnalytics.orders.map(o => ({
          period: o.period,
          revenue: parseFloat(o.total_revenue || 0),
          orders: parseInt(o.order_count),
          avgValue: parseFloat(o.avg_order_value || 0)
        })),
        trends: orderAnalytics.trends
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: revenueData
      }));
    } catch (error) {
      log.error(`Error getting revenue stats: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get revenue statistics'
      }));
    }
  }
  
  // ===== PERFORMANCE KPIs =====
  
  async getPerformanceKPIs(req, res) {
    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId) : null;
      const period = req.query.period || 'month';
      
      const dashboardData = await statsService.getDashboardData(locationId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          kpis: dashboardData.kpis,
          summary: dashboardData.summary
        }
      }));
    } catch (error) {
      log.error(`Error getting performance KPIs: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get performance KPIs'
      }));
    }
  }
  
  // ===== REPORT GENERATION =====
  
  async generateReport(req, res) {
    try {
      const { type = 'comprehensive' } = req.body;
      const locationId = req.body.locationId ? parseInt(req.body.locationId) : null;
      const period = req.body.period || 'month';
      const format = req.body.format || 'json';
      
      const report = await statsService.generateReport(type, locationId, period, format);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: report
      }));
    } catch (error) {
      log.error(`Error generating report: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to generate report'
      }));
    }
  }
  
  // ===== COMPARISON ANALYTICS =====
  
  async getLocationComparison(req, res) {
    try {
      const period = req.query.period || 'month';
      
      // Get data for all locations
      const allLocationsData = await statsService.getDashboardData();
      
      // Create comparison data
      const comparison = {
        locations: allLocationsData.summary.map(location => ({
          locationId: location.location_id,
          locationName: location.location_name,
          ordersToday: parseInt(location.orders_today || 0),
          revenueToday: parseFloat(location.revenue_today || 0),
          ordersThisMonth: parseInt(location.orders_this_month || 0),
          revenueThisMonth: parseFloat(location.revenue_this_month || 0),
          operativeEquipment: parseInt(location.operative_equipment || 0),
          totalEquipment: parseInt(location.operative_equipment || 0) + 
                          parseInt(location.out_of_service_equipment || 0) + 
                          parseInt(location.maintenance_equipment || 0),
          equipmentUptime: parseInt(location.operative_equipment || 0) > 0 ? 
            (parseInt(location.operative_equipment) / 
             (parseInt(location.operative_equipment || 0) + 
              parseInt(location.out_of_service_equipment || 0) + 
              parseInt(location.maintenance_equipment || 0))) * 100 : 0
        })),
        summary: {
          totalLocations: allLocationsData.summary.length,
          bestPerforming: null,
          totalRevenue: 0,
          totalOrders: 0
        }
      };
      
      // Calculate totals and find best performing location
      comparison.summary.totalRevenue = comparison.locations.reduce((sum, l) => sum + l.revenueThisMonth, 0);
      comparison.summary.totalOrders = comparison.locations.reduce((sum, l) => sum + l.ordersThisMonth, 0);
      comparison.summary.bestPerforming = comparison.locations.reduce((max, l) => 
        l.revenueThisMonth > (max?.revenueThisMonth || 0) ? l : max, null);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: comparison
      }));
    } catch (error) {
      log.error(`Error getting location comparison: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get location comparison'
      }));
    }
  }
  
  // ===== UTILITY ENDPOINTS =====
  
  async getAvailablePeriods(req, res) {
    try {
      const periods = [
        { value: 'hour', label: 'Hourly', description: 'Data grouped by hour' },
        { value: 'day', label: 'Daily', description: 'Data grouped by day' },
        { value: 'week', label: 'Weekly', description: 'Data grouped by week' },
        { value: 'month', label: 'Monthly', description: 'Data grouped by month' },
        { value: 'quarter', label: 'Quarterly', description: 'Data grouped by quarter' },
        { value: 'year', label: 'Yearly', description: 'Data grouped by year' }
      ];
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: periods
      }));
    } catch (error) {
      log.error(`Error getting available periods: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get available periods'
      }));
    }
  }
  
  async getReportTypes(req, res) {
    try {
      const reportTypes = [
        { value: 'comprehensive', label: 'Comprehensive Report', description: 'Complete analytics dashboard' },
        { value: 'orders', label: 'Order Analytics', description: 'Order trends and statistics' },
        { value: 'resources', label: 'Resource Analytics', description: 'Resource consumption and efficiency' },
        { value: 'equipment', label: 'Equipment Analytics', description: 'Equipment health and maintenance' },
        { value: 'employees', label: 'Employee Analytics', description: 'Employee productivity and performance' },
        { value: 'weather', label: 'Weather Impact', description: 'Weather impact on operations' }
      ];
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: reportTypes
      }));
    } catch (error) {
      log.error(`Error getting report types: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get report types'
      }));
    }
  }
}

module.exports = new StatsController(); 