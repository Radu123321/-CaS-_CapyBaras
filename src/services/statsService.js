const repo = require('../repositories/statsRepository');

const statsService = {
  async getDashboard(branchId = 1) {
    const [orders, equipment] = await Promise.all([
      repo.ordersDaily(branchId, 7),
      repo.equipmentStatus(branchId)
    ]);
    return { ordersDaily: orders, equipmentStatus: equipment };
  },

  async getDashboardSummary(branchId = 1) {
    const orders = await repo.ordersDaily(branchId, 30);
    const totalOrders = orders.reduce((s,o)=>s+Number(o.orders_cnt||0),0);
    const revenue = orders.reduce((s,o)=>s+Number(o.revenue||0),0);
    return { totalOrders, revenue };
  },

  async getSystemStatus() { return { ok:true, timestamp:new Date().toISOString() }; },
  async getPerformanceStats(branchId=1) { return statsService.getDashboard(branchId); },

  getOrderStats: opts=>repo.ordersDaily(opts?.branchId||1, opts?.days||30),
  getOrderTrends: opts=>repo.ordersDaily(opts?.branchId||1, opts?.days||90),

  async getResourceStats(branchId) { return repo.lowStock(branchId); },
  getResourceEfficiency: ()=>Promise.resolve({ todo:true }),

  getEquipmentStats: b=>repo.equipmentStatus(b),
  getEquipmentHealth: ()=>Promise.resolve({ todo:true }),

  getEmployeeStats: ()=>Promise.resolve({ total:0 }),
  getEmployeeProductivity: ()=>Promise.resolve([]),

  getWeatherImpact: ()=>Promise.resolve({}),
  getRevenueStats: ()=>Promise.resolve({}),
  getPerformanceKPIs: ()=>Promise.resolve({}),
  generateReport: ()=>Promise.resolve({}),
  getLocationComparison: ()=>Promise.resolve([]),

  // --------------------------------------------------
  // Fallback helpers for legacy controller expectations
  // --------------------------------------------------
  // Some controllers still call these richer analytics methods. Until we
  // implement full logic, return lightweight data so that endpoints nu mai
  // aruncă 500.

  async getDashboardData(branchId = 1) {
    // Simply delegate to basic dashboard implementation.
    return statsService.getDashboard(branchId);
  },

  async getOrderAnalytics(branchId = 1, /* period */ _period = 'day') {
    // Return the same ordersDaily metric for last 30 zile.
    const trends = await repo.ordersDaily(branchId, 30);
    return { period: _period, trends };
  },

  async getEquipmentAnalytics(branchId = 1) {
    const statusArr = await repo.equipmentStatus(branchId);
    const total = statusArr.reduce((s,e)=>s+Number(e.count||0),0);
    return {
      summary: { totalEquipment: total },
      statuses: statusArr
    };
  },

  // expose raw helpers
  ordersDaily: repo.ordersDaily,
  lowStock: repo.lowStock,
  equipmentStatus: repo.equipmentStatus
};

module.exports = statsService; 