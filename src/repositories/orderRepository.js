const { query } = require('../core/psql');

class OrderRepository {
  async create(orderData) {
    const { customer_id, location_id, scheduled_for, recurrence_rule, transport_needed, notes } = orderData;
    
    const insertSQL = `
      INSERT INTO orders (customer_id, location_id, scheduled_for, recurrence_rule, transport_needed, notes) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING order_id, customer_id, location_id, status, scheduled_for, recurrence_rule, 
                transport_needed, notes, created_at
    `;
    
    const result = await query(insertSQL, [
      customer_id,
      location_id,
      scheduled_for || null,
      recurrence_rule || null,
      transport_needed,
      notes || null
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
    const { status, customer_id, location_id } = filters;
    
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
    
    const selectSQL = `
      SELECT o.order_id, o.customer_id, o.location_id, o.status, o.scheduled_for, 
             o.recurrence_rule, o.transport_needed, o.notes, o.created_at,
             c.address as customer_address, c.phone as customer_phone,
             u.email as customer_email, u.full_name as customer_name,
             l.name as location_name, l.address as location_address
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      JOIN locations l ON o.location_id = l.location_id
      ${whereClause}
      ORDER BY o.created_at DESC
    `;
    
    return await query(selectSQL, params);
  }

  async findById(orderId) {
    const selectSQL = `
      SELECT o.order_id, o.customer_id, o.location_id, o.status, o.scheduled_for, 
             o.recurrence_rule, o.transport_needed, o.notes, o.created_at,
             c.address as customer_address, c.phone as customer_phone,
             u.email as customer_email, u.full_name as customer_name,
             l.name as location_name, l.address as location_address
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      JOIN locations l ON o.location_id = l.location_id
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

  async updateStatus(orderId, newStatus) {
    const updateSQL = `
      UPDATE orders 
      SET status = $2
      WHERE order_id = $1
      RETURNING order_id, status, scheduled_for, created_at
    `;
    
    const result = await query(updateSQL, [orderId, newStatus]);
    return result && result.length > 0 ? result[0] : null;
  }

  async update(orderId, orderData) {
    const { scheduled_for, notes, transport_needed } = orderData;
    
    const updateSQL = `
      UPDATE orders 
      SET scheduled_for = COALESCE($2, scheduled_for),
          notes = COALESCE($3, notes),
          transport_needed = COALESCE($4, transport_needed)
      WHERE order_id = $1
      RETURNING order_id, customer_id, location_id, status, scheduled_for, 
                recurrence_rule, transport_needed, notes, created_at
    `;
    
    const result = await query(updateSQL, [
      orderId, 
      scheduled_for || null, 
      notes || null,
      transport_needed !== undefined ? transport_needed : null
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findWithRecurrence() {
    const selectSQL = `
      SELECT order_id, customer_id, location_id, scheduled_for, recurrence_rule, 
             transport_needed, notes, created_at
      FROM orders
      WHERE recurrence_rule IS NOT NULL 
        AND recurrence_rule != ''
        AND status IN ('SCHEDULED', 'COMPLETED')
      ORDER BY scheduled_for
    `;
    
    return await query(selectSQL);
  }

  async exists(orderId) {
    const selectSQL = `
      SELECT 1 FROM orders WHERE order_id = $1
    `;
    
    const result = await query(selectSQL, [orderId]);
    return result && result.length > 0;
  }

  async getValidStatuses() {
    return ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  }

  async getCountByStatus(status) {
    const selectSQL = `
      SELECT COUNT(*) as count FROM orders WHERE status = $1
    `;
    
    const result = await query(selectSQL, [status]);
    return result && result.length > 0 ? parseInt(result[0].count) : 0;
  }

  async getOrdersByCustomer(customerId) {
    const selectSQL = `
      SELECT order_id, customer_id, location_id, status, scheduled_for, 
             recurrence_rule, transport_needed, notes, created_at
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
}

module.exports = new OrderRepository(); 