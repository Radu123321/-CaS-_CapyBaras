const pool = require('../core/psql');

class BaseRepo {
  constructor(table, pk = 'id') {
    this.table = table;
    this.pk = pk;
  }

  /** generic list */
  list(where = 'TRUE', params = []) {
    return pool.query(`SELECT * FROM ${this.table} WHERE ${where}`, params)
            .then(r => r.rows);
  }

  get(id) {
    return pool.query(`SELECT * FROM ${this.table} WHERE ${this.pk}=$1`, [id])
            .then(r => r.rows[0] || null);
  }

  async insert(columns, values) {
    const idx = values.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await pool.query(
      `INSERT INTO ${this.table} (${columns}) VALUES (${idx}) RETURNING *`, values);
    return rows[0];
  }

  async patch(id, setExpr, values) {
    const { rows } = await pool.query(
      `UPDATE ${this.table} SET ${setExpr} WHERE ${this.pk}=$1 RETURNING *`,
      [id, ...values]);
    return rows[0];
  }

  remove(id) {
    return pool.query(`DELETE FROM ${this.table} WHERE ${this.pk}=$1`, [id]);
  }
}

module.exports = BaseRepo;