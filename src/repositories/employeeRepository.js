const pool = require('../core/psql');
const Base = require('./_base');

class EmployeeRepository extends Base {
  constructor() { super('users'); }

  /** List employees (users with role EMPLOYEE) optionally by branch */
  list(branchId = null) {
    const params = ['EMPLOYEE'];
    let where = 'role = $1';
    if (branchId) {
      params.push(branchId);
      where += ` AND branch_id = $${params.length}`;
    }
    return super.list(where, params);
  }

  /** Get detailed employee incl. profile */
  async getFull(id) {
    const { rows } = await pool.query(
      `SELECT u.*, ep.staff_role, ep.hourly_rate, ep.hire_date
         FROM users u LEFT JOIN employees_profiles ep ON ep.employee_id = u.id
        WHERE u.id = $1`, [id]);
    return rows[0] || null;
  }

  async create(data) {
    const { email, pwd_hash, branch_id, first_name, last_name, phone, staff_role, hourly_rate, hire_date } = data;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO users (email,pwd_hash,role,branch_id,first_name,last_name,phone)
         VALUES ($1,$2,'EMPLOYEE',$3,$4,$5,$6) RETURNING *`,
        [email, pwd_hash, branch_id, first_name, last_name, phone]);
      const userId = rows[0].id;
      await client.query(
        `INSERT INTO employees_profiles (employee_id, staff_role, hourly_rate, hire_date)
         VALUES ($1,$2,$3,$4)`,
        [userId, staff_role, hourly_rate, hire_date]);
      await client.query('COMMIT');
      return this.getFull(userId);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

module.exports = new EmployeeRepository(); 