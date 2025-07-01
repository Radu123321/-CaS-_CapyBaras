const repo = require('../repositories/shiftRepository');

function buildSet(data, allowed) {
  const set = [];
  const vals = [];
  const push = (col,val)=>{vals.push(val); set.push(`${col}=$${vals.length+1}`);} // +1 for id param later
  Object.entries(data).forEach(([k,v])=>{ if (allowed.includes(k) && v!==undefined) push(k,v); });
  return { set: set.join(', '), vals };
}

module.exports = {
  // generic
  list: filters => repo.list(filters),
  get: id => repo.get(id),
  start: id => repo.start(id),
  end: id => repo.end(id),
  active: branchId => repo.active(branchId),

  // controller-friendly aliases
  getAllShifts: filters => repo.list(filters||{}),
  getShiftById: id => repo.get(id),
  getShiftsByEmployee: (empId, f) => repo.list({employeeId:empId, ...f}),
  getShiftsByLocation: (locId, f) => repo.list({branchId:locId, ...f}),

  createShift: async data => {
    const cols = [];
    const vals = [];
    if (data.employee_id) { cols.push('employee_id'); vals.push(data.employee_id); }
    if (data.branch_id) { cols.push('branch_id'); vals.push(data.branch_id); }
    if (data.shift_role_code) { cols.push('shift_role_code'); vals.push(data.shift_role_code); }
    if (data.start_ts) { cols.push('start_ts'); vals.push(data.start_ts); }
    if (data.end_ts) { cols.push('end_ts'); vals.push(data.end_ts); }
    const colStr = cols.join(',');
    return repo.insert(colStr, vals);
  },

  updateShift: async (id, data={}) => {
    const allowed = ['shift_role_code','start_ts','end_ts'];
    const { set, vals } = buildSet(data, allowed);
    if (!set.length) return repo.get(id);
    return repo.patch(id, set, vals);
  },

  updateShiftStatus: (id, status, additional={}) => {
    if (status === 'IN_PROGRESS') return repo.start(id);
    if (status === 'COMPLETED') return repo.end(id);
    return repo.patch(id, 'shift_role_code=$2', [status]);
  },

  startShift: id => repo.start(id),
  endShift: (id, endTime=null) => repo.end(id),
  deleteShift: id => repo.remove(id),
  getActiveShifts: filters => repo.active(filters?.branchId||null),
  getTodayScheduled: async locId => {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    return repo.list({ branchId: locId, from: start.toISOString(), to: end.toISOString()});
  },
  getValidStatuses: ()=>['SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED'],
  getShiftStats: async () => {
    const all = await repo.list();
    return { total: all.length };
  },
  getAttendanceReport: ()=>[],
  getWeeklySchedule: ()=>[]
}; 