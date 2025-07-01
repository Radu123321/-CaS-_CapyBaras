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

  /** update branch by id (partial) */
  async update(id, data) {
    const allowed=['name','address','city','lat','lon','timezone','phone','is_active'];
    const setParts=[]; const params=[id];
    let idx=2;
    for(const key of allowed){
      if(data[key]!==undefined){
        setParts.push(`${key} = $${idx}`);
        params.push(data[key]);
        idx++;
      }
    }
    if(setParts.length===0) return this.get(id);
    const sql=`UPDATE branches SET ${setParts.join(', ')} WHERE id=$1 RETURNING *`;
    const { rows } = await pool.query(sql, params);
    return rows[0];
  },

  /**
   * Remove branch; returns:
   *   true   – hard-deleted
   *   'soft' – FK restriction, performed soft delete (is_active=false)
   *   false  – id not found
   */
  async remove(id) {
    try {
      const result = await pool.query('DELETE FROM branches WHERE id=$1', [id]);
      if (result.rowCount === 1) return true; // hard delete ok
      return false; // not found
    } catch (err) {
      // Foreign key violation → fall back to soft delete
      if (err.code === '23503') { // FK constraint
        const soft = await pool.query('UPDATE branches SET is_active=false WHERE id=$1 RETURNING *', [id]);
        return soft.rowCount === 1 ? 'soft' : false;
      }
      throw err; // propagate other errors
    }
  },

  /** get branch by id */
  async get(id) {
    const { rows } = await pool.query('SELECT * FROM branches WHERE id=$1', [id]);
    return rows[0] || null;
  }
}; 