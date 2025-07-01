const repo = require('../repositories/employeeRepository');

module.exports = {
  // basic wrappers used internally
  list: branchId => repo.list(branchId),
  get: id => repo.getFull(id),
  create: data => repo.create(data),

  // legacy aliases expected by controller logic
  getAllEmployees: filters => repo.list(filters?.location_id ?? null),
  getEmployeeById: id => repo.getFull(id),
  getEmployeeByCode: code => Promise.resolve(null),
  getEmployeesByPosition: position => repo.list(null),
  getEmployeesByLocation: locId => repo.list(locId),
  searchEmployees: (term, filters) => repo.list(null),
  addSkill: () => Promise.resolve(),
  removeSkill: () => Promise.resolve(),
  updateEmployee: async (id, data) => {
    // Update core user fields and employee profile if provided
    const pool = require('../core/psql');
    const repo = require('../repositories/employeeRepository');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userFields = [];
      const userValues = [id];
      if (data.first_name !== undefined) { userValues.push(data.first_name); userFields.push(`first_name=$${userValues.length}`); }
      if (data.last_name !== undefined)  { userValues.push(data.last_name);  userFields.push(`last_name=$${userValues.length}`); }
      if (data.phone !== undefined)      { userValues.push(data.phone);      userFields.push(`phone=$${userValues.length}`); }
      if (data.branch_id !== undefined)  { userValues.push(data.branch_id);  userFields.push(`branch_id=$${userValues.length}`); }
      // Only execute user update if there are fields to set
      if (userFields.length) {
        await client.query(`UPDATE users SET ${userFields.join(', ')}, updated_at=now() WHERE id=$1 AND role='EMPLOYEE'`, userValues);
      }
      // Employee profile updates
      const profileFields = [];
      const profileValues = [id];
      if (data.staff_role !== undefined)   { profileValues.push(data.staff_role); profileFields.push(`staff_role=$${profileValues.length}`); }
      if (data.hourly_rate !== undefined)  { profileValues.push(data.hourly_rate); profileFields.push(`hourly_rate=$${profileValues.length}`); }
      if (profileFields.length) {
        await client.query(`UPDATE employees_profiles SET ${profileFields.join(', ')} WHERE employee_id=$1`, profileValues);
      }
      await client.query('COMMIT');
      return repo.getFull(id);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
  deleteEmployee: async (id) => {
    const repo = require('../repositories/employeeRepository');
    const existing = await repo.get(id);
    if (!existing) return false;
    await repo.remove(id);
    return true;
  },
  getEmployeeStats: () => Promise.resolve({ total: 0 }),

  VALID_POSITIONS: ['CLEANER', 'DRIVER', 'SUPERVISOR']
}; 