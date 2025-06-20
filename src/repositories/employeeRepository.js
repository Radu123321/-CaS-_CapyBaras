const { query } = require('../core/psql');

class EmployeeRepository {
  async create(employeeData) {
    const { user_id, employee_type, hire_date, salary } = employeeData;
    
    const insertSQL = `
      INSERT INTO employees (user_id, employee_type, hire_date, salary)
      VALUES ($1, $2, $3, $4)
      RETURNING employee_id, user_id, employee_type, hire_date, salary, is_active, created_at
    `;
    
    const result = await query(insertSQL, [user_id, employee_type, hire_date, salary]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findAll(includeInactive = false) {
    let whereClause = includeInactive ? '' : 'WHERE e.is_active = true';
    
    const selectSQL = `
      SELECT e.employee_id, e.user_id, e.employee_type, e.hire_date, e.salary, 
             e.is_active, e.created_at,
             u.email, u.full_name, u.is_active as user_active
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      ${whereClause}
      ORDER BY e.created_at DESC
    `;
    
    return await query(selectSQL);
  }

  async findById(employeeId) {
    const selectSQL = `
      SELECT e.employee_id, e.user_id, e.employee_type, e.hire_date, e.salary, 
             e.is_active, e.created_at,
             u.email, u.full_name, u.is_active as user_active
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      WHERE e.employee_id = $1
    `;
    
    const result = await query(selectSQL, [employeeId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findByType(employeeType) {
    const selectSQL = `
      SELECT e.employee_id, e.user_id, e.employee_type, e.hire_date, e.salary, 
             e.is_active, e.created_at,
             u.email, u.full_name, u.is_active as user_active
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      WHERE e.employee_type = $1 AND e.is_active = true
      ORDER BY e.created_at DESC
    `;
    
    return await query(selectSQL, [employeeType]);
  }

  async findByUserId(userId) {
    const selectSQL = `
      SELECT employee_id, user_id, employee_type, hire_date, salary, is_active, created_at
      FROM employees
      WHERE user_id = $1
    `;
    
    const result = await query(selectSQL, [userId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async update(employeeId, employeeData) {
    const { employee_type, salary, is_active } = employeeData;
    
    const updateSQL = `
      UPDATE employees 
      SET employee_type = COALESCE($2, employee_type),
          salary = COALESCE($3, salary),
          is_active = COALESCE($4, is_active)
      WHERE employee_id = $1
      RETURNING employee_id, user_id, employee_type, hire_date, salary, is_active, created_at
    `;
    
    const result = await query(updateSQL, [
      employeeId, 
      employee_type || null, 
      salary || null,
      is_active !== undefined ? is_active : null
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  async softDelete(employeeId) {
    const updateSQL = `
      UPDATE employees 
      SET is_active = false
      WHERE employee_id = $1
      RETURNING employee_id, user_id, employee_type, is_active
    `;
    
    const result = await query(updateSQL, [employeeId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async exists(employeeId) {
    const selectSQL = `
      SELECT 1 FROM employees WHERE employee_id = $1
    `;
    
    const result = await query(selectSQL, [employeeId]);
    return result && result.length > 0;
  }

  async existsByUserId(userId) {
    const selectSQL = `
      SELECT 1 FROM employees WHERE user_id = $1
    `;
    
    const result = await query(selectSQL, [userId]);
    return result && result.length > 0;
  }

  async isValidEmployeeType(employeeType) {
    const validTypes = ['CLEANER', 'DRIVER', 'ADMIN', 'MANAGER'];
    return validTypes.includes(employeeType);
  }
}

module.exports = new EmployeeRepository(); 