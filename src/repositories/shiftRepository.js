const { query } = require('../core/psql');

class ShiftRepository {
  // Creează un schimb nou
  async create(shiftData) {
    const {
      employee_id,
      location_id,
      shift_date,
      start_time,
      end_time,
      break_duration,
      hours_worked,
      hourly_rate,
      total_pay,
      status,
      notes
    } = shiftData;
    
    const insertSQL = `
      INSERT INTO employee_shifts (employee_id, location_id, shift_date, start_time, 
                                 end_time, break_duration, hours_worked, hourly_rate, 
                                 total_pay, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING shift_id, employee_id, location_id, shift_date, start_time, end_time,
                break_duration, hours_worked, hourly_rate, total_pay, status, notes, created_at
    `;
    
    const result = await query(insertSQL, [
      employee_id, location_id, shift_date, start_time, end_time,
      break_duration || 0, hours_worked, hourly_rate, total_pay,
      status || 'SCHEDULED', notes
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește toate schimburile cu filtre
  async findAll(filters = {}) {
    const { 
      employee_id, 
      location_id, 
      status, 
      date_from, 
      date_to,
      limit = 50, 
      offset = 0 
    } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (employee_id) {
      whereClause += ` AND es.employee_id = $${paramIndex}`;
      params.push(employee_id);
      paramIndex++;
    }
    
    if (location_id) {
      whereClause += ` AND es.location_id = $${paramIndex}`;
      params.push(location_id);
      paramIndex++;
    }
    
    if (status) {
      whereClause += ` AND es.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (date_from) {
      whereClause += ` AND es.shift_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereClause += ` AND es.shift_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT es.shift_id, es.employee_id, es.location_id, es.shift_date, es.start_time,
             es.end_time, es.break_duration, es.hours_worked, es.hourly_rate, es.total_pay,
             es.status, es.notes, es.created_at,
             e.employee_code, u.first_name, u.last_name, u.email, u.phone,
             l.name as location_name, l.address as location_address
      FROM employee_shifts es
      JOIN employees e ON es.employee_id = e.employee_id
      JOIN users u ON e.user_id = u.user_id
      JOIN locations l ON es.location_id = l.location_id
      ${whereClause}
      ORDER BY es.shift_date DESC, es.start_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    return await query(selectSQL, params);
  }

  // Găsește schimb prin ID
  async findById(shiftId) {
    const selectSQL = `
      SELECT es.shift_id, es.employee_id, es.location_id, es.shift_date, es.start_time,
             es.end_time, es.break_duration, es.hours_worked, es.hourly_rate, es.total_pay,
             es.status, es.notes, es.created_at,
             e.employee_code, e.position, u.first_name, u.last_name, u.email, u.phone,
             l.name as location_name, l.address as location_address
      FROM employee_shifts es
      JOIN employees e ON es.employee_id = e.employee_id
      JOIN users u ON e.user_id = u.user_id
      JOIN locations l ON es.location_id = l.location_id
      WHERE es.shift_id = $1
    `;
    
    const result = await query(selectSQL, [shiftId]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește schimburile pentru un angajat
  async findByEmployeeId(employeeId, filters = {}) {
    const { status, date_from, date_to, limit = 30 } = filters;
    
    let whereClause = 'WHERE es.employee_id = $1';
    const params = [employeeId];
    let paramIndex = 2;
    
    if (status) {
      whereClause += ` AND es.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (date_from) {
      whereClause += ` AND es.shift_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereClause += ` AND es.shift_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT es.shift_id, es.location_id, es.shift_date, es.start_time, es.end_time,
             es.break_duration, es.hours_worked, es.hourly_rate, es.total_pay,
             es.status, es.notes, es.created_at,
             l.name as location_name
      FROM employee_shifts es
      JOIN locations l ON es.location_id = l.location_id
      ${whereClause}
      ORDER BY es.shift_date DESC, es.start_time DESC
      LIMIT $${paramIndex}
    `;
    
    params.push(limit);
    return await query(selectSQL, params);
  }

  // Găsește schimburile pentru o locație
  async findByLocationId(locationId, filters = {}) {
    const { status, date_from, date_to, limit = 50 } = filters;
    
    let whereClause = 'WHERE es.location_id = $1';
    const params = [locationId];
    let paramIndex = 2;
    
    if (status) {
      whereClause += ` AND es.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (date_from) {
      whereClause += ` AND es.shift_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereClause += ` AND es.shift_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT es.shift_id, es.employee_id, es.shift_date, es.start_time, es.end_time,
             es.break_duration, es.hours_worked, es.hourly_rate, es.total_pay,
             es.status, es.notes,
             e.employee_code, u.first_name, u.last_name, u.phone
      FROM employee_shifts es
      JOIN employees e ON es.employee_id = e.employee_id
      JOIN users u ON e.user_id = u.user_id
      ${whereClause}
      ORDER BY es.shift_date DESC, es.start_time DESC
      LIMIT $${paramIndex}
    `;
    
    params.push(limit);
    return await query(selectSQL, params);
  }

  // Găsește schimburile active (în curs)
  async findActive(locationId = null) {
    let whereClause = "WHERE es.status = 'IN_PROGRESS'";
    const params = [];
    
    if (locationId) {
      whereClause += ' AND es.location_id = $1';
      params.push(locationId);
    }
    
    const selectSQL = `
      SELECT es.shift_id, es.employee_id, es.location_id, es.shift_date, es.start_time,
             es.end_time, es.break_duration, es.hours_worked, es.hourly_rate,
             e.employee_code, u.first_name, u.last_name, u.phone,
             l.name as location_name
      FROM employee_shifts es
      JOIN employees e ON es.employee_id = e.employee_id
      JOIN users u ON e.user_id = u.user_id
      JOIN locations l ON es.location_id = l.location_id
      ${whereClause}
      ORDER BY es.start_time ASC
    `;
    
    return await query(selectSQL, params);
  }

  // Găsește schimburile programate pentru azi
  async findTodayScheduled(locationId = null) {
    let whereClause = "WHERE es.status = 'SCHEDULED' AND es.shift_date = CURRENT_DATE";
    const params = [];
    
    if (locationId) {
      whereClause += ' AND es.location_id = $1';
      params.push(locationId);
    }
    
    const selectSQL = `
      SELECT es.shift_id, es.employee_id, es.location_id, es.start_time, es.end_time,
             es.hourly_rate, es.notes,
             e.employee_code, u.first_name, u.last_name, u.phone,
             l.name as location_name
      FROM employee_shifts es
      JOIN employees e ON es.employee_id = e.employee_id
      JOIN users u ON e.user_id = u.user_id
      JOIN locations l ON es.location_id = l.location_id
      ${whereClause}
      ORDER BY es.start_time ASC
    `;
    
    return await query(selectSQL, params);
  }

  // Actualizează schimbul
  async update(shiftId, shiftData) {
    const {
      shift_date,
      start_time,
      end_time,
      break_duration,
      hours_worked,
      hourly_rate,
      total_pay,
      status,
      notes
    } = shiftData;
    
    const updateSQL = `
      UPDATE employee_shifts 
      SET shift_date = COALESCE($2, shift_date),
          start_time = COALESCE($3, start_time),
          end_time = COALESCE($4, end_time),
          break_duration = COALESCE($5, break_duration),
          hours_worked = COALESCE($6, hours_worked),
          hourly_rate = COALESCE($7, hourly_rate),
          total_pay = COALESCE($8, total_pay),
          status = COALESCE($9, status),
          notes = COALESCE($10, notes)
      WHERE shift_id = $1
      RETURNING shift_id, employee_id, location_id, shift_date, start_time, end_time,
                break_duration, hours_worked, hourly_rate, total_pay, status, notes, updated_at
    `;
    
    const result = await query(updateSQL, [
      shiftId, shift_date || null, start_time || null, end_time || null,
      break_duration !== undefined ? break_duration : null,
      hours_worked || null, hourly_rate || null, total_pay || null,
      status || null, notes || null
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Actualizează statusul schimbului
  async updateStatus(shiftId, newStatus, additionalData = {}) {
    const { hours_worked, total_pay } = additionalData;
    
    let setClause = 'status = $2';
    const params = [shiftId, newStatus];
    let paramIndex = 3;
    
    if (hours_worked !== undefined) {
      setClause += `, hours_worked = $${paramIndex}`;
      params.push(hours_worked);
      paramIndex++;
    }
    
    if (total_pay !== undefined) {
      setClause += `, total_pay = $${paramIndex}`;
      params.push(total_pay);
      paramIndex++;
    }
    
    const updateSQL = `
      UPDATE employee_shifts 
      SET ${setClause}
      WHERE shift_id = $1
      RETURNING shift_id, status, hours_worked, total_pay
    `;
    
    const result = await query(updateSQL, params);
    return result && result.length > 0 ? result[0] : null;
  }

  // Începe schimbul (marchează ca în progres)
  async startShift(shiftId) {
    const updateSQL = `
      UPDATE employee_shifts 
      SET status = 'IN_PROGRESS',
          start_time = CASE WHEN start_time IS NULL THEN CURRENT_TIME ELSE start_time END
      WHERE shift_id = $1 AND status = 'SCHEDULED'
      RETURNING shift_id, status, start_time
    `;
    
    const result = await query(updateSQL, [shiftId]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Termină schimbul (calculează orele și plata)
  async endShift(shiftId, endTime = null, breakDuration = 0) {
    const actualEndTime = endTime || new Date().toTimeString().slice(0, 8);
    
    const updateSQL = `
      UPDATE employee_shifts 
      SET status = 'COMPLETED',
          end_time = $2,
          break_duration = $3,
          hours_worked = EXTRACT(hours FROM ($2::time - start_time)) - ($3 / 60.0),
          total_pay = hourly_rate * (EXTRACT(hours FROM ($2::time - start_time)) - ($3 / 60.0))
      WHERE shift_id = $1 AND status = 'IN_PROGRESS'
      RETURNING shift_id, status, end_time, hours_worked, total_pay
    `;
    
    const result = await query(updateSQL, [shiftId, actualEndTime, breakDuration]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Șterge schimbul
  async delete(shiftId) {
    const deleteSQL = `
      DELETE FROM employee_shifts 
      WHERE shift_id = $1 AND status IN ('SCHEDULED', 'CANCELLED')
      RETURNING shift_id
    `;
    
    const result = await query(deleteSQL, [shiftId]);
    return result && result.length > 0;
  }

  // Verifică dacă schimbul există
  async exists(shiftId) {
    const selectSQL = `SELECT 1 FROM employee_shifts WHERE shift_id = $1`;
    const result = await query(selectSQL, [shiftId]);
    return result && result.length > 0;
  }

  // Verifică conflictele de programare pentru un angajat
  async checkConflicts(employeeId, shiftDate, startTime, endTime, excludeShiftId = null) {
    let whereClause = `
      WHERE employee_id = $1 
        AND shift_date = $2 
        AND status IN ('SCHEDULED', 'IN_PROGRESS')
        AND (
          (start_time <= $3 AND end_time > $3) OR
          (start_time < $4 AND end_time >= $4) OR
          (start_time >= $3 AND end_time <= $4)
        )
    `;
    
    const params = [employeeId, shiftDate, startTime, endTime];
    
    if (excludeShiftId) {
      whereClause += ' AND shift_id != $5';
      params.push(excludeShiftId);
    }
    
    const selectSQL = `
      SELECT shift_id, shift_date, start_time, end_time, status
      FROM employee_shifts
      ${whereClause}
    `;
    
    return await query(selectSQL, params);
  }

  // Obține statusurile valide
  async getValidStatuses() {
    return ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  }

  // Obține statistici schimburi
  async getStats(filters = {}) {
    const { employee_id, location_id, date_from, date_to } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (employee_id) {
      whereClause += ` AND employee_id = $${paramIndex}`;
      params.push(employee_id);
      paramIndex++;
    }
    
    if (location_id) {
      whereClause += ` AND location_id = $${paramIndex}`;
      params.push(location_id);
      paramIndex++;
    }
    
    if (date_from) {
      whereClause += ` AND shift_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereClause += ` AND shift_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    const statsSQL = `
      SELECT 
        COUNT(*) as total_shifts,
        COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END) as scheduled_shifts,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as active_shifts,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_shifts,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_shifts,
        COUNT(CASE WHEN status = 'NO_SHOW' THEN 1 END) as no_show_shifts,
        SUM(hours_worked) as total_hours_worked,
        SUM(total_pay) as total_payroll,
        AVG(hours_worked) as avg_hours_per_shift,
        AVG(hourly_rate) as avg_hourly_rate,
        COUNT(DISTINCT employee_id) as unique_employees
      FROM employee_shifts
      ${whereClause}
    `;
    
    const result = await query(statsSQL, params);
    return result && result.length > 0 ? result[0] : null;
  }

  // Obține raportul de prezență pentru o perioadă
  async getAttendanceReport(filters = {}) {
    const { location_id, date_from, date_to } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (location_id) {
      whereClause += ` AND es.location_id = $${paramIndex}`;
      params.push(location_id);
      paramIndex++;
    }
    
    if (date_from) {
      whereClause += ` AND es.shift_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereClause += ` AND es.shift_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    const reportSQL = `
      SELECT 
        e.employee_id,
        e.employee_code,
        u.first_name,
        u.last_name,
        l.name as location_name,
        COUNT(es.shift_id) as total_shifts,
        COUNT(CASE WHEN es.status = 'COMPLETED' THEN 1 END) as completed_shifts,
        COUNT(CASE WHEN es.status = 'NO_SHOW' THEN 1 END) as no_show_shifts,
        COUNT(CASE WHEN es.status = 'CANCELLED' THEN 1 END) as cancelled_shifts,
        SUM(es.hours_worked) as total_hours,
        SUM(es.total_pay) as total_pay,
        ROUND(
          (COUNT(CASE WHEN es.status = 'COMPLETED' THEN 1 END)::numeric / 
           NULLIF(COUNT(CASE WHEN es.status != 'CANCELLED' THEN 1 END), 0)) * 100, 2
        ) as attendance_rate
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      JOIN locations l ON e.location_id = l.location_id
      LEFT JOIN employee_shifts es ON e.employee_id = es.employee_id
      ${whereClause}
      GROUP BY e.employee_id, e.employee_code, u.first_name, u.last_name, l.name
      ORDER BY l.name, u.first_name, u.last_name
    `;
    
    return await query(reportSQL, params);
  }

  // Obține programul săptămânal pentru o locație
  async getWeeklySchedule(locationId, weekStartDate) {
    const selectSQL = `
      SELECT 
        es.shift_id,
        es.employee_id,
        es.shift_date,
        es.start_time,
        es.end_time,
        es.status,
        e.employee_code,
        u.first_name,
        u.last_name,
        EXTRACT(dow FROM es.shift_date) as day_of_week
      FROM employee_shifts es
      JOIN employees e ON es.employee_id = e.employee_id
      JOIN users u ON e.user_id = u.user_id
      WHERE es.location_id = $1 
        AND es.shift_date >= $2 
        AND es.shift_date < $2 + INTERVAL '7 days'
        AND es.status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED')
      ORDER BY es.shift_date, es.start_time
    `;
    
    return await query(selectSQL, [locationId, weekStartDate]);
  }
}

module.exports = new ShiftRepository(); 