const { query } = require('../core/psql');

class ServiceRepository {
  async create(serviceData) {
    const { name, category, description, base_price, duration_minutes, requires_transport } = serviceData;
    
    const insertSQL = `
      INSERT INTO services (name, category, description, base_price, duration_minutes, requires_transport)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING service_id, name, category, description, base_price, duration_minutes, requires_transport, is_active
    `;
    
    const result = await query(insertSQL, [name, category, description, base_price, duration_minutes || 60, requires_transport || false]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findAll() {
    const selectSQL = `
      SELECT service_id, name, category, description, base_price, duration_minutes, requires_transport, is_active
      FROM services
      WHERE is_active = true
      ORDER BY category, name
    `;
    
    return await query(selectSQL);
  }

  async findById(serviceId) {
    const selectSQL = `
      SELECT service_id, name, category, description, base_price, duration_minutes, requires_transport, is_active, created_at
      FROM services
      WHERE service_id = $1
    `;
    
    const result = await query(selectSQL, [serviceId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findByCategory(category) {
    const selectSQL = `
      SELECT service_id, name, category, description, base_price, duration_minutes, requires_transport, is_active
      FROM services
      WHERE category = $1 AND is_active = true
      ORDER BY name
    `;
    
    return await query(selectSQL, [category]);
  }

  async update(serviceId, serviceData) {
    const { name, category, description, base_price, duration_minutes, requires_transport, is_active } = serviceData;
    
    const updateSQL = `
      UPDATE services 
      SET name = COALESCE($2, name),
          category = COALESCE($3, category),
          description = COALESCE($4, description),
          base_price = COALESCE($5, base_price),
          duration_minutes = COALESCE($6, duration_minutes),
          requires_transport = COALESCE($7, requires_transport),
          is_active = COALESCE($8, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE service_id = $1
      RETURNING service_id, name, category, description, base_price, duration_minutes, requires_transport, is_active
    `;
    
    const result = await query(updateSQL, [
      serviceId,
      name || null,
      category || null,
      description || null,
      base_price || null,
      duration_minutes || null,
      requires_transport !== undefined ? requires_transport : null,
      is_active !== undefined ? is_active : null
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  async delete(serviceId) {
    const deleteSQL = `
      UPDATE services 
      SET is_active = false
      WHERE service_id = $1
      RETURNING service_id
    `;
    
    const result = await query(deleteSQL, [serviceId]);
    return result && result.length > 0;
  }

  async exists(serviceId) {
    const selectSQL = `
      SELECT 1 FROM services WHERE service_id = $1
    `;
    
    const result = await query(selectSQL, [serviceId]);
    return result && result.length > 0;
  }

  async isValidCategory(category) {
    const validCategories = ['CARPET', 'CAR_WASH', 'GARMENT', 'UPHOLSTERY', 'OTHER'];
    return validCategories.includes(category);
  }

  async getByCategories(categories) {
    if (!categories || categories.length === 0) {
      return [];
    }
    
    const placeholders = categories.map((_, index) => `$${index + 1}`).join(',');
    const selectSQL = `
      SELECT service_id, name, category, description, base_price, duration_minutes, requires_transport, is_active
      FROM services
      WHERE category IN (${placeholders}) AND is_active = true
      ORDER BY category, name
    `;
    
    return await query(selectSQL, categories);
  }

  async getCount() {
    const selectSQL = `
      SELECT COUNT(*) as count FROM services WHERE is_active = true
    `;
    
    const result = await query(selectSQL);
    return result && result.length > 0 ? parseInt(result[0].count) : 0;
  }

  // Metodă pentru compatibilitate cu codul vechi
  async findByType(serviceType) {
    return await this.findByCategory(serviceType);
  }
}

module.exports = new ServiceRepository(); 