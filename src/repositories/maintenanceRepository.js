const Base = require('./_base');
const pool = require('../core/psql');

/**
 * Maintenance tasks repository – v3 compatible
 * Covers simple CRUD plus a few helper queries for due/overdue tasks.
 */
class MaintenanceRepository extends Base {
  constructor() {
    super('maintenance_tasks');
  }

  /**
   * List tasks with flexible filters.
   * @param {Object} filters {equipmentId, branchId, status, dueBefore, dueAfter}
   */
  list(filters = {}) {
    const { equipmentId, branchId, status, dueBefore, dueAfter } = filters;
    const params = [];
    let where = 'TRUE';

    if (equipmentId) {
      params.push(equipmentId);
      where += ` AND equipment_id = $${params.length}`;
    }

    if (branchId) {
      params.push(branchId);
      where += ` AND equipment_id IN (SELECT id FROM equipment WHERE branch_id = $${params.length})`;
    }

    if (status) {
      params.push(status);
      where += ` AND status = $${params.length}`;
    }

    if (dueAfter) {
      params.push(dueAfter);
      where += ` AND due_at >= $${params.length}`;
    }

    if (dueBefore) {
      params.push(dueBefore);
      where += ` AND due_at <= $${params.length}`;
    }

    return super.list(where, params);
  }

  /** Mark task completed */
  complete(id) {
    return this.patch(id, "status = 'COMPLETED', completed_at = now()", []);
  }

  /** Cancel task */
  cancel(id) {
    return this.patch(id, "status = 'CANCELLED'", []);
  }

  /** Return tasks that are due in next `days` days (or overdue if negative). */
  upcoming(days = 7, branchId = null) {
    const params = [days];
    let where = 'status = \"PENDING\" AND due_at <= now() + ($1 || \" days\")::interval';
    if (branchId) {
      params.push(branchId);
      where += ` AND equipment_id IN (SELECT id FROM equipment WHERE branch_id = $${params.length})`;
    }
    return super.list(where, params);
  }
}

module.exports = new MaintenanceRepository(); 