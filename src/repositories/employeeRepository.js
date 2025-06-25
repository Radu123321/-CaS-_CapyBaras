const { query } = require('../core/psql');

class EmployeeRepository {
  async create(employeeData) {
    const { 
      user_id, 
      location_id, 
      employee_code, 
      position, 
      hourly_rate, 
      hire_date, 
      skills 
    } = employeeData;
    
    const insertSQL = `
      INSERT INTO employees (user_id, location_id, employee_code, position, 
                           hourly_rate, hire_date, skills)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING employee_id, user_id, location_id, employee_code, position,
                hourly_rate, hire_date, is_available, skills, created_at
    `;
    
    const result = await query(insertSQL, [
      user_id, location_id, employee_code, position, 
      hourly_rate, hire_date, skills || []
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findAll(filters = {}) {
    const { location_id, is_available, skills } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (location_id) {
      whereClause += ` AND e.location_id = $${paramIndex}`;
      params.push(location_id);
      paramIndex++;
    }
    
    if (is_available !== undefined) {
      whereClause += ` AND e.is_available = $${paramIndex}`;
      params.push(is_available);
      paramIndex++;
    }
    
    if (skills && skills.length > 0) {
      whereClause += ` AND e.skills && $${paramIndex}`;
      params.push(skills);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT e.employee_id, e.user_id, e.location_id, e.employee_code, 
             e.position, e.hourly_rate, e.hire_date, e.is_available, e.skills, e.created_at,
             u.username, u.email, u.first_name, u.last_name, u.phone, u.is_active,
             l.name as location_name, l.address as location_address
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      JOIN locations l ON e.location_id = l.location_id
      ${whereClause}
      ORDER BY e.created_at DESC
    `;
    
    return await query(selectSQL, params);
  }

  async findById(employeeId) {
    const selectSQL = `
      SELECT e.employee_id, e.user_id, e.location_id, e.employee_code, 
             e.position, e.hourly_rate, e.hire_date, e.is_available, e.skills, e.created_at,
             u.username, u.email, u.first_name, u.last_name, u.phone, u.is_active,
             l.name as location_name, l.address as location_address
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      JOIN locations l ON e.location_id = l.location_id
      WHERE e.employee_id = $1
    `;
    
    const result = await query(selectSQL, [employeeId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findByUserId(userId) {
    const selectSQL = `
      SELECT e.employee_id, e.user_id, e.location_id, e.employee_code, 
             e.position, e.hourly_rate, e.hire_date, e.is_available, e.skills, e.created_at,
             u.username, u.email, u.first_name, u.last_name, u.phone, u.is_active,
             l.name as location_name
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      JOIN locations l ON e.location_id = l.location_id
      WHERE e.user_id = $1
    `;
    
    const result = await query(selectSQL, [userId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findByCode(employeeCode) {
    const selectSQL = `
      SELECT e.employee_id, e.user_id, e.location_id, e.employee_code, 
             e.position, e.hourly_rate, e.hire_date, e.is_available, e.skills, e.created_at,
             u.username, u.email, u.first_name, u.last_name, u.phone, u.is_active,
             l.name as location_name
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      JOIN locations l ON e.location_id = l.location_id
      WHERE e.employee_code = $1
    `;
    
    const result = await query(selectSQL, [employeeCode]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findAvailableByLocation(locationId) {
    const selectSQL = `
      SELECT e.employee_id, e.user_id, e.employee_code, e.position, e.skills,
             u.first_name, u.last_name, u.phone
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      WHERE e.location_id = $1 AND e.is_available = true AND u.is_active = true
      ORDER BY e.position, u.first_name
    `;
    
    return await query(selectSQL, [locationId]);
  }

  async findBySkills(skills, locationId = null) {
    let whereClause = 'WHERE e.skills && $1 AND e.is_available = true AND u.is_active = true';
    const params = [skills];
    
    if (locationId) {
      whereClause += ' AND e.location_id = $2';
      params.push(locationId);
    }
    
    const selectSQL = `
      SELECT e.employee_id, e.user_id, e.employee_code, e.position, e.skills,
             u.first_name, u.last_name, u.phone, l.name as location_name
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      JOIN locations l ON e.location_id = l.location_id
      ${whereClause}
      ORDER BY l.name, e.position, u.first_name
    `;
    
    return await query(selectSQL, params);
  }

  async update(employeeId, employeeData) {
    const { 
      location_id, 
      position, 
      hourly_rate, 
      skills 
    } = employeeData;
    
    const updateSQL = `
      UPDATE employees 
      SET location_id = COALESCE($2, location_id),
          position = COALESCE($3, position),
          hourly_rate = COALESCE($4, hourly_rate),
          skills = COALESCE($5, skills)
      WHERE employee_id = $1
      RETURNING employee_id, user_id, location_id, employee_code, position,
                hourly_rate, hire_date, is_available, skills, updated_at
    `;
    
    const result = await query(updateSQL, [
      employeeId, 
      location_id || null, 
      position || null,
      hourly_rate || null,
      skills || null
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  async updateAvailability(employeeId, isAvailable) {
    const updateSQL = `
      UPDATE employees 
      SET is_available = $2
      WHERE employee_id = $1
      RETURNING employee_id, is_available
    `;
    
    const result = await query(updateSQL, [employeeId, isAvailable]);
    return result && result.length > 0 ? result[0] : null;
  }

  async addSkill(employeeId, skill) {
    const updateSQL = `
      UPDATE employees 
      SET skills = array_append(skills, $2)
      WHERE employee_id = $1 AND NOT ($2 = ANY(skills))
      RETURNING employee_id, skills
    `;
    
    const result = await query(updateSQL, [employeeId, skill]);
    return result && result.length > 0 ? result[0] : null;
  }

  async removeSkill(employeeId, skill) {
    const updateSQL = `
      UPDATE employees 
      SET skills = array_remove(skills, $2)
      WHERE employee_id = $1
      RETURNING employee_id, skills
    `;
    
    const result = await query(updateSQL, [employeeId, skill]);
    return result && result.length > 0 ? result[0] : null;
  }

  async delete(employeeId) {
    const deleteSQL = `
      DELETE FROM employees 
      WHERE employee_id = $1
      RETURNING employee_id
    `;
    
    const result = await query(deleteSQL, [employeeId]);
    return result && result.length > 0;
  }

  async exists(employeeId) {
    const selectSQL = `SELECT 1 FROM employees WHERE employee_id = $1`;
    const result = await query(selectSQL, [employeeId]);
    return result && result.length > 0;
  }

  async existsByUserId(userId) {
    const selectSQL = `SELECT 1 FROM employees WHERE user_id = $1`;
    const result = await query(selectSQL, [userId]);
    return result && result.length > 0;
  }

  async codeExists(employeeCode) {
    const selectSQL = `SELECT 1 FROM employees WHERE employee_code = $1`;
    const result = await query(selectSQL, [employeeCode]);
    return result && result.length > 0;
  }

  async getEmployeeStats() {
    const statsSQL = `
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN is_available = true THEN 1 END) as available_employees,
        COUNT(DISTINCT location_id) as locations_with_staff,
        AVG(hourly_rate) as avg_hourly_rate,
        COUNT(CASE WHEN hire_date > CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as new_hires_last_90_days
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      WHERE u.is_active = true
    `;
    
    const result = await query(statsSQL);
    return result && result.length > 0 ? result[0] : null;
  }

  async getStaffByLocation() {
    const statsSQL = `
      SELECT 
        l.location_id,
        l.name as location_name,
        COUNT(e.employee_id) as total_staff,
        COUNT(CASE WHEN e.is_available = true THEN 1 END) as available_staff,
        AVG(e.hourly_rate) as avg_hourly_rate
      FROM locations l
      LEFT JOIN employees e ON l.location_id = e.location_id
      LEFT JOIN users u ON e.user_id = u.user_id AND u.is_active = true
      WHERE l.is_active = true
      GROUP BY l.location_id, l.name
      ORDER BY l.name
    `;
    
    return await query(statsSQL);
  }

  async getMostSkilledEmployees(limit = 10) {
    const selectSQL = `
      SELECT e.employee_id, e.employee_code, e.position, e.skills,
             u.first_name, u.last_name, l.name as location_name,
             array_length(e.skills, 1) as skill_count
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      JOIN locations l ON e.location_id = l.location_id
      WHERE u.is_active = true AND e.is_available = true
      ORDER BY array_length(e.skills, 1) DESC NULLS LAST, u.first_name
      LIMIT $1
    `;
    
    return await query(selectSQL, [limit]);
  }
}

module.exports = new EmployeeRepository(); 