const psql = require('../core/psql');
const log = require('../core/logger');

class InventoryRepository {
  // ==================== RESOURCES ====================
  
  async getAllResources() {
    const query = `
      SELECT resource_id, name, kind, unit, unit_cost, 
             COALESCE(unit_cost, 0) as unit_cost
      FROM resources 
      ORDER BY kind, name
    `;
    
    return await psql.query(query);
  }
  
  async getResourceById(resourceId) {
    const query = `
      SELECT resource_id, name, kind, unit, unit_cost
      FROM resources 
      WHERE resource_id = $1
    `;
    
    const result = await psql.query(query, [resourceId]);
    return result[0] || null;
  }
  
  async createResource(resourceData) {
    const { name, kind, unit, unit_cost } = resourceData;
    
    const query = `
      INSERT INTO resources (name, kind, unit, unit_cost)
      VALUES ($1, $2, $3, $4)
      RETURNING resource_id, name, kind, unit, unit_cost
    `;
    
    const result = await psql.query(query, [name, kind, unit, unit_cost || 0]);
    return result[0];
  }
  
  async updateResource(resourceId, resourceData) {
    const { name, kind, unit, unit_cost } = resourceData;
    
    const query = `
      UPDATE resources 
      SET name = COALESCE($2, name),
          kind = COALESCE($3, kind),
          unit = COALESCE($4, unit),
          unit_cost = COALESCE($5, unit_cost)
      WHERE resource_id = $1
      RETURNING resource_id, name, kind, unit, unit_cost
    `;
    
    const result = await psql.query(query, [resourceId, name, kind, unit, unit_cost]);
    return result[0] || null;
  }
  
  async deleteResource(resourceId) {
    // Check if resource is used in any inventory or order
    const checkQuery = `
      SELECT COUNT(*) as usage_count
      FROM inventory 
      WHERE resource_id = $1 AND quantity > 0
      UNION ALL
      SELECT COUNT(*) as usage_count
      FROM order_resource_usage 
      WHERE resource_id = $1
    `;
    
    const usageResult = await psql.query(checkQuery, [resourceId]);
    const totalUsage = usageResult.reduce((sum, row) => sum + parseInt(row.usage_count), 0);
    
    if (totalUsage > 0) {
      throw new Error('Cannot delete resource: it is currently in use');
    }
    
    const query = `DELETE FROM resources WHERE resource_id = $1`;
    const result = await psql.query(query, [resourceId]);
    
    return result.rowCount > 0;
  }
  
  // ==================== INVENTORY ====================
  
  async getInventoryByLocation(locationId, includeZero = false) {
    const whereClause = includeZero ? '' : 'AND i.quantity > 0';
    
    const query = `
      SELECT i.location_id, i.resource_id, i.quantity, i.updated_at,
             r.name as resource_name, r.kind, r.unit, r.unit_cost,
             l.name as location_name
      FROM inventory i
      JOIN resources r ON i.resource_id = r.resource_id
      JOIN locations l ON i.location_id = l.location_id
      WHERE i.location_id = $1 ${whereClause}
      ORDER BY r.kind, r.name
    `;
    
    return await psql.query(query, [locationId]);
  }
  
  async getInventoryByResource(resourceId) {
    const query = `
      SELECT i.location_id, i.resource_id, i.quantity, i.updated_at,
             r.name as resource_name, r.kind, r.unit, r.unit_cost,
             l.name as location_name
      FROM inventory i
      JOIN resources r ON i.resource_id = r.resource_id
      JOIN locations l ON i.location_id = l.location_id
      WHERE i.resource_id = $1 AND i.quantity > 0
      ORDER BY l.name
    `;
    
    return await psql.query(query, [resourceId]);
  }
  
  async getAllInventory(includeZero = false) {
    const whereClause = includeZero ? '' : 'WHERE i.quantity > 0';
    
    const query = `
      SELECT i.location_id, i.resource_id, i.quantity, i.updated_at,
             r.name as resource_name, r.kind, r.unit, r.unit_cost,
             l.name as location_name
      FROM inventory i
      JOIN resources r ON i.resource_id = r.resource_id
      JOIN locations l ON i.location_id = l.location_id
      ${whereClause}
      ORDER BY l.name, r.kind, r.name
    `;
    
    return await psql.query(query);
  }
  
  async getInventoryItem(locationId, resourceId) {
    const query = `
      SELECT i.location_id, i.resource_id, i.quantity, i.updated_at,
             r.name as resource_name, r.kind, r.unit, r.unit_cost,
             l.name as location_name
      FROM inventory i
      JOIN resources r ON i.resource_id = r.resource_id
      JOIN locations l ON i.location_id = l.location_id
      WHERE i.location_id = $1 AND i.resource_id = $2
    `;
    
    const result = await psql.query(query, [locationId, resourceId]);
    return result[0] || null;
  }
  
  async updateInventoryQuantity(locationId, resourceId, quantity) {
    const query = `
      INSERT INTO inventory (location_id, resource_id, quantity, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (location_id, resource_id)
      DO UPDATE SET 
        quantity = $3,
        updated_at = NOW()
      RETURNING location_id, resource_id, quantity, updated_at
    `;
    
    const result = await psql.query(query, [locationId, resourceId, quantity]);
    return result[0];
  }
  
  async adjustInventoryQuantity(locationId, resourceId, adjustment) {
    const query = `
      INSERT INTO inventory (location_id, resource_id, quantity, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (location_id, resource_id)
      DO UPDATE SET 
        quantity = inventory.quantity + $3,
        updated_at = NOW()
      RETURNING location_id, resource_id, quantity, updated_at
    `;
    
    const result = await psql.query(query, [locationId, resourceId, adjustment]);
    return result[0];
  }
  
  // ==================== RESOURCE USAGE ====================
  
  async getOrderResourceUsage(orderId) {
    const query = `
      SELECT oru.order_id, oru.resource_id, oru.quantity,
             r.name as resource_name, r.kind, r.unit, r.unit_cost
      FROM order_resource_usage oru
      JOIN resources r ON oru.resource_id = r.resource_id
      WHERE oru.order_id = $1
      ORDER BY r.kind, r.name
    `;
    
    return await psql.query(query, [orderId]);
  }
  
  async addOrderResourceUsage(orderId, resourceId, quantity) {
    const query = `
      INSERT INTO order_resource_usage (order_id, resource_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (order_id, resource_id)
      DO UPDATE SET quantity = order_resource_usage.quantity + $3
      RETURNING order_id, resource_id, quantity
    `;
    
    const result = await psql.query(query, [orderId, resourceId, quantity]);
    return result[0];
  }
  
  async removeOrderResourceUsage(orderId, resourceId = null) {
    let query, params;
    
    if (resourceId) {
      query = `DELETE FROM order_resource_usage WHERE order_id = $1 AND resource_id = $2`;
      params = [orderId, resourceId];
    } else {
      query = `DELETE FROM order_resource_usage WHERE order_id = $1`;
      params = [orderId];
    }
    
    const result = await psql.query(query, params);
    return result.rowCount > 0;
  }
  
  // ==================== TRANSACTIONS ====================
  
  async consumeResources(locationId, resourceUsage) {
    // resourceUsage = [{ resource_id, quantity }, ...]
    
    const queries = [];
    
    for (const usage of resourceUsage) {
      const { resource_id, quantity } = usage;
      
      // Check if enough quantity is available and decrease inventory in one query
      queries.push({
        text: `
          UPDATE inventory 
          SET quantity = quantity - $3, updated_at = NOW()
          WHERE location_id = $1 AND resource_id = $2 AND quantity >= $3
          RETURNING quantity
        `,
        values: [locationId, resource_id, quantity]
      });
    }
    
    try {
      // Execute transaction
      await psql.transaction(queries);
      return true;
    } catch (error) {
      log.error(`Failed to consume resources: ${error.message}`);
      throw new Error('Insufficient inventory or transaction failed');
    }
  }
  
  async restockResources(locationId, resourceRestock) {
    // resourceRestock = [{ resource_id, quantity }, ...]
    
    const queries = [];
    
    for (const restock of resourceRestock) {
      const { resource_id, quantity } = restock;
      
      queries.push({
        text: `
          INSERT INTO inventory (location_id, resource_id, quantity, updated_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (location_id, resource_id)
          DO UPDATE SET 
            quantity = inventory.quantity + $3,
            updated_at = NOW()
          RETURNING location_id, resource_id, quantity
        `,
        values: [locationId, resource_id, quantity]
      });
    }
    
    try {
      await psql.transaction(queries);
      return true;
    } catch (error) {
      log.error(`Failed to restock resources: ${error.message}`);
      throw error;
    }
  }
  
  // ==================== LOW STOCK ALERTS ====================
  
  async getLowStockItems(threshold = 10) {
    const query = `
      SELECT i.location_id, i.resource_id, i.quantity, i.updated_at,
             r.name as resource_name, r.kind, r.unit, r.unit_cost,
             l.name as location_name
      FROM inventory i
      JOIN resources r ON i.resource_id = r.resource_id
      JOIN locations l ON i.location_id = l.location_id
      WHERE i.quantity <= $1 AND i.quantity >= 0
      ORDER BY i.quantity ASC, l.name, r.name
    `;
    
    return await psql.query(query, [threshold]);
  }
  
  async getOutOfStockItems() {
    const query = `
      SELECT i.location_id, i.resource_id, i.quantity, i.updated_at,
             r.name as resource_name, r.kind, r.unit, r.unit_cost,
             l.name as location_name
      FROM inventory i
      JOIN resources r ON i.resource_id = r.resource_id
      JOIN locations l ON i.location_id = l.location_id
      WHERE i.quantity <= 0
      ORDER BY l.name, r.name
    `;
    
    return await psql.query(query);
  }
}

module.exports = new InventoryRepository(); 