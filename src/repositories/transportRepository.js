const Base = require('./_base');
const pool = require('../core/psql');

class TransportRepository extends Base {
  constructor() { super('routes'); }

  /** List routes with filters {orderId, driverId, status} */
  list(filters = {}) {
    const { orderId, driverId, status } = filters;
    const params = [];
    let where = 'TRUE';
    if (orderId) { params.push(orderId); where += ` AND order_id=$${params.length}`; }
    if (driverId) { params.push(driverId); where += ` AND driver_id=$${params.length}`; }
    if (status)   { params.push(status);   where += ` AND status=$${params.length}`; }
    return super.list(where, params);
  }

  /** Mark route status */
  updateStatus(id, newStatus) {
    return this.patch(id, 'status = $2', [newStatus]);
  }

  /** Bulk finish all routes for order */
  closeForOrder(orderId) {
    return pool.query('UPDATE routes SET status = \"DONE\" WHERE order_id=$1', [orderId]);
  }
}

module.exports = new TransportRepository(); 