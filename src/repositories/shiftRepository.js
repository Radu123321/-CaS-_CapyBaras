const Base = require('./_base');
const pool = require('../core/psql');

/**
 * Shift repository – v3 compatible
 * Provides generic CRUD via BaseRepo plus a few helper queries for
 * browsing and operating on shifts. Designed to be lightweight – add
 * new helpers as needed.
 */
class ShiftRepository extends Base {
  constructor() {
    super('shifts'); // table defined in createschema_v3.sql
  }

  /**
   * Dynamic list with optional filters.
   * Supported keys in filters: branchId, employeeId, from, to.
   * Dates can be any expression accepted by PostgreSQL ::timestamptz.
   */
  list(filters = {}) {
    const { branchId, employeeId, from, to } = filters;
    const params = [];
    let where = 'TRUE';

    if (branchId !== undefined) {
      params.push(branchId);
      where += ` AND branch_id = $${params.length}`;
    }
    if (employeeId !== undefined) {
      params.push(employeeId);
      where += ` AND employee_id = $${params.length}`;
    }
    if (from) {
      params.push(from);
      where += ` AND start_ts >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      where += ` AND end_ts <= $${params.length}`;
    }
    return super.list(where, params);
  }

  /** Mark the shift as started (sets start_ts to now()) */
  start(id) {
    return this.patch(id, 'start_ts = now()', []);
  }

  /** Mark the shift as ended (sets end_ts to now()) */
  end(id) {
    return this.patch(id, 'end_ts = now()', []);
  }

  /**
   * Currently active shifts (end_ts IS NULL). If branchId is provided it
   * filters to that branch.
   */
  active(branchId = null) {
    const params = [];
    let where = 'end_ts IS NULL';
    if (branchId !== null) {
      params.push(branchId);
      where += ` AND branch_id = $${params.length}`;
    }
    return super.list(where, params);
  }
}

module.exports = new ShiftRepository(); 