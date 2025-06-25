const { query } = require('../core/psql');

class RecurrenceRepository {
  // Creează o programare recurentă nouă
  async create(recurrenceData) {
    const {
      customer_id,
      location_id,
      service_id,
      recurrence_pattern,
      start_date,
      end_date,
      next_execution,
      is_active,
      notes
    } = recurrenceData;
    
    const insertSQL = `
      INSERT INTO recurring_schedules (customer_id, location_id, service_id, 
                                     recurrence_pattern, start_date, end_date, 
                                     next_execution, is_active, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING recurring_schedule_id, customer_id, location_id, service_id,
                recurrence_pattern, start_date, end_date, next_execution,
                is_active, notes, created_at
    `;
    
    const result = await query(insertSQL, [
      customer_id, location_id, service_id, recurrence_pattern,
      start_date, end_date, next_execution, 
      is_active !== undefined ? is_active : true, notes
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește toate programările recurente
  async findAll(filters = {}) {
    const { customer_id, location_id, is_active, limit = 50, offset = 0 } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (customer_id) {
      whereClause += ` AND rs.customer_id = $${paramIndex}`;
      params.push(customer_id);
      paramIndex++;
    }
    
    if (location_id) {
      whereClause += ` AND rs.location_id = $${paramIndex}`;
      params.push(location_id);
      paramIndex++;
    }
    
    if (is_active !== undefined) {
      whereClause += ` AND rs.is_active = $${paramIndex}`;
      params.push(is_active);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT rs.recurring_schedule_id, rs.customer_id, rs.location_id, rs.service_id,
             rs.recurrence_pattern, rs.start_date, rs.end_date, rs.next_execution,
             rs.is_active, rs.notes, rs.created_at,
             c.customer_code, u.first_name, u.last_name, u.email,
             l.name as location_name, l.address as location_address,
             s.name as service_name, s.description as service_description, s.price
      FROM recurring_schedules rs
      JOIN customers c ON rs.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      JOIN locations l ON rs.location_id = l.location_id
      JOIN services s ON rs.service_id = s.service_id
      ${whereClause}
      ORDER BY rs.next_execution ASC, rs.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    return await query(selectSQL, params);
  }

  // Găsește programare recurentă prin ID
  async findById(recurringScheduleId) {
    const selectSQL = `
      SELECT rs.recurring_schedule_id, rs.customer_id, rs.location_id, rs.service_id,
             rs.recurrence_pattern, rs.start_date, rs.end_date, rs.next_execution,
             rs.is_active, rs.notes, rs.created_at,
             c.customer_code, u.first_name, u.last_name, u.email, u.phone,
             l.name as location_name, l.address as location_address,
             s.name as service_name, s.description as service_description, s.price
      FROM recurring_schedules rs
      JOIN customers c ON rs.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      JOIN locations l ON rs.location_id = l.location_id
      JOIN services s ON rs.service_id = s.service_id
      WHERE rs.recurring_schedule_id = $1
    `;
    
    const result = await query(selectSQL, [recurringScheduleId]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește programările recurente pentru un client
  async findByCustomerId(customerId) {
    const selectSQL = `
      SELECT rs.recurring_schedule_id, rs.customer_id, rs.location_id, rs.service_id,
             rs.recurrence_pattern, rs.start_date, rs.end_date, rs.next_execution,
             rs.is_active, rs.notes, rs.created_at,
             l.name as location_name, s.name as service_name, s.price
      FROM recurring_schedules rs
      JOIN locations l ON rs.location_id = l.location_id
      JOIN services s ON rs.service_id = s.service_id
      WHERE rs.customer_id = $1
      ORDER BY rs.next_execution ASC
    `;
    
    return await query(selectSQL, [customerId]);
  }

  // Găsește programările recurente active care trebuie executate
  async findDueForExecution(beforeDate = null) {
    const checkDate = beforeDate || new Date();
    
    const selectSQL = `
      SELECT rs.recurring_schedule_id, rs.customer_id, rs.location_id, rs.service_id,
             rs.recurrence_pattern, rs.start_date, rs.end_date, rs.next_execution,
             rs.notes,
             c.customer_code, u.first_name, u.last_name, u.email, u.phone,
             l.name as location_name, l.address as location_address,
             s.name as service_name, s.description as service_description, s.price
      FROM recurring_schedules rs
      JOIN customers c ON rs.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      JOIN locations l ON rs.location_id = l.location_id
      JOIN services s ON rs.service_id = s.service_id
      WHERE rs.is_active = true 
        AND rs.next_execution <= $1
        AND (rs.end_date IS NULL OR rs.end_date >= CURRENT_DATE)
      ORDER BY rs.next_execution ASC
    `;
    
    return await query(selectSQL, [checkDate]);
  }

  // Actualizează programarea recurentă
  async update(recurringScheduleId, recurrenceData) {
    const {
      location_id,
      service_id,
      recurrence_pattern,
      start_date,
      end_date,
      next_execution,
      is_active,
      notes
    } = recurrenceData;
    
    const updateSQL = `
      UPDATE recurring_schedules 
      SET location_id = COALESCE($2, location_id),
          service_id = COALESCE($3, service_id),
          recurrence_pattern = COALESCE($4, recurrence_pattern),
          start_date = COALESCE($5, start_date),
          end_date = COALESCE($6, end_date),
          next_execution = COALESCE($7, next_execution),
          is_active = COALESCE($8, is_active),
          notes = COALESCE($9, notes)
      WHERE recurring_schedule_id = $1
      RETURNING recurring_schedule_id, customer_id, location_id, service_id,
                recurrence_pattern, start_date, end_date, next_execution,
                is_active, notes, updated_at
    `;
    
    const result = await query(updateSQL, [
      recurringScheduleId, location_id || null, service_id || null,
      recurrence_pattern || null, start_date || null, end_date || null,
      next_execution || null, is_active !== undefined ? is_active : null,
      notes || null
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Actualizează următoarea execuție
  async updateNextExecution(recurringScheduleId, nextExecution) {
    const updateSQL = `
      UPDATE recurring_schedules 
      SET next_execution = $2
      WHERE recurring_schedule_id = $1
      RETURNING recurring_schedule_id, next_execution
    `;
    
    const result = await query(updateSQL, [recurringScheduleId, nextExecution]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Activează/Dezactivează programarea recurentă
  async updateActiveStatus(recurringScheduleId, isActive) {
    const updateSQL = `
      UPDATE recurring_schedules 
      SET is_active = $2
      WHERE recurring_schedule_id = $1
      RETURNING recurring_schedule_id, is_active
    `;
    
    const result = await query(updateSQL, [recurringScheduleId, isActive]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Șterge programarea recurentă
  async delete(recurringScheduleId) {
    const deleteSQL = `
      DELETE FROM recurring_schedules 
      WHERE recurring_schedule_id = $1
      RETURNING recurring_schedule_id
    `;
    
    const result = await query(deleteSQL, [recurringScheduleId]);
    return result && result.length > 0;
  }

  // Verifică dacă programarea recurentă există
  async exists(recurringScheduleId) {
    const selectSQL = `SELECT 1 FROM recurring_schedules WHERE recurring_schedule_id = $1`;
    const result = await query(selectSQL, [recurringScheduleId]);
    return result && result.length > 0;
  }

  // Obține programările recurente expirate
  async findExpired() {
    const selectSQL = `
      SELECT rs.recurring_schedule_id, rs.customer_id, rs.location_id, rs.service_id,
             rs.recurrence_pattern, rs.start_date, rs.end_date, rs.next_execution,
             rs.is_active, rs.notes, rs.created_at,
             c.customer_code, u.first_name, u.last_name, u.email,
             l.name as location_name, s.name as service_name
      FROM recurring_schedules rs
      JOIN customers c ON rs.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      JOIN locations l ON rs.location_id = l.location_id
      JOIN services s ON rs.service_id = s.service_id
      WHERE rs.end_date IS NOT NULL 
        AND rs.end_date < CURRENT_DATE
        AND rs.is_active = true
      ORDER BY rs.end_date DESC
    `;
    
    return await query(selectSQL);
  }

  // Dezactivează programările recurente expirate
  async deactivateExpired() {
    const updateSQL = `
      UPDATE recurring_schedules 
      SET is_active = false
      WHERE end_date IS NOT NULL 
        AND end_date < CURRENT_DATE
        AND is_active = true
      RETURNING COUNT(*) as deactivated_count
    `;
    
    const result = await query(updateSQL);
    return result && result.length > 0 ? parseInt(result[0].deactivated_count) : 0;
  }

  // Obține statistici programări recurente
  async getStats() {
    const statsSQL = `
      SELECT 
        COUNT(*) as total_schedules,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_schedules,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_schedules,
        COUNT(CASE WHEN end_date IS NOT NULL AND end_date < CURRENT_DATE THEN 1 END) as expired_schedules,
        COUNT(CASE WHEN next_execution <= CURRENT_TIMESTAMP + INTERVAL '24 hours' THEN 1 END) as due_next_24h,
        COUNT(CASE WHEN next_execution <= CURRENT_TIMESTAMP + INTERVAL '7 days' THEN 1 END) as due_next_week,
        COUNT(DISTINCT customer_id) as customers_with_schedules,
        COUNT(DISTINCT location_id) as locations_with_schedules
      FROM recurring_schedules
    `;
    
    const result = await query(statsSQL);
    return result && result.length > 0 ? result[0] : null;
  }

  // Obține statistici pe tipuri de recurență
  async getStatsByPattern() {
    const statsSQL = `
      SELECT 
        recurrence_pattern,
        COUNT(*) as total_schedules,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_schedules,
        AVG(CASE WHEN next_execution > CURRENT_TIMESTAMP 
                 THEN EXTRACT(days FROM (next_execution - CURRENT_TIMESTAMP))
                 ELSE NULL END) as avg_days_until_next
      FROM recurring_schedules
      GROUP BY recurrence_pattern
      ORDER BY total_schedules DESC
    `;
    
    return await query(statsSQL);
  }

  // Obține clienții cu cele mai multe programări recurente
  async getTopCustomersBySchedules(limit = 10) {
    const selectSQL = `
      SELECT 
        c.customer_id, c.customer_code, u.first_name, u.last_name, u.email,
        COUNT(rs.recurring_schedule_id) as total_schedules,
        COUNT(CASE WHEN rs.is_active = true THEN 1 END) as active_schedules,
        MIN(rs.next_execution) as next_execution
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      JOIN recurring_schedules rs ON c.customer_id = rs.customer_id
      WHERE u.is_active = true
      GROUP BY c.customer_id, c.customer_code, u.first_name, u.last_name, u.email
      ORDER BY total_schedules DESC, active_schedules DESC
      LIMIT $1
    `;
    
    return await query(selectSQL, [limit]);
  }

  // Calculează următoarea execuție bazată pe pattern
  calculateNextExecution(currentDate, pattern) {
    const date = new Date(currentDate);
    
    switch (pattern.toLowerCase()) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'bi-weekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        // Pentru pattern-uri personalizate, returnează data curentă + 7 zile
        date.setDate(date.getDate() + 7);
    }
    
    return date;
  }
}

module.exports = new RecurrenceRepository(); 