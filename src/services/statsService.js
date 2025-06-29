const repo = require('../repositories/statsRepository');
function ok(v){return Promise.resolve(v);}
module.exports = {
  getDashboard: ()=>ok({}),
  getDashboardSummary: ()=>ok({}),
  getSystemStatus: ()=>ok({}),
  getPerformanceStats: ()=>ok({}),
  getOrderStats: f=>repo.ordersDaily(f.branchId||1,30),
  getOrderTrends: ()=>ok([]),
  getResourceStats: ()=>ok({}),
  getResourceEfficiency: ()=>ok({}),
  getEquipmentStats: b=>repo.equipmentStatus(b),
  getEquipmentHealth: ()=>ok({}),
  getEmployeeStats: ()=>ok({}),
  getEmployeeProductivity: ()=>ok({}),
  getWeatherImpact: ()=>ok({}),
  getRevenueStats: ()=>ok({}),
  getPerformanceKPIs: ()=>ok({}),
  generateReport: ()=>ok({}),
  getLocationComparison: ()=>ok({}),
  // minimal ones used earlier
  ordersDaily: repo.ordersDaily,
  lowStock: repo.lowStock,
  equipmentStatus: repo.equipmentStatus
}; 