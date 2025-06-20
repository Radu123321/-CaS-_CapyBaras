const { query } = require('../core/psql');

class TransportRepository {
  async create(transportData) {
    const { order_id, status, driver_name, vehicle_plate, estimated_start, estimated_end } = transportData;
    
    const insertSQL = `
      INSERT INTO transports (order_id, status, driver_name, vehicle_plate, estimated_start, estimated_end)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING transport_id, order_id, status, driver_name, vehicle_plate, 
                estimated_start, estimated_end, actual_start, actual_end
    `;
    
    const result = await query(insertSQL, [
      order_id,
      status || 'SCHEDULED',
      driver_name || null,
      vehicle_plate || null,
      estimated_start || null,
      estimated_end || null
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findAll(filters = {}) {
    const { status, driver_name } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      whereClause += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (driver_name) {
      whereClause += ` AND t.driver_name ILIKE $${paramIndex}`;
      params.push(`%${driver_name}%`);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT t.transport_id, t.order_id, t.status, t.driver_name, t.vehicle_plate,
             t.estimated_start, t.estimated_end, t.actual_start, t.actual_end,
             o.customer_id, o.location_id, o.scheduled_for, o.notes,
             c.address as customer_address, c.phone as customer_phone,
             u.email as customer_email, u.full_name as customer_name,
             l.name as location_name, l.address as location_address
      FROM transports t
      JOIN orders o ON t.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      JOIN locations l ON o.location_id = l.location_id
      ${whereClause}
      ORDER BY t.estimated_start ASC, t.transport_id ASC
    `;
    
    return await query(selectSQL, params);
  }

  async findById(transportId) {
    const selectSQL = `
      SELECT t.transport_id, t.order_id, t.status, t.driver_name, t.vehicle_plate,
             t.estimated_start, t.estimated_end, t.actual_start, t.actual_end,
             o.customer_id, o.location_id, o.scheduled_for, o.notes, o.status as order_status,
             c.address as customer_address, c.phone as customer_phone,
             u.email as customer_email, u.full_name as customer_name,
             l.name as location_name, l.address as location_address
      FROM transports t
      JOIN orders o ON t.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      JOIN locations l ON o.location_id = l.location_id
      WHERE t.transport_id = $1
    `;
    
    const result = await query(selectSQL, [transportId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findByOrderId(orderId) {
    const selectSQL = `
      SELECT transport_id, order_id, status, driver_name, vehicle_plate,
             estimated_start, estimated_end, actual_start, actual_end
      FROM transports
      WHERE order_id = $1
    `;
    
    const result = await query(selectSQL, [orderId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async updateStatus(transportId, newStatus, actualTime = null) {
    let updateSQL;
    let params;
    
    if (newStatus === 'IN_TRANSIT' && actualTime) {
      updateSQL = `
        UPDATE transports 
        SET status = $2, actual_start = $3
        WHERE transport_id = $1
        RETURNING transport_id, order_id, status, actual_start, actual_end
      `;
      params = [transportId, newStatus, actualTime];
    } else if (newStatus === 'DELIVERED' && actualTime) {
      updateSQL = `
        UPDATE transports 
        SET status = $2, actual_end = $3
        WHERE transport_id = $1
        RETURNING transport_id, order_id, status, actual_start, actual_end
      `;
      params = [transportId, newStatus, actualTime];
    } else {
      updateSQL = `
        UPDATE transports 
        SET status = $2
        WHERE transport_id = $1
        RETURNING transport_id, order_id, status, actual_start, actual_end
      `;
      params = [transportId, newStatus];
    }
    
    const result = await query(updateSQL, params);
    return result && result.length > 0 ? result[0] : null;
  }

  async update(transportId, transportData) {
    const { driver_name, vehicle_plate, estimated_start, estimated_end } = transportData;
    
    const updateSQL = `
      UPDATE transports 
      SET driver_name = COALESCE($2, driver_name),
          vehicle_plate = COALESCE($3, vehicle_plate),
          estimated_start = COALESCE($4, estimated_start),
          estimated_end = COALESCE($5, estimated_end)
      WHERE transport_id = $1
      RETURNING transport_id, order_id, status, driver_name, vehicle_plate,
                estimated_start, estimated_end, actual_start, actual_end
    `;
    
    const result = await query(updateSQL, [
      transportId,
      driver_name || null,
      vehicle_plate || null,
      estimated_start || null,
      estimated_end || null
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  async updateStatusByOrderId(orderId, status) {
    const updateSQL = `
      UPDATE transports 
      SET status = $2
      WHERE order_id = $1
      RETURNING transport_id, order_id, status
    `;
    
    const result = await query(updateSQL, [orderId, status]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findActive() {
    const selectSQL = `
      SELECT t.transport_id, t.order_id, t.status, t.driver_name, t.vehicle_plate,
             t.estimated_start, t.estimated_end, t.actual_start,
             l.name as location_name, l.address as location_address,
             u.full_name as customer_name
      FROM transports t
      JOIN orders o ON t.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      JOIN locations l ON o.location_id = l.location_id
      WHERE t.status IN ('SCHEDULED', 'IN_TRANSIT')
      ORDER BY t.estimated_start ASC
    `;
    
    return await query(selectSQL);
  }

  async exists(transportId) {
    const selectSQL = `
      SELECT 1 FROM transports WHERE transport_id = $1
    `;
    
    const result = await query(selectSQL, [transportId]);
    return result && result.length > 0;
  }

  async existsByOrderId(orderId) {
    const selectSQL = `
      SELECT 1 FROM transports WHERE order_id = $1
    `;
    
    const result = await query(selectSQL, [orderId]);
    return result && result.length > 0;
  }

  async getValidStatuses() {
    return ['NOT_REQUIRED', 'SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
  }

  async getCountByStatus(status) {
    const selectSQL = `
      SELECT COUNT(*) as count FROM transports WHERE status = $1
    `;
    
    const result = await query(selectSQL, [status]);
    return result && result.length > 0 ? parseInt(result[0].count) : 0;
  }

  async getByDriver(driverName) {
    const selectSQL = `
      SELECT transport_id, order_id, status, driver_name, vehicle_plate,
             estimated_start, estimated_end, actual_start, actual_end
      FROM transports
      WHERE driver_name ILIKE $1
      ORDER BY estimated_start DESC
    `;
    
    return await query(selectSQL, [`%${driverName}%`]);
  }

  async getScheduledForDate(date) {
    const selectSQL = `
      SELECT transport_id, order_id, status, driver_name, vehicle_plate,
             estimated_start, estimated_end
      FROM transports
      WHERE DATE(estimated_start) = DATE($1) AND status = 'SCHEDULED'
      ORDER BY estimated_start ASC
    `;
    
    return await query(selectSQL, [date]);
  }
}

module.exports = new TransportRepository(); 