const pool = require('../core/psql');

/**
 * StatsRepository – helper for on-the-fly aggregated KPIs.
 * NOTE: Does not extend BaseRepo as it operates over multiple tables & views.
 */
class StatsRepository {
  /** Total orders and revenue per day for a branch */
  async ordersDaily(branchId, daysBack = 30) {
    const { rows } = await pool.query(
      `SELECT DATE_TRUNC('day', created_at) AS day,
              COUNT(*)                       AS orders_cnt,
              SUM(total_price)               AS revenue
         FROM orders
        WHERE branch_id = $1
          AND created_at >= NOW() - INTERVAL '${daysBack} days'
        GROUP BY 1
        ORDER BY 1`, [branchId]);
    return rows;
  }

  /** Inventory stocks below minimum for a branch */
  async lowStock(branchId) {
    const { rows } = await pool.query(
      `SELECT *
         FROM inventory_stocks
        WHERE branch_id = $1
          AND qty_on_hand < min_qty
        ORDER BY item_code`, [branchId]);
    return rows;
  }

  /** Equipment breakdown statistics (count by status) */
  async equipmentStatus(branchId = null) {
    const params = [];
    let sql = `SELECT status, COUNT(*) AS count FROM equipment`;
    if (branchId) {
      params.push(branchId);
      sql += ` WHERE branch_id = $1`;
    }
    sql += ' GROUP BY status';
    const { rows } = await pool.query(sql, params);
    return rows;
  }
}

module.exports = new StatsRepository(); 