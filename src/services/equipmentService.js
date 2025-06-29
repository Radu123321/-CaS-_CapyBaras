const repo = require('../repositories/equipmentRepository');

module.exports = {
  list: branchId => repo.getAllEquipment({branch_id: branchId}),
  getAllEquipment: filters => repo.getAllEquipment(filters||{}),
  getEquipmentById: id => repo.getEquipmentById(id),
  createEquipment: data => repo.createEquipment(data),
  updateEquipment: (id,data)=>repo.updateEquipment(id,data),
  create: data => repo.createEquipment(data),
  updateStatus: (id,status)=>repo.updateStatus?repo.updateStatus(id,status):repo.updateEquipment(id,{status}),
  // stubs
  scheduleMaintenance: ()=>Promise.resolve(null),
  completeMaintenance: ()=>Promise.resolve(null),
  checkEquipmentStatus: ()=>Promise.resolve([]),
  getDashboard: ()=>Promise.resolve({}),
  getDashboardSummary: ()=>Promise.resolve({}),
  getEquipmentStatuses: ()=>Promise.resolve([])
}; 