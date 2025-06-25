const { query } = require('../core/psql');

class OrderRepository {
  async create(orderData) {
    const { 
      customer_id, 
      location_id, 
      service_id, 
      quantity, 
      unit_price, 
      total_amount, 
      scheduled_for, 
      assigned_employee_id,
      transport_request_id,
      notes 
    } = orderData;
    
    const insertSQL = `
      INSERT INTO orders (customer_id, location_id, service_id, quantity, unit_price, 
                         total_amount, scheduled_for, assigned_employee_id, 
                         transport_request_id, notes) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING order_id, customer_id, location_id, service_id, quantity, unit_price,
                total_amount, status, scheduled_for, assigned_employee_id,
                transport_request_id, notes, created_at
    `;
    
    const result = await query(insertSQL, [
      customer_id, location_id, service_id, quantity, unit_price,
      total_amount, scheduled_for, assigned_employee_id,
      transport_request_id, notes
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
             o.special_instructions, o.item_description, o.item_type, o.item_condition, o.created_at,
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
    const { started_at, completed_at } = additionalData;
    
    let setClause = 'status = $2';
    const params = [orderId, newStatus];
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
    
    const updateSQL = `
      UPDATE orders 
      SET ${setClause}
      WHERE order_id = $1
      RETURNING order_id, status, started_at, completed_at, scheduled_for
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
    return ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
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
          WHEN 'SCHEDULED' THEN 2 
          WHEN 'IN_PROGRESS' THEN 3 
          WHEN 'COMPLETED' THEN 4 
          WHEN 'CANCELLED' THEN 5 
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
      SELECT order_id, customer_id, location_id, status, scheduled_date, 
             pickup_address, delivery_address, special_instructions, created_at
      FROM orders
      WHERE customer_id = $1
      ORDER BY created_at DESC
    `;
    
    return await query(selectSQL, [customerId]);
  }

  async getOrdersByLocation(locationId) {
    const selectSQL = `
      SELECT order_id, customer_id, location_id, status, scheduled_for, 
             recurrence_rule, transport_needed, notes, created_at
      FROM orders
      WHERE location_id = $1
      ORDER BY created_at DESC
    `;
    
    return await query(selectSQL, [locationId]);
  }

  async findByCustomerId(customerId, limit = 20) {
    const selectSQL = `
      SELECT o.order_id, o.service_id, o.quantity, o.unit_price, o.total_amount, 
             o.status, o.scheduled_for, o.started_at, o.completed_at, o.notes, o.created_at,
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
      whereClause += ` AND o.scheduled_for >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereClause += ` AND o.scheduled_for <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT o.order_id, o.customer_id, o.service_id, o.quantity, o.unit_price, 
             o.total_amount, o.status, o.scheduled_for, o.started_at, o.completed_at, 
             o.transport_request_id, o.notes, o.created_at,
             c.customer_code, cu.first_name as customer_first_name, cu.last_name as customer_last_name, 
             cu.phone as customer_phone,
             l.name as location_name, s.name as service_name, s.description as service_description,
             tr.pickup_address, tr.delivery_address, tr.status as transport_status
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users cu ON c.user_id = cu.user_id
      JOIN locations l ON o.location_id = l.location_id
      JOIN services s ON o.service_id = s.service_id
      LEFT JOIN transport_requests tr ON o.transport_request_id = tr.transport_request_id
      ${whereClause}
      ORDER BY o.scheduled_for ASC, o.created_at DESC
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
      whereClause += ` AND o.scheduled_for >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereClause += ` AND o.scheduled_for <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT o.order_id, o.customer_id, o.service_id, o.quantity, o.unit_price, 
             o.total_amount, o.status, o.scheduled_for, o.started_at, o.completed_at, 
             o.assigned_employee_id, o.transport_request_id, o.notes, o.created_at,
             c.customer_code, cu.first_name as customer_first_name, cu.last_name as customer_last_name,
             s.name as service_name, s.description as service_description,
             e.employee_code, eu.first_name as employee_first_name, eu.last_name as employee_last_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users cu ON c.user_id = cu.user_id
      JOIN services s ON o.service_id = s.service_id
      LEFT JOIN employees e ON o.assigned_employee_id = e.employee_id
      LEFT JOIN users eu ON e.user_id = eu.user_id
      ${whereClause}
      ORDER BY o.scheduled_for ASC, o.created_at DESC
      LIMIT $${paramIndex}
    `;
    
    params.push(limit);
    return await query(selectSQL, params);
  }

  async assignEmployee(orderId, employeeId) {
    const updateSQL = `
      UPDATE orders 
      SET assigned_employee_id = $2
      WHERE order_id = $1
      RETURNING order_id, assigned_employee_id
    `;
    
    const result = await query(updateSQL, [orderId, employeeId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async delete(orderId) {
    const deleteSQL = `
      DELETE FROM orders 
      WHERE order_id = $1 AND status IN ('PENDING', 'SCHEDULED')
      RETURNING order_id
    `;
    
    const result = await query(deleteSQL, [orderId]);
    return result && result.length > 0;
  }

  async getActiveOrders(locationId = null) {
    let whereClause = "WHERE status IN ('PENDING', 'SCHEDULED', 'IN_PROGRESS')";
    const params = [];
    
    if (locationId) {
      whereClause += ' AND location_id = $1';
      params.push(locationId);
    }
    
    const selectSQL = `
      SELECT o.order_id, o.customer_id, o.service_id, o.status, o.scheduled_for, 
             o.total_amount, o.assigned_employee_id,
             c.customer_code, cu.first_name as customer_first_name, cu.last_name as customer_last_name,
             s.name as service_name, s.category as service_category,
             e.employee_code, eu.first_name as employee_first_name, eu.last_name as employee_last_name,
             l.name as location_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users cu ON c.user_id = cu.user_id
      JOIN services s ON o.service_id = s.service_id
      JOIN locations l ON o.location_id = l.location_id
      LEFT JOIN employees e ON o.assigned_employee_id = e.employee_id
      LEFT JOIN users eu ON e.user_id = eu.user_id
      ${whereClause}
      ORDER BY 
        CASE o.status 
          WHEN 'IN_PROGRESS' THEN 1 
          WHEN 'SCHEDULED' THEN 2 
          WHEN 'PENDING' THEN 3 
        END,
        o.scheduled_for ASC
    `;
    
    return await query(selectSQL, params);
  }

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
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END) as scheduled_orders,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_orders,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value,
        COUNT(DISTINCT customer_id) as unique_customers,
        COUNT(CASE WHEN transport_request_id IS NOT NULL THEN 1 END) as orders_with_transport
      FROM orders
      ${whereClause}
    `;
    
    const result = await query(statsSQL, params);
    return result && result.length > 0 ? result[0] : null;
  }

  async findWithTransport(filters = {}) {
    const { status, location_id, limit = 50 } = filters;
    
    let whereClause = 'WHERE o.transport_request_id IS NOT NULL';
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      whereClause += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (location_id) {
      whereClause += ` AND o.location_id = $${paramIndex}`;
      params.push(location_id);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT o.order_id, o.customer_id, o.service_id, o.status, o.scheduled_for, 
             o.total_amount, o.transport_request_id,
             c.customer_code, cu.first_name as customer_first_name, cu.last_name as customer_last_name,
             s.name as service_name,
             tr.pickup_address, tr.delivery_address, tr.status as transport_status,
             tr.pickup_time, tr.delivery_time
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users cu ON c.user_id = cu.user_id
      JOIN services s ON o.service_id = s.service_id
      JOIN transport_requests tr ON o.transport_request_id = tr.transport_request_id
      ${whereClause}
      ORDER BY o.scheduled_for ASC
      LIMIT $${paramIndex}
    `;
    
    params.push(limit);
    return await query(selectSQL, params);
  }
}

module.exports = new OrderRepository(); 