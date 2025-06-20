const { query } = require('../core/psql');

class ServiceRepository {
  async create(serviceData) {
    const { service_type, description, base_price } = serviceData;
    
    const insertSQL = `
      INSERT INTO services (service_type, description, base_price)
      VALUES ($1, $2, $3)
      RETURNING service_id, service_type, description, base_price
    `;
    
    const result = await query(insertSQL, [service_type, description, base_price]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findAll() {
    const selectSQL = `
      SELECT service_id, service_type, description, base_price
      FROM services
      ORDER BY service_type, service_id
    `;
    
    return await query(selectSQL);
  }

  async findById(serviceId) {
    const selectSQL = `
      SELECT service_id, service_type, description, base_price
      FROM services
      WHERE service_id = $1
    `;
    
    const result = await query(selectSQL, [serviceId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findByType(serviceType) {
    const selectSQL = `
      SELECT service_id, service_type, description, base_price
      FROM services
      WHERE service_type = $1
      ORDER BY service_id
    `;
    
    return await query(selectSQL, [serviceType]);
  }

  async update(serviceId, serviceData) {
    const { service_type, description, base_price } = serviceData;
    
    const updateSQL = `
      UPDATE services 
      SET service_type = COALESCE($2, service_type),
          description = COALESCE($3, description),
          base_price = COALESCE($4, base_price)
      WHERE service_id = $1
      RETURNING service_id, service_type, description, base_price
    `;
    
    const result = await query(updateSQL, [
      serviceId,
      service_type || null,
      description || null,
      base_price || null
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  async delete(serviceId) {
    const deleteSQL = `
      DELETE FROM services 
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

  async isValidServiceType(serviceType) {
    const validTypes = ['CARPET', 'CAR_WASH', 'GARMENT', 'OTHER'];
    return validTypes.includes(serviceType);
  }

  async getByTypes(serviceTypes) {
    if (!serviceTypes || serviceTypes.length === 0) {
      return [];
    }
    
    const placeholders = serviceTypes.map((_, index) => `$${index + 1}`).join(',');
    const selectSQL = `
      SELECT service_id, service_type, description, base_price
      FROM services
      WHERE service_type IN (${placeholders})
      ORDER BY service_type, service_id
    `;
    
    return await query(selectSQL, serviceTypes);
  }

  async getCount() {
    const selectSQL = `
      SELECT COUNT(*) as count FROM services
    `;
    
    const result = await query(selectSQL);
    return result && result.length > 0 ? parseInt(result[0].count) : 0;
  }
}

module.exports = new ServiceRepository(); 