const Base = require('./_base');
const pool = require('../core/psql');
const log = require('../core/logger');

class OrderRepository extends Base {
  constructor() { super('orders'); }

  /**
   * List orders with optional filters
   * @param {Object} f filters {status, branchId, limit=50, offset=0}
   */
  async list({ status = null, branchId = null, limit = 50, offset = 0 } = {}) {
    const { rows } = await pool.query(
      `SELECT o.*, c.email    AS customer_email,
              b.name         AS branch_name
         FROM orders o
         JOIN users c   ON c.id = o.customer_id
         JOIN branches b ON b.id = o.branch_id
        WHERE ($1::text IS NULL  OR o.status=$1)
          AND ($2::int  IS NULL  OR o.branch_id=$2)
        ORDER BY o.created_at DESC
        LIMIT $3 OFFSET $4`,
      [status, branchId, limit, offset]);
    return rows;
  }

  /**
   * Create a new order with items & assignments in one transaction
   * @param {Object} header main order fields
   * @param {Array}  items  [{serviceId, qty, priceUnit}]
   * @param {Array}  employees [{employeeId, roleCode}]
   */
  async create(header, items = [], employees = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Determine IDs with safe fallbacks
      const customerId = header.customerId ?? header.customer_id ?? header.userid ?? null;
      const branchId = header.branchId ?? header.branch_id ?? header.location_id ?? header.locationId;

      const { rows } = await client.query(
        `INSERT INTO orders
           (customer_id, branch_id, status, scheduled_start, scheduled_end,
            total_price, currency_code, created_via, notes)
         VALUES ($1,$2,'NEW',$3,$4,$5,$6,'WEB',$7)
         RETURNING id`,
        [
          customerId, branchId, header.start ?? header.scheduled_for ?? header.scheduledStart, header.end ?? null,
          header.total ?? header.total_price ?? null, header.currency || 'RON', header.notes
        ]);
      const orderId = rows[0].id;

      // order_items
      let seq = 1;
      for (const it of items) {
        await client.query(
          `INSERT INTO order_items
             (order_id, seq_no, service_id, qty, price_unit, price_total)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [orderId, seq++, it.serviceId, it.qty, it.priceUnit, it.qty * it.priceUnit]);
      }

      // assignments
      for (const a of employees) {
        await client.query(
          `INSERT INTO order_assignments (order_id, employee_id, role_code)
           VALUES ($1,$2,$3)`,
          [orderId, a.employeeId, a.roleCode]);
      }

      await client.query('COMMIT');
      return orderId;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  updateStatus(id, status) {
    return this.patch(id, 'status=$2, updated_at = now()', [status]);
  }

  delete(id) { return super.remove(id); }

  async createOrderItem(orderItemData) {
    const { order_id, service_id, quantity, price } = orderItemData;
    
    const insertSQL = `
      INSERT INTO order_items (order_id, service_id, quantity, price)
      VALUES ($1, $2, $3, $4)
      RETURNING order_id, service_id, quantity, price
    `;
    
    const result = await pool.query(insertSQL, [order_id, service_id, quantity, price]);
    return result && result.rows.length > 0 ? result.rows[0] : null;
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
    return await pool.query(selectSQL, params);
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
    
    const result = await pool.query(selectSQL, [orderId]);
    return result && result.rows.length > 0 ? result.rows[0] : null;
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
    
    return await pool.query(selectSQL, [orderId]);
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
    
    return await pool.query(selectSQL, [orderIds]);
  }

  async update(orderId, orderData) {
    const {
      customer_id,
      branch_id,
      status,
      scheduled_start,
      scheduled_end,
      notes,
      // legacy / optional fields for compatibility
      quantity,
      unit_price,
      assigned_employee_id,
      transport_request_id
    } = orderData;

    const updateSQL = `
      UPDATE orders
      SET customer_id     = COALESCE($2, customer_id),
          branch_id       = COALESCE($3, branch_id),
          status          = COALESCE($4, status),
          scheduled_start = COALESCE($5, scheduled_start),
          scheduled_end   = COALESCE($6, scheduled_end),
          notes           = COALESCE($7, notes),
          -- optional legacy fields (ignored by v3 schema if not present)
          assigned_employee_id = COALESCE($8, assigned_employee_id),
          updated_at      = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id AS order_id, customer_id, branch_id, status,
                scheduled_start, scheduled_end, total_price, notes, updated_at`;

    const result = await pool.query(updateSQL, [
      orderId,
      customer_id || null,
      branch_id   || null,
      status      || null,
      scheduled_start || null,
      scheduled_end   || null,
      notes       || null,
      assigned_employee_id || null
    ]);

    return result && result.rows.length > 0 ? result.rows[0] : null;
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
    
    return await pool.query(selectSQL);
  }

  async exists(orderId) {
    const selectSQL = `SELECT 1 FROM orders WHERE order_id = $1`;
    const result = await pool.query(selectSQL, [orderId]);
    return result && result.rows.length > 0;
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
    
    const result = await pool.query(selectSQL, params);
    
    if (status) {
      return result && result.rows.length > 0 ? parseInt(result.rows[0].count) : 0;
    }
    
    return result && result.rows || [];
  }

  async getOrdersByCustomer(customerId) {
    const selectSQL = `
      SELECT order_id, customer_id, location_id, status, scheduled_date, scheduled_time,
             pickup_address, delivery_address, special_instructions, total_amount, created_at
      FROM orders
      WHERE customer_id = $1
      ORDER BY created_at DESC
    `;
    
    return await pool.query(selectSQL, [customerId]);
  }

  async getOrdersByLocation(locationId) {
    const selectSQL = `
      SELECT order_id, customer_id, location_id, status, scheduled_date, scheduled_time,
             pickup_address, delivery_address, special_instructions, total_amount, created_at
      FROM orders
      WHERE location_id = $1
      ORDER BY created_at DESC
    `;
    
    return await pool.query(selectSQL, [locationId]);
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
    
    return await pool.query(selectSQL, [customerId, limit]);
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
    return await pool.query(selectSQL, params);
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
    return await pool.query(selectSQL, params);
  }

  async assignEmployee(orderId, employeeId) {
    const updateSQL = `
      UPDATE orders 
      SET assigned_employee_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
      RETURNING order_id, assigned_employee_id, updated_at
    `;
    
    const result = await pool.query(updateSQL, [orderId, employeeId]);
    return result && result.rows.length > 0 ? result.rows[0] : null;
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
    
    return await pool.query(selectSQL, params);
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
      
      const result = await pool.query(sql, params);
      return result && result.rows.length > 0 ? result.rows[0] : {};
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
    return await pool.query(selectSQL, params);
  }

  async getAvailability(date, branchId = null) {
    log.debug(`OrderRepository: Getting availability for ${date}`);

    try {
      let sql = `
        SELECT id, scheduled_start, scheduled_end, status, branch_id
          FROM orders
         WHERE DATE(scheduled_start) = $1`;

      const params = [date];
      if (branchId) {
        sql += ' AND branch_id = $2';
        params.push(branchId);
      }

      sql += ' ORDER BY scheduled_start';

      const { rows } = await pool.query(sql, params);

      const unavailable = rows.map(r => new Date(r.scheduled_start).toISOString().substring(11,16));
      return { unavailable };
    } catch (error) {
      log.error(`OrderRepository: Failed to get availability: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new OrderRepository(); 