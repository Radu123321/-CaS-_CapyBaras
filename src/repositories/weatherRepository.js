const Base = require('./_base');
const pool = require('../core/psql');

/**
 * WeatherRepository – manages snapshots in weather_conditions table and exposes
 * a handful of analytic helpers.
 */
class WeatherRepository extends Base {
  constructor() {
    super('weather_conditions');
  }

  /** Latest snapshot for each branch */
  async latestAll() {
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (branch_id) *
         FROM weather_conditions
        ORDER BY branch_id, date DESC`);
    return rows;
  }

  latestByBranch(branchId) {
    return pool.query(
      `SELECT *
         FROM weather_conditions
        WHERE branch_id = $1
        ORDER BY date DESC
        LIMIT 1`, [branchId]
    ).then(r => r.rows[0] || null);
  }

  /** Historical range */
  history(branchId, daysBack = 7) {
    return pool.query(
      `SELECT *
         FROM weather_conditions
        WHERE branch_id = $1
          AND date >= CURRENT_DATE - $2::int * INTERVAL '1 day'
        ORDER BY date DESC`, [branchId, daysBack]
    ).then(r => r.rows);
  }
}

module.exports = new WeatherRepository(); 