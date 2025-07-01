const repo = require('../repositories/equipmentRepository');
const maintenanceService = require('./maintenanceService');

module.exports = {
  list: branchId => repo.getAllEquipment({branch_id: branchId}),
  getAllEquipment: async filters => {
    try {
      return await repo.getAllEquipment(filters||{});
    } catch (e) {
      return [];
    }
  },
  getEquipmentById: id => repo.getEquipmentById(id),
  createEquipment: data => repo.createEquipment(data),
  updateEquipment: (id,data)=>repo.updateEquipment(id,data),
  create: data => repo.createEquipment(data),
  updateStatus: (id,status)=>repo.updateStatus?repo.updateStatus(id,status):repo.updateEquipment(id,{status}),
  // ═══ Maintenance wrappers ═══
  scheduleMaintenance: async data => {
    const maintenance = await maintenanceService.createMaintenance({
      equipment_id: data.equipment_id,
      due_at: data.started_at || data.due_at,
      task_desc: data.description || null,
      mandatory: data.mandatory === undefined ? !data.unplanned : data.mandatory,
      status: 'PENDING'
    });
    // Soft-fail if status update throws (e.g. same status)
    try {
      await repo.updateStatus(data.equipment_id, 'MAINTENANCE');
    } catch (_) { /* ignore */ }
    return maintenance;
  },
  completeMaintenance: (maintenanceId, completionData={}) => maintenanceService.completeMaintenance(maintenanceId, completionData.ended_at),
  // ═══ Dashboards & Status ═══
  checkEquipmentStatus: branchId => repo.getEquipmentStatusSummary(branchId),
  getDashboard: branchId => repo.getEquipmentStatusSummary(branchId),
  getDashboardSummary: branchId => repo.getEquipmentStatusSummary(branchId),
  getEquipmentStatuses: () => ['OPERATIONAL','MAINTENANCE','BROKEN','RETIRED']
}; 