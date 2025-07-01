const pool = require('../core/psql');

/**
 * Branch (location) repository – schema v3
 */
module.exports = {
  /**
   * List all branches; optional filter by city (ILIKE)
   * @param {string|null} city
   */
  async list(city = null) {
    const { rows } = await pool.query(
      `SELECT * FROM branches
       WHERE ($1::text IS NULL OR city ILIKE $1)
       ORDER BY id`, [city]
    );
    return rows;
  },

  /**
   * Create a new branch
   * @param {*} data {name,address,city,lat,lon,timezone,phone}
   * @param {number} userId  id of user performing action (admin)
   */
  async create(data, userId) {
    const { name, address, city, lat, lon, timezone, phone } = data;
    const { rows } = await pool.query(
      `INSERT INTO branches
         (name,address,city,lat,lon,timezone,phone,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [name, address, city, lat, lon, timezone, phone, userId]
    );
    return rows[0];
  },

  /** update branch by id */
  async update(id, data) {
    const { name, address, city, lat, lon, timezone, phone } = data;
    const { rows } = await pool.query(
      `UPDATE branches SET
         name=$2,address=$3,city=$4,lat=$5,lon=$6,timezone=$7,phone=$8
       WHERE id=$1 RETURNING *`,
      [id, name, address, city, lat, lon, timezone, phone]
    );
    return rows[0];
  },

  remove: id => pool.query('DELETE FROM branches WHERE id=$1', [id])
}; 