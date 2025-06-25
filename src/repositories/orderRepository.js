const { query } = require('../core/psql');
const log = require('../core/logger');

class OrderRepository {
  async create(orderData) {
    const { 
      customer_id, 
      location_id, 
      service_id, 
      assigned_employee_id,
      order_code,
      status = 'PENDING',
      priority = 'NORMAL',
      item_description,
      item_type,
      item_condition,
      special_instructions,
      unit_price,  // Changed from base_price to unit_price
      transport_fee = 0.00,
      additional_fees = 0.00,
      discount = 0.00,
      total_amount,
      scheduled_date,
      scheduled_time,
      estimated_duration,
      pickup_address,
      delivery_address
    } = orderData;
    
    const insertSQL = `
      INSERT INTO orders (
        customer_id, location_id, service_id, assigned_employee_id, order_code,
        status, priority, item_description, item_type, item_condition, special_instructions,
        base_price, transport_fee, additional_fees, discount, total_amount,
        scheduled_date, scheduled_time, estimated_duration, pickup_address, delivery_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING order_id, customer_id, location_id, service_id, order_code, status, 
                base_price, transport_fee, total_amount, scheduled_date, scheduled_time, 
                assigned_employee_id, special_instructions, created_at
    `;
    
    const result = await query(insertSQL, [
      customer_id, location_id, service_id, assigned_employee_id, order_code,
      status, priority, item_description, item_type, item_condition, special_instructions,
      unit_price, // Maps unit_price to base_price column in database
      transport_fee, additional_fees, discount, total_amount,
      scheduled_date, scheduled_time, estimated_duration, pickup_address, delivery_address
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  async createOrderItem(orderItemData) {
    const { order_id, service_id, quantity, price } = orderItemData;
    
    const insertSQL = `
      INSERT INTO order_items (order_id, service_id, quantity, price)
      VALUES ($1, $2, $3, $4)
      RETURNING order_id, service_id, quantity, price
    `;
    
    const result = await query(insertSQL, [order_id, service_id, quantity, price]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findAll(filters = {}) {
    const { 
      status, 
      customer_id, 
      location_id, 
      employee_id, 
      date_from, 
      date_to,
      limit = 50, 
      offset = 0 
    } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      whereClause += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (customer_id) {
      whereClause += ` AND o.customer_id = $${paramIndex}`;
      params.push(customer_id);
      paramIndex++;
    }
    
    if (location_id) {
      whereClause += ` AND o.location_id = $${paramIndex}`;
      params.push(location_id);
      paramIndex++;
    }
    
    if (employee_id) {
      whereClause += ` AND o.assigned_employee_id = $${paramIndex}`;
      params.push(employee_id);
      paramIndex++;
    }
    
    if (date_from) {
      whereClause += ` AND o.scheduled_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereClause += ` AND o.scheduled_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT o.order_id, o.customer_id, o.location_id, o.service_id, o.order_code,
             o.base_price, o.transport_fee, o.total_amount, o.status, o.scheduled_date, o.scheduled_time,
             o.actual_start_time, o.actual_end_time, o.assigned_employee_id, o.pickup_address, o.delivery_address,
             o.special_instructions, o.created_at,
             c.customer_code, cu.first_name as customer_first_name, cu.last_name as customer_last_name, 
             cu.email as customer_email, cu.phone as customer_phone,
             l.name as location_name, l.address as location_address,
             s.name as service_name, s.description as service_description, s.category,
             e.employee_code, eu.first_name as employee_first_name, eu.last_name as employee_last_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users cu ON c.user_id = cu.user_id
      JOIN locations l ON o.location_id = l.location_id
      JOIN services s ON o.service_id = s.service_id
      LEFT JOIN employees e ON o.assigned_employee_id = e.employee_id
      LEFT JOIN users eu ON e.user_id = eu.user_id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    return await query(selectSQL, params);
  }

  async findById(orderId) {
    const selectSQL = `
      SELECT o.order_id, o.customer_id, o.location_id, o.service_id, o.order_code,
             o.base_price, o.transport_fee, o.total_amount, o.status, o.scheduled_date, o.scheduled_time,
             o.actual_start_time, o.actual_end_time, o.assigned_employee_id, o.pickup_address, o.delivery_address,
             o.special_instructions, o.item_description, o.item_type, o.item_condition, o.priority, o.created_at,
             c.customer_code, cu.first_name as customer_first_name, cu.last_name as customer_last_name, 
             cu.email as customer_email, cu.phone as customer_phone, c.billing_address,
             l.name as location_name, l.address as location_address,
             s.name as service_name, s.description as service_description, s.category,
             e.employee_code, eu.first_name as employee_first_name, eu.last_name as employee_last_name, eu.phone as employee_phone
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users cu ON c.user_id = cu.user_id
      JOIN locations l ON o.location_id = l.location_id
      JOIN services s ON o.service_id = s.service_id
      LEFT JOIN employees e ON o.assigned_employee_id = e.employee_id
      LEFT JOIN users eu ON e.user_id = eu.user_id
      WHERE o.order_id = $1
    `;
    
    const result = await query(selectSQL, [orderId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findOrderItems(orderId) {
    const selectSQL = `
      SELECT oi.service_id, oi.quantity, oi.price,
             s.service_type, s.description as service_description
      FROM order_items oi
      JOIN services s ON oi.service_id = s.service_id
      WHERE oi.order_id = $1
      ORDER BY oi.service_id
    `;
    
    return await query(selectSQL, [orderId]);
  }

  async findOrderItemsByOrderIds(orderIds) {
    if (!orderIds || orderIds.length === 0) {
      return [];
    }
    
    const selectSQL = `
      SELECT oi.order_id, oi.service_id, oi.quantity, oi.price,
             s.service_type, s.description as service_description
      FROM order_items oi
      JOIN services s ON oi.service_id = s.service_id
      WHERE oi.order_id = ANY($1)
      ORDER BY oi.service_id
    `;
    
    return await query(selectSQL, [orderIds]);
  }

  async updateStatus(orderId, newStatus, additionalData = {}) {
    const { actual_start_time, actual_end_time, completed_at } = additionalData;
    
    let setClause = 'status = $2';
    const params = [orderId, newStatus];
    let paramIndex = 3;
    
    if (actual_start_time && newStatus === 'IN_PROGRESS') {
      setClause += `, actual_start_time = $${paramIndex}`;
      params.push(actual_start_time);
      paramIndex++;
    }
    
    if (actual_end_time && newStatus === 'COMPLETED') {
      setClause += `, actual_end_time = $${paramIndex}`;
      params.push(actual_end_time);
      paramIndex++;
    }
    
    if (completed_at && newStatus === 'COMPLETED') {
      setClause += `, completed_at = $${paramIndex}`;
      params.push(completed_at);
      paramIndex++;
    }
    
    const updateSQL = `
      UPDATE orders 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
      RETURNING order_id, status, actual_start_time, actual_end_time, completed_at, scheduled_date
    `;
    
    const result = await query(updateSQL, params);
    return result && result.length > 0 ? result[0] : null;
  }

  async update(orderId, orderData) {
    const { 
      service_id, 
      base_price, 
      transport_fee, 
      total_amount, 
      scheduled_date, 
      scheduled_time,
      assigned_employee_id,
      special_instructions,
      pickup_address,
      delivery_address,
      item_description,
      item_type,
      item_condition
    } = orderData;
    
    const updateSQL = `
      UPDATE orders 
      SET service_id = COALESCE($2, service_id),
          base_price = COALESCE($3, base_price),
          transport_fee = COALESCE($4, transport_fee),
          total_amount = COALESCE($5, total_amount),
          scheduled_date = COALESCE($6, scheduled_date),
          scheduled_time = COALESCE($7, scheduled_time),
          assigned_employee_id = COALESCE($8, assigned_employee_id),
          special_instructions = COALESCE($9, special_instructions),
          pickup_address = COALESCE($10, pickup_address),
          delivery_address = COALESCE($11, delivery_address),
          item_description = COALESCE($12, item_description),
          item_type = COALESCE($13, item_type),
          item_condition = COALESCE($14, item_condition),
          updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
      RETURNING order_id, customer_id, location_id, service_id, base_price, transport_fee,
                total_amount, status, scheduled_date, scheduled_time, assigned_employee_id, 
                special_instructions, pickup_address, delivery_address, updated_at
    `;
    
    const result = await query(updateSQL, [
      orderId, service_id || null, base_price || null, transport_fee || null,
      total_amount || null, scheduled_date || null, scheduled_time || null, 
      assigned_employee_id || null, special_instructions || null,
      pickup_address || null, delivery_address || null, item_description || null,
      item_type || null, item_condition || null
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findWithRecurrence() {
    const selectSQL = `
      SELECT order_id, customer_id, location_id, scheduled_date, special_instructions, 
             pickup_address, delivery_address, created_at
      FROM orders
      WHERE special_instructions LIKE '%recurrent%' 
        AND status IN ('PENDING', 'CONFIRMED', 'COMPLETED')
      ORDER BY scheduled_date
    `;
    
    return await query(selectSQL);
  }

  async exists(orderId) {
    const selectSQL = `SELECT 1 FROM orders WHERE order_id = $1`;
    const result = await query(selectSQL, [orderId]);
    return result && result.length > 0;
  }

  async getValidStatuses() {
    return ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
  }

  async getCountByStatus(status = null, locationId = null) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (locationId) {
      whereClause += ` AND location_id = $${paramIndex}`;
      params.push(locationId);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT 
        status,
        COUNT(*) as count
      FROM orders 
      ${whereClause}
      ${status ? '' : 'GROUP BY status'}
      ORDER BY 
        CASE status 
          WHEN 'PENDING' THEN 1 
          WHEN 'CONFIRMED' THEN 2 
          WHEN 'IN_PROGRESS' THEN 3 
          WHEN 'COMPLETED' THEN 4 
          WHEN 'CANCELLED' THEN 5 
          WHEN 'REFUNDED' THEN 6
        END
    `;
    
    const result = await query(selectSQL, params);
    
    if (status) {
      return result && result.length > 0 ? parseInt(result[0].count) : 0;
    }
    
    return result || [];
  }

  async getOrdersByCustomer(customerId) {
    const selectSQL = `
      SELECT order_id, customer_id, location_id, status, scheduled_date, scheduled_time,
             pickup_address, delivery_address, special_instructions, total_amount, created_at
      FROM orders
      WHERE customer_id = $1
      ORDER BY created_at DESC
    `;
    
    return await query(selectSQL, [customerId]);
  }

  async getOrdersByLocation(locationId) {
    const selectSQL = `
      SELECT order_id, customer_id, location_id, status, scheduled_date, scheduled_time,
             pickup_address, delivery_address, special_instructions, total_amount, created_at
      FROM orders
      WHERE location_id = $1
      ORDER BY created_at DESC
    `;
    
    return await query(selectSQL, [locationId]);
  }

  async findByCustomerId(customerId, limit = 20) {
    const selectSQL = `
      SELECT o.order_id, o.service_id, o.base_price, o.transport_fee, o.total_amount, 
             o.status, o.scheduled_date, o.scheduled_time, o.actual_start_time, o.actual_end_time, 
             o.special_instructions, o.created_at,
             l.name as location_name, s.name as service_name, s.description as service_description,
             e.employee_code, eu.first_name as employee_first_name, eu.last_name as employee_last_name
      FROM orders o
      JOIN locations l ON o.location_id = l.location_id
      JOIN services s ON o.service_id = s.service_id
      LEFT JOIN employees e ON o.assigned_employee_id = e.employee_id
      LEFT JOIN users eu ON e.user_id = eu.user_id
      WHERE o.customer_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2
    `;
    
    return await query(selectSQL, [customerId, limit]);
  }

  async findByEmployeeId(employeeId, filters = {}) {
    const { status, date_from, date_to, limit = 50 } = filters;
    
    let whereClause = 'WHERE o.assigned_employee_id = $1';
    const params = [employeeId];
    let paramIndex = 2;
    
    if (status) {
      whereClause += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (date_from) {
      whereClause += ` AND o.scheduled_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereClause += ` AND o.scheduled_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT o.order_id, o.customer_id, o.service_id, o.base_price, o.transport_fee, 
             o.total_amount, o.status, o.scheduled_date, o.scheduled_time, o.actual_start_time, o.actual_end_time, 
             o.pickup_address, o.delivery_address, o.special_instructions, o.created_at,
             c.customer_code, cu.first_name as customer_first_name, cu.last_name as customer_last_name, 
             cu.phone as customer_phone,
             l.name as location_name, s.name as service_name, s.description as service_description
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users cu ON c.user_id = cu.user_id
      JOIN locations l ON o.location_id = l.location_id
      JOIN services s ON o.service_id = s.service_id
      ${whereClause}
      ORDER BY o.scheduled_date ASC, o.created_at DESC
      LIMIT $${paramIndex}
    `;
    
    params.push(limit);
    return await query(selectSQL, params);
  }

  async findByLocationId(locationId, filters = {}) {
    const { status, date_from, date_to, limit = 50 } = filters;
    
    let whereClause = 'WHERE o.location_id = $1';
    const params = [locationId];
    let paramIndex = 2;
    
    if (status) {
      whereClause += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (date_from) {
      whereClause += ` AND o.scheduled_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereClause += ` AND o.scheduled_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT o.order_id, o.customer_id, o.service_id, o.base_price, o.transport_fee, 
             o.total_amount, o.status, o.scheduled_date, o.scheduled_time, o.actual_start_time, o.actual_end_time, 
             o.pickup_address, o.delivery_address, o.special_instructions, o.created_at,
             c.customer_code, cu.first_name as customer_first_name, cu.last_name as customer_last_name, 
             cu.phone as customer_phone,
             s.name as service_name, s.description as service_description
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users cu ON c.user_id = cu.user_id
      JOIN services s ON o.service_id = s.service_id
      ${whereClause}
      ORDER BY o.scheduled_date ASC, o.created_at DESC
      LIMIT $${paramIndex}
    `;
    
    params.push(limit);
    return await query(selectSQL, params);
  }

  async assignEmployee(orderId, employeeId) {
    const updateSQL = `
      UPDATE orders 
      SET assigned_employee_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
      RETURNING order_id, assigned_employee_id, updated_at
    `;
    
    const result = await query(updateSQL, [orderId, employeeId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async delete(orderId) {
    const deleteSQL = `
      UPDATE orders 
      SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
      RETURNING order_id, status, updated_at
    `;
    
    const result = await query(deleteSQL, [orderId]);
    return result && result.length > 0;
  }

  async getActiveOrders(locationId = null) {
    let whereClause = "WHERE o.status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')";
    const params = [];
    
    if (locationId) {
      whereClause += ' AND o.location_id = $1';
      params.push(locationId);
    }
    
    const selectSQL = `
      SELECT o.order_id, o.customer_id, o.service_id, o.status, o.scheduled_date, o.scheduled_time,
             o.base_price, o.transport_fee, o.total_amount, o.created_at,
             c.customer_code, cu.first_name as customer_first_name, cu.last_name as customer_last_name,
             l.name as location_name, s.name as service_name, s.category
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users cu ON c.user_id = cu.user_id
      JOIN locations l ON o.location_id = l.location_id
      JOIN services s ON o.service_id = s.service_id
      ${whereClause}
      ORDER BY o.scheduled_date ASC
    `;
    
    return await query(selectSQL, params);
  }

  async getStats(filters = {}) {
    log.debug('OrderRepository: Getting order statistics');
    
    try {
      let sql = `
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed_orders,
          COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_orders,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(AVG(total_amount), 0) as avg_order_value,
          COUNT(DISTINCT customer_id) as unique_customers
        FROM orders
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;
      
      if (filters.location_id) {
        sql += ` AND location_id = $${paramIndex}`;
        params.push(filters.location_id);
        paramIndex++;
      }
      
      if (filters.date_from) {
        sql += ` AND created_at >= $${paramIndex}`;
        params.push(filters.date_from);
        paramIndex++;
      }
      
      if (filters.date_to) {
        sql += ` AND created_at <= $${paramIndex}`;
        params.push(filters.date_to);
        paramIndex++;
      }
      
      const result = await query(sql, params);
      return result && result.length > 0 ? result[0] : {};
    } catch (error) {
      log.error(`OrderRepository: Failed to get stats: ${error.message}`);
      throw error;
    }
  }

  async findWithTransport(filters = {}) {
    const { status, locationId, limit = 50 } = filters;
    
    let whereClause = "WHERE (o.pickup_address IS NOT NULL OR o.delivery_address IS NOT NULL)";
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      whereClause += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (locationId) {
      whereClause += ` AND o.location_id = $${paramIndex}`;
      params.push(locationId);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT o.order_id, o.customer_id, o.service_id, o.status, o.scheduled_date, o.scheduled_time,
             o.pickup_address, o.delivery_address, o.transport_fee, o.total_amount,
             c.customer_code, cu.first_name as customer_first_name, cu.last_name as customer_last_name,
             l.name as location_name, s.name as service_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users cu ON c.user_id = cu.user_id
      JOIN locations l ON o.location_id = l.location_id
      JOIN services s ON o.service_id = s.service_id
      ${whereClause}
      ORDER BY o.scheduled_date ASC
      LIMIT $${paramIndex}
    `;
    
    params.push(limit);
    return await query(selectSQL, params);
  }

  async getAvailability(date, locationId = null, serviceId = null) {
    log.debug(`OrderRepository: Getting availability for ${date}`);
    
    try {
      let sql = `
        SELECT 
          order_id,
          scheduled_date,
          scheduled_time,
          status,
          service_id,
          location_id
        FROM orders 
        WHERE scheduled_date = $1
      `;
      
      const params = [date];
      let paramIndex = 2;
      
      if (locationId) {
        sql += ` AND location_id = $${paramIndex}`;
        params.push(locationId);
        paramIndex++;
      }
      
      if (serviceId) {
        sql += ` AND service_id = $${paramIndex}`;
        params.push(serviceId);
        paramIndex++;
      }
      
      sql += ` ORDER BY scheduled_time`;
      
      const result = await query(sql, params);
      return result || [];
    } catch (error) {
      log.error(`OrderRepository: Failed to get availability: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new OrderRepository(); 