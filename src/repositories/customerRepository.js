const { query } = require('../core/psql');

class CustomerRepository {
  async create(customerData) {
    const { 
      user_id, 
      customer_code, 
      company_name, 
      billing_address, 
      preferred_location_id, 
      preferred_contact_method 
    } = customerData;
    
    const insertSQL = `
      INSERT INTO customers (user_id, customer_code, company_name, billing_address, 
                           preferred_location_id, preferred_contact_method)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING customer_id, user_id, customer_code, company_name, billing_address,
                preferred_location_id, loyalty_points, total_orders, total_spent,
                preferred_contact_method, created_at
    `;
    
    const result = await query(insertSQL, [
      user_id, customer_code, company_name, billing_address, 
      preferred_location_id, preferred_contact_method || 'EMAIL'
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findAll(filters = {}) {
    const { is_active, company_type, location_id } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (is_active !== undefined) {
      whereClause += ` AND u.is_active = $${paramIndex}`;
      params.push(is_active);
      paramIndex++;
    }
    
    if (company_type === 'corporate') {
      whereClause += ` AND c.company_name IS NOT NULL`;
    } else if (company_type === 'individual') {
      whereClause += ` AND c.company_name IS NULL`;
    }
    
    if (location_id) {
      whereClause += ` AND c.preferred_location_id = $${paramIndex}`;
      params.push(location_id);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT c.customer_id, c.user_id, c.customer_code, c.company_name, 
             c.billing_address, c.preferred_location_id, c.loyalty_points,
             c.total_orders, c.total_spent, c.preferred_contact_method, c.created_at,
             u.username, u.email, u.first_name, u.last_name, u.phone, u.is_active,
             l.name as preferred_location_name
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN locations l ON c.preferred_location_id = l.location_id
      ${whereClause}
      ORDER BY c.created_at DESC
    `;
    
    return await query(selectSQL, params);
  }

  async findById(customerId) {
    const selectSQL = `
      SELECT c.customer_id, c.user_id, c.customer_code, c.company_name, 
             c.billing_address, c.preferred_location_id, c.loyalty_points,
             c.total_orders, c.total_spent, c.preferred_contact_method, c.created_at,
             u.username, u.email, u.first_name, u.last_name, u.phone, u.is_active,
             l.name as preferred_location_name, l.address as preferred_location_address
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN locations l ON c.preferred_location_id = l.location_id
      WHERE c.customer_id = $1
    `;
    
    const result = await query(selectSQL, [customerId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findByUserId(userId) {
    const selectSQL = `
      SELECT c.customer_id, c.user_id, c.customer_code, c.company_name, 
             c.billing_address, c.preferred_location_id, c.loyalty_points,
             c.total_orders, c.total_spent, c.preferred_contact_method, c.created_at,
             u.username, u.email, u.first_name, u.last_name, u.phone, u.is_active
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.user_id = $1
    `;
    
    const result = await query(selectSQL, [userId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findByCode(customerCode) {
    const selectSQL = `
      SELECT c.customer_id, c.user_id, c.customer_code, c.company_name, 
             c.billing_address, c.preferred_location_id, c.loyalty_points,
             c.total_orders, c.total_spent, c.preferred_contact_method, c.created_at,
             u.username, u.email, u.first_name, u.last_name, u.phone, u.is_active
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.customer_code = $1
    `;
    
    const result = await query(selectSQL, [customerCode]);
    return result && result.length > 0 ? result[0] : null;
  }

  async update(customerId, customerData) {
    const { 
      company_name, 
      billing_address, 
      preferred_location_id, 
      preferred_contact_method 
    } = customerData;
    
    const updateSQL = `
      UPDATE customers 
      SET company_name = COALESCE($2, company_name),
          billing_address = COALESCE($3, billing_address),
          preferred_location_id = COALESCE($4, preferred_location_id),
          preferred_contact_method = COALESCE($5, preferred_contact_method)
      WHERE customer_id = $1
      RETURNING customer_id, user_id, customer_code, company_name, billing_address,
                preferred_location_id, loyalty_points, total_orders, total_spent,
                preferred_contact_method, updated_at
    `;
    
    const result = await query(updateSQL, [
      customerId, 
      company_name || null, 
      billing_address || null,
      preferred_location_id || null,
      preferred_contact_method || null
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  async updateLoyaltyPoints(customerId, pointsToAdd) {
    const updateSQL = `
      UPDATE customers 
      SET loyalty_points = loyalty_points + $2
      WHERE customer_id = $1
      RETURNING customer_id, loyalty_points
    `;
    
    const result = await query(updateSQL, [customerId, pointsToAdd]);
    return result && result.length > 0 ? result[0] : null;
  }

  async updateStats(customerId, orderAmount = 0, incrementOrders = true) {
    const updateSQL = `
      UPDATE customers 
      SET total_orders = total_orders + $2,
          total_spent = total_spent + $3
      WHERE customer_id = $1
      RETURNING customer_id, total_orders, total_spent
    `;
    
    const result = await query(updateSQL, [
      customerId, 
      incrementOrders ? 1 : 0, 
      orderAmount
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  async delete(customerId) {
    const deleteSQL = `
      DELETE FROM customers 
      WHERE customer_id = $1
      RETURNING customer_id
    `;
    
    const result = await query(deleteSQL, [customerId]);
    return result && result.length > 0;
  }

  async exists(customerId) {
    const selectSQL = `SELECT 1 FROM customers WHERE customer_id = $1`;
    const result = await query(selectSQL, [customerId]);
    return result && result.length > 0;
  }

  async existsByUserId(userId) {
    const selectSQL = `SELECT 1 FROM customers WHERE user_id = $1`;
    const result = await query(selectSQL, [userId]);
    return result && result.length > 0;
  }

  async codeExists(customerCode) {
    const selectSQL = `SELECT 1 FROM customers WHERE customer_code = $1`;
    const result = await query(selectSQL, [customerCode]);
    return result && result.length > 0;
  }

  async getVIPCustomers(limit = 10) {
    const selectSQL = `
      SELECT c.customer_id, c.customer_code, c.loyalty_points, c.total_orders, c.total_spent,
             u.first_name, u.last_name, u.email, c.company_name
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      WHERE u.is_active = true
      ORDER BY c.loyalty_points DESC, c.total_spent DESC
      LIMIT $1
    `;
    
    return await query(selectSQL, [limit]);
  }

  async getCustomerStats() {
    const statsSQL = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN company_name IS NOT NULL THEN 1 END) as corporate_customers,
        COUNT(CASE WHEN company_name IS NULL THEN 1 END) as individual_customers,
        AVG(loyalty_points) as avg_loyalty_points,
        AVG(total_orders) as avg_orders_per_customer,
        AVG(total_spent) as avg_spent_per_customer,
        SUM(total_spent) as total_revenue
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      WHERE u.is_active = true
    `;
    
    const result = await query(statsSQL);
    return result && result.length > 0 ? result[0] : null;
  }

  async getTopCustomersByOrders(limit = 10) {
    const selectSQL = `
      SELECT c.customer_id, c.customer_code, c.total_orders, c.total_spent,
             u.first_name, u.last_name, u.email, c.company_name
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      WHERE u.is_active = true AND c.total_orders > 0
      ORDER BY c.total_orders DESC, c.total_spent DESC
      LIMIT $1
    `;
    
    return await query(selectSQL, [limit]);
  }
}

module.exports = new CustomerRepository(); 