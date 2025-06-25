const { query } = require('../core/psql');

class MaintenanceRepository {
  // Creează o programare de mentenanță nouă
  async create(maintenanceData) {
    const {
      equipment_id,
      type,
      description,
      scheduled_date,
      estimated_duration,
      assigned_technician,
      priority,
      cost_estimate,
      status,
      notes
    } = maintenanceData;
    
    const insertSQL = `
      INSERT INTO maintenance_schedules (equipment_id, type, description, scheduled_date,
                                       estimated_duration, assigned_technician, priority,
                                       cost_estimate, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING maintenance_id, equipment_id, type, description, scheduled_date,
                estimated_duration, assigned_technician, priority, cost_estimate,
                status, notes, created_at
    `;
    
    const result = await query(insertSQL, [
      equipment_id, type, description, scheduled_date, estimated_duration,
      assigned_technician, priority || 'MEDIUM', cost_estimate,
      status || 'SCHEDULED', notes
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește toate programările de mentenanță cu filtre
  async findAll(filters = {}) {
    const { 
      equipment_id, 
      type, 
      status, 
      priority,
      date_from, 
      date_to,
      location_id,
      limit = 50, 
      offset = 0 
    } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (equipment_id) {
      whereClause += ` AND ms.equipment_id = $${paramIndex}`;
      params.push(equipment_id);
      paramIndex++;
    }
    
    if (type) {
      whereClause += ` AND ms.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (status) {
      whereClause += ` AND ms.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (priority) {
      whereClause += ` AND ms.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }
    
    if (date_from) {
      whereClause += ` AND ms.scheduled_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereClause += ` AND ms.scheduled_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    if (location_id) {
      whereClause += ` AND e.location_id = $${paramIndex}`;
      params.push(location_id);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT ms.maintenance_id, ms.equipment_id, ms.type, ms.description, ms.scheduled_date,
             ms.estimated_duration, ms.assigned_technician, ms.priority, ms.cost_estimate,
             ms.actual_cost, ms.status, ms.started_at, ms.completed_at, ms.notes, ms.created_at,
             e.name as equipment_name, e.type as equipment_type, e.status as equipment_status,
             l.name as location_name, l.address as location_address
      FROM maintenance_schedules ms
      JOIN equipment e ON ms.equipment_id = e.equipment_id
      JOIN locations l ON e.location_id = l.location_id
      ${whereClause}
      ORDER BY 
        CASE ms.priority 
          WHEN 'URGENT' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          WHEN 'LOW' THEN 4 
        END,
        ms.scheduled_date ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    return await query(selectSQL, params);
  }

  // Găsește programare de mentenanță prin ID
  async findById(maintenanceId) {
    const selectSQL = `
      SELECT ms.maintenance_id, ms.equipment_id, ms.type, ms.description, ms.scheduled_date,
             ms.estimated_duration, ms.assigned_technician, ms.priority, ms.cost_estimate,
             ms.actual_cost, ms.status, ms.started_at, ms.completed_at, ms.notes, ms.created_at,
             e.name as equipment_name, e.type as equipment_type, e.status as equipment_status,
             e.serial_number, e.purchase_date, e.warranty_expiry,
             l.name as location_name, l.address as location_address, l.phone as location_phone
      FROM maintenance_schedules ms
      JOIN equipment e ON ms.equipment_id = e.equipment_id
      JOIN locations l ON e.location_id = l.location_id
      WHERE ms.maintenance_id = $1
    `;
    
    const result = await query(selectSQL, [maintenanceId]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește programările de mentenanță pentru un echipament
  async findByEquipmentId(equipmentId, filters = {}) {
    const { status, type, limit = 20 } = filters;
    
    let whereClause = 'WHERE ms.equipment_id = $1';
    const params = [equipmentId];
    let paramIndex = 2;
    
    if (status) {
      whereClause += ` AND ms.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (type) {
      whereClause += ` AND ms.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT ms.maintenance_id, ms.type, ms.description, ms.scheduled_date,
             ms.estimated_duration, ms.assigned_technician, ms.priority, ms.cost_estimate,
             ms.actual_cost, ms.status, ms.started_at, ms.completed_at, ms.notes, ms.created_at
      FROM maintenance_schedules ms
      ${whereClause}
      ORDER BY ms.scheduled_date DESC
      LIMIT $${paramIndex}
    `;
    
    params.push(limit);
    return await query(selectSQL, params);
  }

  // Găsește programările de mentenanță programate pentru azi
  async findScheduledToday(locationId = null) {
    let whereClause = "WHERE ms.status = 'SCHEDULED' AND DATE(ms.scheduled_date) = CURRENT_DATE";
    const params = [];
    
    if (locationId) {
      whereClause += ' AND e.location_id = $1';
      params.push(locationId);
    }
    
    const selectSQL = `
      SELECT ms.maintenance_id, ms.equipment_id, ms.type, ms.description, ms.scheduled_date,
             ms.estimated_duration, ms.assigned_technician, ms.priority, ms.cost_estimate,
             e.name as equipment_name, e.type as equipment_type,
             l.name as location_name
      FROM maintenance_schedules ms
      JOIN equipment e ON ms.equipment_id = e.equipment_id
      JOIN locations l ON e.location_id = l.location_id
      ${whereClause}
      ORDER BY ms.scheduled_date ASC
    `;
    
    return await query(selectSQL, params);
  }

  // Găsește programările de mentenanță în întârziere
  async findOverdue(locationId = null) {
    let whereClause = "WHERE ms.status = 'SCHEDULED' AND ms.scheduled_date < CURRENT_TIMESTAMP";
    const params = [];
    
    if (locationId) {
      whereClause += ' AND e.location_id = $1';
      params.push(locationId);
    }
    
    const selectSQL = `
      SELECT ms.maintenance_id, ms.equipment_id, ms.type, ms.description, ms.scheduled_date,
             ms.estimated_duration, ms.assigned_technician, ms.priority, ms.cost_estimate,
             e.name as equipment_name, e.type as equipment_type,
             l.name as location_name,
             EXTRACT(days FROM (CURRENT_TIMESTAMP - ms.scheduled_date)) as days_overdue
      FROM maintenance_schedules ms
      JOIN equipment e ON ms.equipment_id = e.equipment_id
      JOIN locations l ON e.location_id = l.location_id
      ${whereClause}
      ORDER BY ms.scheduled_date ASC
    `;
    
    return await query(selectSQL, params);
  }

  // Găsește programările de mentenanță urgente
  async findUrgent(locationId = null) {
    let whereClause = "WHERE ms.priority = 'URGENT' AND ms.status IN ('SCHEDULED', 'IN_PROGRESS')";
    const params = [];
    
    if (locationId) {
      whereClause += ' AND e.location_id = $1';
      params.push(locationId);
    }
    
    const selectSQL = `
      SELECT ms.maintenance_id, ms.equipment_id, ms.type, ms.description, ms.scheduled_date,
             ms.estimated_duration, ms.assigned_technician, ms.cost_estimate, ms.status,
             e.name as equipment_name, e.type as equipment_type, e.status as equipment_status,
             l.name as location_name
      FROM maintenance_schedules ms
      JOIN equipment e ON ms.equipment_id = e.equipment_id
      JOIN locations l ON e.location_id = l.location_id
      ${whereClause}
      ORDER BY ms.scheduled_date ASC
    `;
    
    return await query(selectSQL, params);
  }

  // Actualizează programarea de mentenanță
  async update(maintenanceId, maintenanceData) {
    const {
      type,
      description,
      scheduled_date,
      estimated_duration,
      assigned_technician,
      priority,
      cost_estimate,
      actual_cost,
      status,
      notes
    } = maintenanceData;
    
    const updateSQL = `
      UPDATE maintenance_schedules 
      SET type = COALESCE($2, type),
          description = COALESCE($3, description),
          scheduled_date = COALESCE($4, scheduled_date),
          estimated_duration = COALESCE($5, estimated_duration),
          assigned_technician = COALESCE($6, assigned_technician),
          priority = COALESCE($7, priority),
          cost_estimate = COALESCE($8, cost_estimate),
          actual_cost = COALESCE($9, actual_cost),
          status = COALESCE($10, status),
          notes = COALESCE($11, notes)
      WHERE maintenance_id = $1
      RETURNING maintenance_id, equipment_id, type, description, scheduled_date,
                estimated_duration, assigned_technician, priority, cost_estimate,
                actual_cost, status, notes, updated_at
    `;
    
    const result = await query(updateSQL, [
      maintenanceId, type || null, description || null, scheduled_date || null,
      estimated_duration || null, assigned_technician || null, priority || null,
      cost_estimate || null, actual_cost || null, status || null, notes || null
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Actualizează statusul programării de mentenanță
  async updateStatus(maintenanceId, newStatus, additionalData = {}) {
    const { started_at, completed_at, actual_cost } = additionalData;
    
    let setClause = 'status = $2';
    const params = [maintenanceId, newStatus];
    let paramIndex = 3;
    
    if (started_at && newStatus === 'IN_PROGRESS') {
      setClause += `, started_at = $${paramIndex}`;
      params.push(started_at);
      paramIndex++;
    }
    
    if (completed_at && newStatus === 'COMPLETED') {
      setClause += `, completed_at = $${paramIndex}`;
      params.push(completed_at);
      paramIndex++;
    }
    
    if (actual_cost !== undefined) {
      setClause += `, actual_cost = $${paramIndex}`;
      params.push(actual_cost);
      paramIndex++;
    }
    
    const updateSQL = `
      UPDATE maintenance_schedules 
      SET ${setClause}
      WHERE maintenance_id = $1
      RETURNING maintenance_id, status, started_at, completed_at, actual_cost
    `;
    
    const result = await query(updateSQL, params);
    return result && result.length > 0 ? result[0] : null;
  }

  // Începe mentenanța
  async startMaintenance(maintenanceId) {
    const updateSQL = `
      UPDATE maintenance_schedules 
      SET status = 'IN_PROGRESS',
          started_at = CURRENT_TIMESTAMP
      WHERE maintenance_id = $1 AND status = 'SCHEDULED'
      RETURNING maintenance_id, status, started_at
    `;
    
    const result = await query(updateSQL, [maintenanceId]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Finalizează mentenanța
  async completeMaintenance(maintenanceId, actualCost = null, completionNotes = null) {
    const updateSQL = `
      UPDATE maintenance_schedules 
      SET status = 'COMPLETED',
          completed_at = CURRENT_TIMESTAMP,
          actual_cost = COALESCE($2, actual_cost),
          notes = CASE 
            WHEN $3 IS NOT NULL THEN COALESCE(notes, '') || E'\n\nCOMPLETION NOTES: ' || $3
            ELSE notes 
          END
      WHERE maintenance_id = $1 AND status = 'IN_PROGRESS'
      RETURNING maintenance_id, status, completed_at, actual_cost
    `;
    
    const result = await query(updateSQL, [maintenanceId, actualCost, completionNotes]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Șterge programarea de mentenanță
  async delete(maintenanceId) {
    const deleteSQL = `
      DELETE FROM maintenance_schedules 
      WHERE maintenance_id = $1 AND status = 'SCHEDULED'
      RETURNING maintenance_id
    `;
    
    const result = await query(deleteSQL, [maintenanceId]);
    return result && result.length > 0;
  }

  // Verifică dacă programarea de mentenanță există
  async exists(maintenanceId) {
    const selectSQL = `SELECT 1 FROM maintenance_schedules WHERE maintenance_id = $1`;
    const result = await query(selectSQL, [maintenanceId]);
    return result && result.length > 0;
  }

  // Obține tipurile de mentenanță disponibile
  async getTypes() {
    return ['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'INSPECTION', 'CALIBRATION'];
  }

  // Obține nivelurile de prioritate disponibile
  async getPriorityLevels() {
    return ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  }

  // Obține statusurile valide
  async getValidStatuses() {
    return ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED'];
  }

  // Obține statistici mentenanță
  async getStats(filters = {}) {
    const { location_id, date_from, date_to } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (location_id) {
      whereClause += ` AND e.location_id = $${paramIndex}`;
      params.push(location_id);
      paramIndex++;
    }
    
    if (date_from) {
      whereClause += ` AND ms.scheduled_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereClause += ` AND ms.scheduled_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    const statsSQL = `
      SELECT 
        COUNT(*) as total_maintenances,
        COUNT(CASE WHEN ms.status = 'SCHEDULED' THEN 1 END) as scheduled_maintenances,
        COUNT(CASE WHEN ms.status = 'IN_PROGRESS' THEN 1 END) as in_progress_maintenances,
        COUNT(CASE WHEN ms.status = 'COMPLETED' THEN 1 END) as completed_maintenances,
        COUNT(CASE WHEN ms.status = 'CANCELLED' THEN 1 END) as cancelled_maintenances,
        COUNT(CASE WHEN ms.priority = 'URGENT' THEN 1 END) as urgent_maintenances,
        COUNT(CASE WHEN ms.type = 'PREVENTIVE' THEN 1 END) as preventive_maintenances,
        COUNT(CASE WHEN ms.type = 'CORRECTIVE' THEN 1 END) as corrective_maintenances,
        COUNT(CASE WHEN ms.type = 'EMERGENCY' THEN 1 END) as emergency_maintenances,
        SUM(ms.cost_estimate) as total_estimated_cost,
        SUM(ms.actual_cost) as total_actual_cost,
        AVG(ms.estimated_duration) as avg_estimated_duration,
        COUNT(CASE WHEN ms.status = 'SCHEDULED' AND ms.scheduled_date < CURRENT_TIMESTAMP THEN 1 END) as overdue_maintenances
      FROM maintenance_schedules ms
      JOIN equipment e ON ms.equipment_id = e.equipment_id
      ${whereClause}
    `;
    
    const result = await query(statsSQL, params);
    return result && result.length > 0 ? result[0] : null;
  }

  // Obține statistici pe echipamente
  async getStatsByEquipment(locationId = null) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (locationId) {
      whereClause += ' AND e.location_id = $1';
      params.push(locationId);
    }
    
    const statsSQL = `
      SELECT 
        e.equipment_id,
        e.name as equipment_name,
        e.type as equipment_type,
        e.status as equipment_status,
        l.name as location_name,
        COUNT(ms.maintenance_id) as total_maintenances,
        COUNT(CASE WHEN ms.status = 'COMPLETED' THEN 1 END) as completed_maintenances,
        COUNT(CASE WHEN ms.status = 'SCHEDULED' THEN 1 END) as scheduled_maintenances,
        COUNT(CASE WHEN ms.type = 'EMERGENCY' THEN 1 END) as emergency_maintenances,
        SUM(ms.actual_cost) as total_maintenance_cost,
        MAX(ms.completed_at) as last_maintenance_date,
        MIN(CASE WHEN ms.status = 'SCHEDULED' THEN ms.scheduled_date END) as next_maintenance_date
      FROM equipment e
      JOIN locations l ON e.location_id = l.location_id
      LEFT JOIN maintenance_schedules ms ON e.equipment_id = ms.equipment_id
      ${whereClause}
      GROUP BY e.equipment_id, e.name, e.type, e.status, l.name
      ORDER BY emergency_maintenances DESC, total_maintenance_cost DESC
    `;
    
    return await query(statsSQL, params);
  }

  // Obține programul de mentenanță pentru următoarele X zile
  async getUpcomingSchedule(days = 7, locationId = null) {
    let whereClause = `
      WHERE ms.status = 'SCHEDULED' 
        AND ms.scheduled_date >= CURRENT_DATE 
        AND ms.scheduled_date <= CURRENT_DATE + INTERVAL '${days} days'
    `;
    const params = [];
    
    if (locationId) {
      whereClause += ' AND e.location_id = $1';
      params.push(locationId);
    }
    
    const selectSQL = `
      SELECT ms.maintenance_id, ms.equipment_id, ms.type, ms.description, ms.scheduled_date,
             ms.estimated_duration, ms.assigned_technician, ms.priority, ms.cost_estimate,
             e.name as equipment_name, e.type as equipment_type,
             l.name as location_name, l.address as location_address,
             DATE(ms.scheduled_date) as maintenance_date,
             TIME(ms.scheduled_date) as maintenance_time
      FROM maintenance_schedules ms
      JOIN equipment e ON ms.equipment_id = e.equipment_id
      JOIN locations l ON e.location_id = l.location_id
      ${whereClause}
      ORDER BY ms.scheduled_date ASC
    `;
    
    return await query(selectSQL, params);
  }

  // Curăță programările de mentenanță vechi completate (peste X zile)
  async cleanupOldCompleted(daysOld = 365) {
    const deleteSQL = `
      DELETE FROM maintenance_schedules 
      WHERE status = 'COMPLETED' 
        AND completed_at < CURRENT_DATE - INTERVAL '${daysOld} days'
      RETURNING COUNT(*) as deleted_count
    `;
    
    const result = await query(deleteSQL);
    return result && result.length > 0 ? parseInt(result[0].deleted_count) : 0;
  }
}

module.exports = new MaintenanceRepository(); 