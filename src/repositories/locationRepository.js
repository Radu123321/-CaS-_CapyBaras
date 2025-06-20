const { query } = require('../core/psql');

class LocationRepository {
  async create(locationData) {
    const { name, address, latitude, longitude, timezone } = locationData;
    
    const insertSQL = `
      INSERT INTO locations (name, address, latitude, longitude, timezone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING location_id, name, address, latitude, longitude, timezone, is_active, created_at
    `;
    
    const result = await query(insertSQL, [name, address, latitude, longitude, timezone || 'UTC']);
    return result && result.length > 0 ? result[0] : null;
  }

  async findAll(includeInactive = false) {
    let whereClause = includeInactive ? '' : 'WHERE is_active = true';
    
    const selectSQL = `
      SELECT location_id, name, address, latitude, longitude, timezone, is_active, created_at
      FROM locations
      ${whereClause}
      ORDER BY created_at DESC
    `;
    
    return await query(selectSQL);
  }

  async findById(locationId) {
    const selectSQL = `
      SELECT location_id, name, address, latitude, longitude, timezone, is_active, created_at
      FROM locations
      WHERE location_id = $1
    `;
    
    const result = await query(selectSQL, [locationId]);
    return result && result.length > 0 ? result[0] : null;
  }

  async findByName(name) {
    const selectSQL = `
      SELECT location_id, name, address, latitude, longitude, timezone, is_active, created_at
      FROM locations
      WHERE name ILIKE $1 AND is_active = true
    `;
    
    return await query(selectSQL, [`%${name}%`]);
  }

  async update(locationId, locationData) {
    const { name, address, latitude, longitude, timezone } = locationData;
    
    const updateSQL = `
      UPDATE locations 
      SET name = COALESCE($2, name),
          address = COALESCE($3, address),
          latitude = COALESCE($4, latitude),
          longitude = COALESCE($5, longitude),
          timezone = COALESCE($6, timezone)
      WHERE location_id = $1
      RETURNING location_id, name, address, latitude, longitude, timezone, is_active, created_at
    `;
    
    const result = await query(updateSQL, [
      locationId,
      name || null,
      address || null,
      latitude || null,
      longitude || null,
      timezone || null
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
}

module.exports = new LocationRepository(); 