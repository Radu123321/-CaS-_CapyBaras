const { query } = require('../core/psql');

class LocationRepository {
  async create(locationData) {
    const { name, address, city, postal_code, latitude, longitude, phone, email, manager_id, operating_hours, capacity } = locationData;
    
    const insertSQL = `
      INSERT INTO locations (name, address, city, postal_code, latitude, longitude, phone, email, manager_id, operating_hours, capacity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING location_id, name, address, city, postal_code, latitude, longitude, phone, email, manager_id, operating_hours, capacity, is_active, created_at
    `;
    
    const result = await query(insertSQL, [
      name, address, city || 'Bucuresti', postal_code, latitude, longitude, 
      phone, email, manager_id, operating_hours || null, capacity || 10
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findAll(includeInactive = false) {
    let whereClause = includeInactive ? '' : 'WHERE is_active = true';
    
    const selectSQL = `
      SELECT location_id, name, address, city, postal_code, latitude, longitude, phone, email, 
             manager_id, operating_hours, capacity, is_active, created_at
      FROM locations
      ${whereClause}
      ORDER BY created_at DESC
    `;
    
    return await query(selectSQL);
  }

  async findById(locationId) {
    const selectSQL = `
      SELECT l.location_id, l.name, l.address, l.city, l.postal_code, l.latitude, l.longitude, 
             l.phone, l.email, l.manager_id, l.operating_hours, l.capacity, l.is_active, l.created_at,
             u.first_name as manager_first_name, u.last_name as manager_last_name, u.email as manager_email
      FROM locations l
      LEFT JOIN users u ON l.manager_id = u.user_id
      WHERE l.location_id = $1
    `;
    
    const result = await query(selectSQL, [locationId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findByName(name) {
    const selectSQL = `
      SELECT location_id, name, address, city, latitude, longitude, phone, email, is_active, created_at
      FROM locations
      WHERE name ILIKE $1 AND is_active = true
    `;
    
    return await query(selectSQL, [`%${name}%`]);
  }

  async update(locationId, locationData) {
    const { name, address, city, postal_code, latitude, longitude, phone, email, manager_id, operating_hours, capacity, is_active } = locationData;
    
    const updateSQL = `
      UPDATE locations 
      SET name = COALESCE($2, name),
          address = COALESCE($3, address),
          city = COALESCE($4, city),
          postal_code = COALESCE($5, postal_code),
          latitude = COALESCE($6, latitude),
          longitude = COALESCE($7, longitude),
          phone = COALESCE($8, phone),
          email = COALESCE($9, email),
          manager_id = COALESCE($10, manager_id),
          operating_hours = COALESCE($11, operating_hours),
          capacity = COALESCE($12, capacity),
          is_active = COALESCE($13, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE location_id = $1
      RETURNING location_id, name, address, city, postal_code, latitude, longitude, phone, email, 
                manager_id, operating_hours, capacity, is_active, updated_at
    `;
    
    const result = await query(updateSQL, [
      locationId, name || null, address || null, city || null, postal_code || null,
      latitude || null, longitude || null, phone || null, email || null,
      manager_id || null, operating_hours || null, capacity || null, 
      is_active !== undefined ? is_active : null
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  async softDelete(locationId) {
    const updateSQL = `
      UPDATE locations 
      SET is_active = false
      WHERE location_id = $1
      RETURNING location_id, name, is_active
    `;
    
    const result = await query(updateSQL, [locationId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async exists(locationId) {
    const selectSQL = `
      SELECT 1 FROM locations WHERE location_id = $1
    `;
    
    const result = await query(selectSQL, [locationId]);
    return result && result.length > 0;
  }

  async existsByName(name) {
    const selectSQL = `
      SELECT 1 FROM locations WHERE name = $1 AND is_active = true
    `;
    
    const result = await query(selectSQL, [name]);
    return result && result.length > 0;
  }

  async getActiveCount() {
    const selectSQL = `
      SELECT COUNT(*) as count FROM locations WHERE is_active = true
    `;
    
    const result = await query(selectSQL);
    return result && result.length > 0 ? parseInt(result[0].count) : 0;
  }

  async findWithServices(locationId) {
    const selectSQL = `
      SELECT l.location_id, l.name, l.address, l.city, l.is_active,
             s.service_id, s.name as service_name, s.category, s.base_price,
             ls.is_available, ls.price_modifier
      FROM locations l
      LEFT JOIN location_services ls ON l.location_id = ls.location_id
      LEFT JOIN services s ON ls.service_id = s.service_id
      WHERE l.location_id = $1 AND l.is_active = true
      ORDER BY s.category, s.name
    `;
    
    return await query(selectSQL, [locationId]);
  }
}

module.exports = new LocationRepository(); 