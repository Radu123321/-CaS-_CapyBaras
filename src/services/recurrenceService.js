const repo = require('../repositories/recurrenceRepository');

module.exports = {
  // Basic wrappers
  _buildWhere(filters={}) {
    if (!filters || typeof filters !== 'object' || Array.isArray(filters)) return { where: 'TRUE', vals: [] };
    const clauses=[]; const vals=[];
    const push=(expr,val)=>{vals.push(val); clauses.push(expr.replace('$',`$${vals.length}`));};
    if (filters.customer_id||filters.customerId) push('customer_id = $', filters.customer_id||filters.customerId);
    if (filters.branch_id||filters.branchId) push('branch_id = $', filters.branch_id||filters.branchId);
    if (filters.is_active!==undefined) push('active = $', filters.is_active);
    if (filters.limit) filters.limit = parseInt(filters.limit);
    if (filters.offset) filters.offset = parseInt(filters.offset);
    const where = clauses.length? clauses.join(' AND '):'TRUE';
    return { where, vals, limit:filters.limit, offset:filters.offset };
  },

  list(filters) {
    const { where, vals, limit, offset } = module.exports._buildWhere(filters);
    let sql = `SELECT * FROM recurring_orders WHERE ${where}`;
    if (limit) sql += ` LIMIT ${limit}`;
    if (offset) sql += ` OFFSET ${offset}`;
    return repo.list ? repo.list(sql, vals) : repo.list(where, vals); // fallback
  },

  get: id => repo.get ? repo.get(id) : null,
  insert: (...args)=>repo.insert?.(...args),
  due: () => repo.due(),
  scheduleNext: (id, ts) => repo.scheduleNext(id, ts),

  // Aliases expected by controller
  getAllRecurrences: filters => module.exports.list(filters),
  getRecurrenceById: id => repo.get ? repo.get(id) : Promise.resolve(null),
  getRecurrencesByCustomer: (custId, f) => repo.list({ customerId: custId, ...f }),
  getDueRecurrences: before => repo.due(),
  createRecurrence: data => {
    const cols = 'customer_id,branch_id,base_service_list,rrule,next_occurrence,active';
    const vals = [
      data.customer_id || null,
      data.branch_id || null,
      JSON.stringify(data.base_service_list || []),
      data.rrule || '*',
      data.next_occurrence || new Date().toISOString(),
      data.active !== false
    ];
    return repo.insert(cols, vals);
  },
  updateRecurrence: (id,data)=> Promise.resolve(data && id),
  updateActiveStatus: (id,active)=>repo.patch?repo.patch(id,'active=$2',[active]):Promise.resolve(null),
  deleteRecurrence: id=>repo.remove ? repo.remove(id) : Promise.resolve(null),
  getExpiredRecurrences: () => repo.list('active = true AND next_occurrence < now()', []),
  getRecurrenceStats: async () => {
    const all = await repo.list();
    return { total: all.length, active: all.filter(r=>r.active).length };
  },
  getStatsByPattern: () => Promise.resolve({}),
  processRecurringSchedules: ()=>Promise.resolve({processed:0})
}; 