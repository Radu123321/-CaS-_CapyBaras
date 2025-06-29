const pool = require('../core/psql');

/**
 * Service Repository – schema v3
 * Covers CRUD for services + requirements
 */
module.exports = {
  /** Return all services with category description */
  async list() {
    const { rows } = await pool.query(
      `SELECT s.*, c.description AS category_desc
         FROM services s
         JOIN service_categories c ON c.code = s.category_code
        ORDER BY s.id`);
    return rows;
  },

  /**
   * Create service with requirements (atomic)
   * @param {Object} svc   {categoryCode,name,description,basePrice,currencyCode,avgDurationMin}
   * @param {Array}  reqs  [{resourceType,resourceCode,qty,unitCode}]
   * @returns new service id
   */
  async create(svc, reqs = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO services
           (category_code,name,description,base_price,currency_code,avg_duration_min)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id`,
        [
          svc.categoryCode, svc.name, svc.description || null, svc.basePrice,
          svc.currencyCode || 'RON', svc.avgDurationMin
        ]);
      const serviceId = rows[0].id;

      for (const r of reqs) {
        await client.query(
          `INSERT INTO services_requirements
             (service_id,resource_type,resource_code,qty_needed,unit_code)
           VALUES ($1,$2,$3,$4,$5)`,
          [serviceId, r.resourceType, r.resourceCode, r.qty, r.unitCode]);
      }
      await client.query('COMMIT');
      return serviceId;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /** delete service and cascade requirements */
  delete: id => pool.query('DELETE FROM services WHERE id=$1', [id]),
}; 