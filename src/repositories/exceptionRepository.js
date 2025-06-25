const { query } = require('../core/psql');

class ExceptionRepository {
  // Creează o excepție nouă
  async create(exceptionData) {
    const {
      location_id,
      equipment_id,
      type,
      severity,
      title,
      description,
      reported_by_user_id,
      affected_orders,
      is_resolved,
      resolved_by_user_id,
      resolved_at
    } = exceptionData;
    
    const insertSQL = `
      INSERT INTO exception_reports (location_id, equipment_id, type, severity, title, 
                                   description, reported_by_user_id, affected_orders, 
                                   is_resolved, resolved_by_user_id, resolved_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING exception_id, location_id, equipment_id, type, severity, title,
                description, reported_by_user_id, affected_orders, is_resolved,
                resolved_by_user_id, resolved_at, created_at
    `;
    
    const result = await query(insertSQL, [
      location_id, equipment_id, type, severity, title, description,
      reported_by_user_id, affected_orders || [], 
      is_resolved !== undefined ? is_resolved : false,
      resolved_by_user_id, resolved_at
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește toate excepțiile cu filtre
  async findAll(filters = {}) {
    const { 
      location_id, 
      type, 
      severity, 
      is_resolved, 
      date_from, 
      date_to,
      limit = 50, 
      offset = 0 
    } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (location_id) {
      whereClause += ` AND er.location_id = $${paramIndex}`;
      params.push(location_id);
      paramIndex++;
    }
    
    if (type) {
      whereClause += ` AND er.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (severity) {
      whereClause += ` AND er.severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }
    
    if (is_resolved !== undefined) {
      whereClause += ` AND er.is_resolved = $${paramIndex}`;
      params.push(is_resolved);
      paramIndex++;
    }
    
    if (date_from) {
      whereClause += ` AND er.created_at >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereClause += ` AND er.created_at <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT er.exception_id, er.location_id, er.equipment_id, er.type, er.severity,
             er.title, er.description, er.reported_by_user_id, er.affected_orders,
             er.is_resolved, er.resolved_by_user_id, er.resolved_at, er.created_at,
             l.name as location_name, l.address as location_address,
             e.name as equipment_name, e.type as equipment_type,
             ru.first_name as reporter_first_name, ru.last_name as reporter_last_name, ru.email as reporter_email,
             rsu.first_name as resolver_first_name, rsu.last_name as resolver_last_name
      FROM exception_reports er
      JOIN locations l ON er.location_id = l.location_id
      LEFT JOIN equipment e ON er.equipment_id = e.equipment_id
      JOIN users ru ON er.reported_by_user_id = ru.user_id
      LEFT JOIN users rsu ON er.resolved_by_user_id = rsu.user_id
      ${whereClause}
      ORDER BY 
        CASE er.severity 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          WHEN 'LOW' THEN 4 
        END,
        er.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    return await query(selectSQL, params);
  }

  // Găsește excepție prin ID
  async findById(exceptionId) {
    const selectSQL = `
      SELECT er.exception_id, er.location_id, er.equipment_id, er.type, er.severity,
             er.title, er.description, er.reported_by_user_id, er.affected_orders,
             er.is_resolved, er.resolved_by_user_id, er.resolved_at, er.created_at,
             l.name as location_name, l.address as location_address,
             e.name as equipment_name, e.type as equipment_type, e.status as equipment_status,
             ru.first_name as reporter_first_name, ru.last_name as reporter_last_name, 
             ru.email as reporter_email, ru.phone as reporter_phone,
             rsu.first_name as resolver_first_name, rsu.last_name as resolver_last_name,
             rsu.email as resolver_email
      FROM exception_reports er
      JOIN locations l ON er.location_id = l.location_id
      LEFT JOIN equipment e ON er.equipment_id = e.equipment_id
      JOIN users ru ON er.reported_by_user_id = ru.user_id
      LEFT JOIN users rsu ON er.resolved_by_user_id = rsu.user_id
      WHERE er.exception_id = $1
    `;
    
    const result = await query(selectSQL, [exceptionId]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește excepțiile active (nerezolvate)
  async findActive(filters = {}) {
    const { location_id, severity, type, limit = 20 } = filters;
    
    let whereClause = 'WHERE er.is_resolved = false';
    const params = [];
    let paramIndex = 1;
    
    if (location_id) {
      whereClause += ` AND er.location_id = $${paramIndex}`;
      params.push(location_id);
      paramIndex++;
    }
    
    if (severity) {
      whereClause += ` AND er.severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }
    
    if (type) {
      whereClause += ` AND er.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT er.exception_id, er.location_id, er.equipment_id, er.type, er.severity,
             er.title, er.description, er.affected_orders, er.created_at,
             l.name as location_name,
             e.name as equipment_name, e.type as equipment_type,
             ru.first_name as reporter_first_name, ru.last_name as reporter_last_name
      FROM exception_reports er
      JOIN locations l ON er.location_id = l.location_id
      LEFT JOIN equipment e ON er.equipment_id = e.equipment_id
      JOIN users ru ON er.reported_by_user_id = ru.user_id
      ${whereClause}
      ORDER BY 
        CASE er.severity 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          WHEN 'LOW' THEN 4 
        END,
        er.created_at DESC
      LIMIT $${paramIndex}
    `;
    
    params.push(limit);
    return await query(selectSQL, params);
  }

  // Găsește excepțiile critice nerezolvate
  async findCritical() {
    const selectSQL = `
      SELECT er.exception_id, er.location_id, er.equipment_id, er.type, er.title,
             er.description, er.affected_orders, er.created_at,
             l.name as location_name, l.address as location_address,
             e.name as equipment_name, e.type as equipment_type,
             ru.first_name as reporter_first_name, ru.last_name as reporter_last_name, ru.phone as reporter_phone
      FROM exception_reports er
      JOIN locations l ON er.location_id = l.location_id
      LEFT JOIN equipment e ON er.equipment_id = e.equipment_id
      JOIN users ru ON er.reported_by_user_id = ru.user_id
      WHERE er.severity = 'CRITICAL' AND er.is_resolved = false
      ORDER BY er.created_at DESC
    `;
    
    return await query(selectSQL);
  }

  // Găsește excepțiile pentru o locație
  async findByLocationId(locationId, filters = {}) {
    const { is_resolved, severity, limit = 30 } = filters;
    
    let whereClause = 'WHERE er.location_id = $1';
    const params = [locationId];
    let paramIndex = 2;
    
    if (is_resolved !== undefined) {
      whereClause += ` AND er.is_resolved = $${paramIndex}`;
      params.push(is_resolved);
      paramIndex++;
    }
    
    if (severity) {
      whereClause += ` AND er.severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT er.exception_id, er.equipment_id, er.type, er.severity, er.title,
             er.description, er.affected_orders, er.is_resolved, er.created_at, er.resolved_at,
             e.name as equipment_name, e.type as equipment_type,
             ru.first_name as reporter_first_name, ru.last_name as reporter_last_name,
             rsu.first_name as resolver_first_name, rsu.last_name as resolver_last_name
      FROM exception_reports er
      LEFT JOIN equipment e ON er.equipment_id = e.equipment_id
      JOIN users ru ON er.reported_by_user_id = ru.user_id
      LEFT JOIN users rsu ON er.resolved_by_user_id = rsu.user_id
      ${whereClause}
      ORDER BY er.is_resolved ASC, er.severity ASC, er.created_at DESC
      LIMIT $${paramIndex}
    `;
    
    params.push(limit);
    return await query(selectSQL, params);
  }

  // Actualizează excepția
  async update(exceptionId, exceptionData) {
    const {
      type,
      severity,
      title,
      description,
      affected_orders
    } = exceptionData;
    
    const updateSQL = `
      UPDATE exception_reports 
      SET type = COALESCE($2, type),
          severity = COALESCE($3, severity),
          title = COALESCE($4, title),
          description = COALESCE($5, description),
          affected_orders = COALESCE($6, affected_orders)
      WHERE exception_id = $1
      RETURNING exception_id, type, severity, title, description, affected_orders, updated_at
    `;
    
    const result = await query(updateSQL, [
      exceptionId, type || null, severity || null, title || null,
      description || null, affected_orders || null
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Rezolvă excepția
  async resolve(exceptionId, resolvedByUserId, resolutionNotes = null) {
    const updateSQL = `
      UPDATE exception_reports 
      SET is_resolved = true,
          resolved_by_user_id = $2,
          resolved_at = CURRENT_TIMESTAMP,
          description = CASE 
            WHEN $3 IS NOT NULL THEN description || E'\n\nRESOLUTION: ' || $3
            ELSE description 
          END
      WHERE exception_id = $1 AND is_resolved = false
      RETURNING exception_id, is_resolved, resolved_by_user_id, resolved_at
    `;
    
    const result = await query(updateSQL, [exceptionId, resolvedByUserId, resolutionNotes]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Reactivează excepția (marchează ca nerezolvată)
  async reactivate(exceptionId) {
    const updateSQL = `
      UPDATE exception_reports 
      SET is_resolved = false,
          resolved_by_user_id = NULL,
          resolved_at = NULL
      WHERE exception_id = $1
      RETURNING exception_id, is_resolved
    `;
    
    const result = await query(updateSQL, [exceptionId]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Șterge excepția
  async delete(exceptionId) {
    const deleteSQL = `
      DELETE FROM exception_reports 
      WHERE exception_id = $1
      RETURNING exception_id
    `;
    
    const result = await query(deleteSQL, [exceptionId]);
    return result && result.length > 0;
  }

  // Verifică dacă excepția există
  async exists(exceptionId) {
    const selectSQL = `SELECT 1 FROM exception_reports WHERE exception_id = $1`;
    const result = await query(selectSQL, [exceptionId]);
    return result && result.length > 0;
  }

  // Obține tipurile de excepții disponibile
  async getTypes() {
    return ['EQUIPMENT_FAILURE', 'POWER_OUTAGE', 'STAFF_SHORTAGE', 'SUPPLY_SHORTAGE', 'OTHER'];
  }

  // Obține nivelurile de severitate disponibile
  async getSeverityLevels() {
    return ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  }

  // Obține statistici excepții
  async getStats(filters = {}) {
    const { location_id, date_from, date_to } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (location_id) {
      whereClause += ` AND location_id = $${paramIndex}`;
      params.push(location_id);
      paramIndex++;
    }
    
    if (date_from) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    const statsSQL = `
      SELECT 
        COUNT(*) as total_exceptions,
        COUNT(CASE WHEN is_resolved = true THEN 1 END) as resolved_exceptions,
        COUNT(CASE WHEN is_resolved = false THEN 1 END) as active_exceptions,
        COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical_exceptions,
        COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high_exceptions,
        COUNT(CASE WHEN severity = 'MEDIUM' THEN 1 END) as medium_exceptions,
        COUNT(CASE WHEN severity = 'LOW' THEN 1 END) as low_exceptions,
        COUNT(CASE WHEN type = 'EQUIPMENT_FAILURE' THEN 1 END) as equipment_failures,
        COUNT(CASE WHEN type = 'POWER_OUTAGE' THEN 1 END) as power_outages,
        COUNT(CASE WHEN type = 'STAFF_SHORTAGE' THEN 1 END) as staff_shortages,
        AVG(CASE WHEN is_resolved = true 
                 THEN EXTRACT(hours FROM (resolved_at - created_at))
                 ELSE NULL END) as avg_resolution_hours
      FROM exception_reports
      ${whereClause}
    `;
    
    const result = await query(statsSQL, params);
    return result && result.length > 0 ? result[0] : null;
  }

  // Obține statistici pe locații
  async getStatsByLocation() {
    const statsSQL = `
      SELECT 
        l.location_id,
        l.name as location_name,
        COUNT(er.exception_id) as total_exceptions,
        COUNT(CASE WHEN er.is_resolved = false THEN 1 END) as active_exceptions,
        COUNT(CASE WHEN er.severity = 'CRITICAL' THEN 1 END) as critical_exceptions,
        MAX(er.created_at) as latest_exception
      FROM locations l
      LEFT JOIN exception_reports er ON l.location_id = er.location_id
      WHERE l.is_active = true
      GROUP BY l.location_id, l.name
      ORDER BY active_exceptions DESC, critical_exceptions DESC, l.name
    `;
    
    return await query(statsSQL);
  }

  // Obține excepțiile cu cel mai mare impact (cu comenzi afectate)
  async findHighImpact(limit = 10) {
    const selectSQL = `
      SELECT er.exception_id, er.location_id, er.type, er.severity, er.title,
             er.description, er.affected_orders, er.is_resolved, er.created_at,
             l.name as location_name,
             array_length(er.affected_orders, 1) as affected_orders_count,
             ru.first_name as reporter_first_name, ru.last_name as reporter_last_name
      FROM exception_reports er
      JOIN locations l ON er.location_id = l.location_id
      JOIN users ru ON er.reported_by_user_id = ru.user_id
      WHERE er.affected_orders IS NOT NULL AND array_length(er.affected_orders, 1) > 0
      ORDER BY array_length(er.affected_orders, 1) DESC, 
               CASE er.severity 
                 WHEN 'CRITICAL' THEN 1 
                 WHEN 'HIGH' THEN 2 
                 WHEN 'MEDIUM' THEN 3 
                 WHEN 'LOW' THEN 4 
               END,
               er.created_at DESC
      LIMIT $1
    `;
    
    return await query(selectSQL, [limit]);
  }

  // Curăță excepțiile vechi rezolvate (peste X zile)
  async cleanupOldResolved(daysOld = 90) {
    const deleteSQL = `
      DELETE FROM exception_reports 
      WHERE is_resolved = true 
        AND resolved_at < CURRENT_DATE - INTERVAL '${daysOld} days'
      RETURNING COUNT(*) as deleted_count
    `;
    
    const result = await query(deleteSQL);
    return result && result.length > 0 ? parseInt(result[0].deleted_count) : 0;
  }
}

module.exports = new ExceptionRepository(); 