const { query } = require('../core/psql');

class CustomerRepository {
  async create(customerData) {
    const { user_id, address, phone } = customerData;
    
    const insertSQL = `
      INSERT INTO customers (user_id, address, phone)
      VALUES ($1, $2, $3)
      RETURNING customer_id, user_id, address, phone, created_at
    `;
    
    const result = await query(insertSQL, [user_id, address, phone]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findAll() {
    const selectSQL = `
      SELECT c.customer_id, c.user_id, c.address, c.phone, c.created_at,
             u.email, u.full_name, u.is_active as user_active
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      ORDER BY c.created_at DESC
    `;
    
    return await query(selectSQL);
  }

  async findById(customerId) {
    const selectSQL = `
      SELECT c.customer_id, c.user_id, c.address, c.phone, c.created_at,
             u.email, u.full_name, u.is_active as user_active
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.customer_id = $1
    `;
    
    const result = await query(selectSQL, [customerId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findByUserId(userId) {
    const selectSQL = `
      SELECT customer_id, user_id, address, phone, created_at
      FROM customers
      WHERE user_id = $1
    `;
    
    const result = await query(selectSQL, [userId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async update(customerId, customerData) {
    const { address, phone } = customerData;
    
    const updateSQL = `
      UPDATE customers 
      SET address = COALESCE($2, address),
          phone = COALESCE($3, phone)
      WHERE customer_id = $1
      RETURNING customer_id, user_id, address, phone, created_at
    `;
    
    const result = await query(updateSQL, [customerId, address || null, phone || null]);
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
    const selectSQL = `
      SELECT 1 FROM customers WHERE customer_id = $1
    `;
    
    const result = await query(selectSQL, [customerId]);
    return result && result.length > 0;
  }

  async existsByUserId(userId) {
    const selectSQL = `
      SELECT 1 FROM customers WHERE user_id = $1
    `;
    
    const result = await query(selectSQL, [userId]);
    return result && result.length > 0;
  }
}

module.exports = new CustomerRepository(); 