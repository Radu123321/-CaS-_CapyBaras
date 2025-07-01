const repo = require('../repositories/maintenanceRepository');

function toDateOrNull(val) {
  if (!val) return null;
  try { return new Date(val).toISOString(); } catch { return null; }
}

module.exports = {
  list: filters => repo.list(filters),
  complete: id => repo.complete(id),
  cancel: id => repo.cancel(id),
  upcoming: (days, branchId) => repo.upcoming(days, branchId),

  // legacy aliases / now implemented
  getAllMaintenance: f=>repo.list(f||{}),
  getMaintenanceById: id => (repo.get ? repo.get(id) : Promise.resolve(null)),
  getMaintenanceByEquipment: (e,f)=>repo.list({equipmentId:e, ...f}),
  createMaintenance: async data => {
    const cols = 'equipment_id,due_at,task_desc,mandatory,status';
    const vals = [
      data.equipment_id,
      toDateOrNull(data.due_at || data.started_at) || new Date().toISOString(),
      data.task_desc || data.description || null,
      data.mandatory === undefined ? true : data.mandatory,
      data.status || 'PENDING'
    ];
    return repo.insert(cols, vals);
  },
  updateMaintenance: async (id, d={}) => {
    const set = [];
    const vals = [];
    const push = (col,val)=>{vals.push(val); set.push(`${col}=$${vals.length+1}`);} // +1 because id is first param
    if (d.due_at) push('due_at', toDateOrNull(d.due_at));
    if (d.task_desc) push('task_desc', d.task_desc);
    if (d.status) push('status', d.status);
    if (d.completed_at) push('completed_at', toDateOrNull(d.completed_at));
    if (!set.length) return repo.get(id);
    return repo.patch(id, set.join(', '), vals);
  },
  startMaintenance: id => repo.patch(id, "status='IN_PROGRESS'", []),
  completeMaintenance: (id, endedAt=null) => repo.patch(id, "status='COMPLETED', completed_at=$2", [endedAt||new Date()]),
  deleteMaintenance: id=>repo.remove(id),
  // Queries
  getTodayScheduled: async (branchId=null) => {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    return repo.list({ branchId, dueAfter: start.toISOString(), dueBefore: end.toISOString(), status:'PENDING'});
  },
  getOverdue: branchId=>repo.list({ branchId, dueBefore: new Date().toISOString(), status:'PENDING'}),
  getUrgent: branchId=>repo.upcoming(1, branchId),
  getMaintenanceTypes: () => ['PREVENTIVE','CORRECTIVE','INSPECTION'],
  getPriorityLevels: () => ['LOW','MEDIUM','HIGH','CRITICAL'],
  getMaintenanceStats: async () => {
    const all = await repo.list();
    return {
      total: all.length,
      byStatus: all.reduce((acc, m)=>{acc[m.status]=(acc[m.status]||0)+1; return acc;}, {})
    };
  },
  getUpcomingSchedule: async (branchId=null, days=7) => repo.upcoming(days, branchId)
}; 