const pool = require('../core/psql');

/**
 * User repository – ADMIN full control
 */
module.exports = {
  async list() {
    const { rows } = await pool.query(
      `SELECT u.*, b.name AS branch_name
         FROM users u
         LEFT JOIN branches b ON b.id = u.branch_id
        ORDER BY u.id`);
    return rows;
  },

  async create({ email, pwdHash, role, branchId = null, firstName, lastName, phone }) {
    const { rows } = await pool.query(
      `INSERT INTO users
         (email,pwd_hash,role,branch_id,first_name,last_name,phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id`,
      [email, pwdHash, role, branchId, firstName, lastName, phone]);
    return rows[0].id;
  },

  async update(id, { email, role, branchId, firstName, lastName, phone }) {
    const { rows } = await pool.query(
      `UPDATE users SET
         email=$2, role=$3, branch_id=$4,
         first_name=$5, last_name=$6, phone=$7,
         updated_at = now()
       WHERE id=$1 RETURNING *`,
      [id, email, role, branchId, firstName, lastName, phone]);
    return rows[0];
  },

  remove: id => pool.query('DELETE FROM users WHERE id=$1', [id])
}; 