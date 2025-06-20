const { query } = require('../core/psql');
const log = require('../core/logger');

class StatsRepository {
  // ===== ORDER STATISTICS =====
  
  async getOrdersPerPeriod(locationId = null, period = 'day', startDate = null, endDate = null) {
    try {
      let sql = `
        SELECT 
          DATE_TRUNC($1, o.created_at) as period,
          COUNT(o.id) as order_count,
          SUM(s.price) as total_revenue,
          AVG(s.price) as avg_order_value,
          l.name as location_name,
          l.id as location_id
        FROM orders o
        JOIN services s ON o.service_id = s.id
        JOIN locations l ON o.location_id = l.id
      `;
      
      const params = [period];
      let paramIndex = 2;
      
      if (locationId) {
        sql += ` WHERE o.location_id = $${paramIndex}`;
        params.push(locationId);
        paramIndex++;
      }
      
      if (startDate) {
        sql += locationId ? ' AND' : ' WHERE';
        sql += ` o.created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        sql += (locationId || startDate) ? ' AND' : ' WHERE';
        sql += ` o.created_at <= $${paramIndex}`;
        params.push(endDate);
      }
      
      sql += `
        GROUP BY DATE_TRUNC($1, o.created_at), l.id, l.name
        ORDER BY period DESC, l.name
      `;
      
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      log.error(`Error getting orders per period: ${error.message}`);
      throw error;
    }
  }
  
  async getOrdersByStatus(locationId = null, period = 'month') {
    try {
      let sql = `
        SELECT 
          o.status,
          COUNT(o.id) as count,
          ROUND(COUNT(o.id) * 100.0 / SUM(COUNT(o.id)) OVER(), 2) as percentage,
          l.name as location_name
        FROM orders o
        JOIN locations l ON o.location_id = l.id
        WHERE o.created_at >= NOW() - INTERVAL '1 ${period}'
      `;
      
      const params = [];
      if (locationId) {
        sql += ' AND o.location_id = $1';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY o.status, l.id, l.name
        ORDER BY count DESC
      `;
      
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      log.error(`Error getting orders by status: ${error.message}`);
      throw error;
    }
  }
  
  // ===== RESOURCE CONSUMPTION ANALYTICS =====
  
  async getResourceConsumption(locationId = null, period = 'month') {
    try {
      let sql = `
        SELECT 
          r.name as resource_name,
          r.type as resource_type,
          SUM(it.quantity_used) as total_consumed,
          AVG(it.quantity_used) as avg_per_transaction,
          COUNT(it.id) as transaction_count,
          l.name as location_name,
          l.id as location_id
        FROM inventory_transactions it
        JOIN resources r ON it.resource_id = r.id
        JOIN locations l ON it.location_id = l.id
        WHERE it.transaction_type = 'CONSUME'
          AND it.created_at >= NOW() - INTERVAL '1 ${period}'
      `;
      
      const params = [];
      if (locationId) {
        sql += ' AND it.location_id = $1';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY r.id, r.name, r.type, l.id, l.name
        ORDER BY total_consumed DESC
      `;
      
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      log.error(`Error getting resource consumption: ${error.message}`);
      throw error;
    }
  }
  
  async getResourceEfficiency(locationId = null) {
    try {
      let sql = `
        SELECT 
          r.name as resource_name,
          r.type as resource_type,
          COALESCE(SUM(it.quantity_used), 0) as total_consumed,
          COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN it.quantity_used ELSE 0 END), 0) as efficient_usage,
          CASE 
            WHEN SUM(it.quantity_used) > 0 THEN 
              ROUND(SUM(CASE WHEN o.status = 'COMPLETED' THEN it.quantity_used ELSE 0 END) * 100.0 / SUM(it.quantity_used), 2)
            ELSE 0 
          END as efficiency_percentage,
          l.name as location_name
        FROM resources r
        LEFT JOIN inventory_transactions it ON r.id = it.resource_id AND it.transaction_type = 'CONSUME'
        LEFT JOIN orders o ON it.order_id = o.id
        LEFT JOIN locations l ON it.location_id = l.id
        WHERE it.created_at >= NOW() - INTERVAL '1 month' OR it.created_at IS NULL
      `;
      
      const params = [];
      if (locationId) {
        sql += ' AND (it.location_id = $1 OR it.location_id IS NULL)';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY r.id, r.name, r.type, l.id, l.name
        ORDER BY efficiency_percentage DESC
      `;
      
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      log.error(`Error getting resource efficiency: ${error.message}`);
      throw error;
    }
  }
  
  // ===== EQUIPMENT ANALYTICS =====
  
  async getEquipmentEfficiency(locationId = null) {
    try {
      let sql = `
        SELECT 
          e.name as equipment_name,
          e.type as equipment_type,
          e.status,
          EXTRACT(days FROM (NOW() - e.created_at)) as age_days,
          COUNT(em.id) as maintenance_count,
          COALESCE(MAX(em.completed_at), e.created_at) as last_maintenance,
          EXTRACT(days FROM (NOW() - COALESCE(MAX(em.completed_at), e.created_at))) as days_since_maintenance,
          CASE 
            WHEN e.status = 'OPERATIVE' THEN 100
            WHEN e.status = 'UNDER_MAINTENANCE' THEN 50
            ELSE 0
          END as efficiency_score,
          l.name as location_name
        FROM equipment e
        JOIN locations l ON e.location_id = l.id
        LEFT JOIN equipment_maintenance em ON e.id = em.equipment_id AND em.completed_at IS NOT NULL
      `;
      
      const params = [];
      if (locationId) {
        sql += ' WHERE e.location_id = $1';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY e.id, e.name, e.type, e.status, e.created_at, l.name
        ORDER BY efficiency_score DESC, age_days ASC
      `;
      
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      log.error(`Error getting equipment efficiency: ${error.message}`);
      throw error;
    }
  }
  
  async getMaintenanceTrends(locationId = null, period = 'month') {
    try {
      let sql = `
        SELECT 
          DATE_TRUNC('${period}', em.created_at) as period,
          COUNT(em.id) as maintenance_count,
          COUNT(CASE WHEN em.maintenance_type = 'SCHEDULED' THEN 1 END) as scheduled_count,
          COUNT(CASE WHEN em.maintenance_type = 'EMERGENCY' THEN 1 END) as emergency_count,
          AVG(EXTRACT(days FROM (em.completed_at - em.created_at))) as avg_duration_days,
          l.name as location_name
        FROM equipment_maintenance em
        JOIN equipment e ON em.equipment_id = e.id
        JOIN locations l ON e.location_id = l.id
        WHERE em.created_at >= NOW() - INTERVAL '6 months'
      `;
      
      const params = [];
      if (locationId) {
        sql += ' AND e.location_id = $1';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY DATE_TRUNC('${period}', em.created_at), l.id, l.name
        ORDER BY period DESC
      `;
      
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      log.error(`Error getting maintenance trends: ${error.message}`);
      throw error;
    }
  }
  
  // ===== EMPLOYEE PRODUCTIVITY =====
  
  async getEmployeeProductivity(locationId = null, period = 'month') {
    try {
      let sql = `
        SELECT 
          e.first_name || ' ' || e.last_name as employee_name,
          e.type as employee_type,
          COUNT(o.id) as orders_handled,
          SUM(s.price) as revenue_generated,
          AVG(s.price) as avg_order_value,
          COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) as completed_orders,
          CASE 
            WHEN COUNT(o.id) > 0 THEN 
              ROUND(COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(o.id), 2)
            ELSE 0 
          END as completion_rate,
          l.name as location_name
        FROM employees e
        JOIN locations l ON e.location_id = l.id
        LEFT JOIN orders o ON e.id = o.assigned_employee_id AND o.created_at >= NOW() - INTERVAL '1 ${period}'
        LEFT JOIN services s ON o.service_id = s.id
      `;
      
      const params = [];
      if (locationId) {
        sql += ' WHERE e.location_id = $1';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY e.id, e.first_name, e.last_name, e.type, l.name
        ORDER BY revenue_generated DESC NULLS LAST
      `;
      
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      log.error(`Error getting employee productivity: ${error.message}`);
      throw error;
    }
  }
  
  // ===== WEATHER IMPACT CORRELATION =====
  
  async getWeatherImpactStats(locationId = null, period = 'month') {
    try {
      let sql = `
        SELECT 
          ws.condition,
          ws.temperature,
          ws.humidity,
          ws.wind_speed,
          COUNT(o.id) as order_count,
          AVG(s.price) as avg_order_value,
          SUM(s.price) as total_revenue,
          COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN o.status = 'CANCELLED' THEN 1 END) as cancelled_orders,
          l.name as location_name
        FROM weather_snapshots ws
        JOIN locations l ON ws.location_id = l.id
        LEFT JOIN orders o ON ws.location_id = o.location_id 
          AND DATE(ws.timestamp) = DATE(o.created_at)
          AND o.created_at >= NOW() - INTERVAL '1 ${period}'
        LEFT JOIN services s ON o.service_id = s.id
      `;
      
      const params = [];
      if (locationId) {
        sql += ' WHERE ws.location_id = $1';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY ws.condition, ws.temperature, ws.humidity, ws.wind_speed, l.name
        ORDER BY order_count DESC
      `;
      
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      log.error(`Error getting weather impact stats: ${error.message}`);
      throw error;
    }
  }
  
  // ===== REVENUE ANALYTICS =====
  
  async getRevenueByService(locationId = null, period = 'month') {
    try {
      let sql = `
        SELECT 
          s.name as service_name,
          s.type as service_type,
          s.price as service_price,
          COUNT(o.id) as order_count,
          SUM(s.price) as total_revenue,
          ROUND(SUM(s.price) * 100.0 / SUM(SUM(s.price)) OVER(), 2) as revenue_percentage,
          l.name as location_name
        FROM services s
        LEFT JOIN orders o ON s.id = o.service_id 
          AND o.created_at >= NOW() - INTERVAL '1 ${period}'
          AND o.status = 'COMPLETED'
        LEFT JOIN locations l ON o.location_id = l.id
      `;
      
      const params = [];
      if (locationId) {
        sql += ' WHERE (o.location_id = $1 OR o.location_id IS NULL)';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY s.id, s.name, s.type, s.price, l.name
        ORDER BY total_revenue DESC NULLS LAST
      `;
      
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      log.error(`Error getting revenue by service: ${error.message}`);
      throw error;
    }
  }
  
  // ===== DASHBOARD SUMMARY =====
  
  async getDashboardSummary(locationId = null) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date();
      thisMonth.setDate(1);
      
      let sql = `
        SELECT 
          -- Today's stats
          COUNT(CASE WHEN DATE(o.created_at) = $1 THEN 1 END) as orders_today,
          SUM(CASE WHEN DATE(o.created_at) = $1 AND o.status = 'COMPLETED' THEN s.price ELSE 0 END) as revenue_today,
          
          -- This month's stats
          COUNT(CASE WHEN o.created_at >= $2 THEN 1 END) as orders_this_month,
          SUM(CASE WHEN o.created_at >= $2 AND o.status = 'COMPLETED' THEN s.price ELSE 0 END) as revenue_this_month,
          
          -- Status distribution
          COUNT(CASE WHEN o.status = 'PENDING' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN o.status = 'IN_PROGRESS' THEN 1 END) as in_progress_orders,
          COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN o.status = 'CANCELLED' THEN 1 END) as cancelled_orders,
          
          -- Equipment status
          COUNT(DISTINCT CASE WHEN e.status = 'OPERATIVE' THEN e.id END) as operative_equipment,
          COUNT(DISTINCT CASE WHEN e.status = 'OUT_OF_SERVICE' THEN e.id END) as out_of_service_equipment,
          COUNT(DISTINCT CASE WHEN e.status = 'UNDER_MAINTENANCE' THEN e.id END) as maintenance_equipment,
          
          -- Location info
          l.name as location_name,
          l.id as location_id
        FROM locations l
        LEFT JOIN orders o ON l.id = o.location_id
        LEFT JOIN services s ON o.service_id = s.id
        LEFT JOIN equipment e ON l.id = e.location_id
      `;
      
      const params = [today, thisMonth.toISOString()];
      if (locationId) {
        sql += ' WHERE l.id = $3';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY l.id, l.name
        ORDER BY l.name
      `;
      
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      log.error(`Error getting dashboard summary: ${error.message}`);
      throw error;
    }
  }
  
  // ===== PERFORMANCE KPIs =====
  
  async getPerformanceKPIs(locationId = null, period = 'month') {
    try {
      let sql = `
        SELECT 
          -- Order KPIs
          COUNT(o.id) as total_orders,
          COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) as completed_orders,
          ROUND(COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) * 100.0 / NULLIF(COUNT(o.id), 0), 2) as completion_rate,
          
          -- Revenue KPIs
          SUM(CASE WHEN o.status = 'COMPLETED' THEN s.price ELSE 0 END) as total_revenue,
          AVG(CASE WHEN o.status = 'COMPLETED' THEN s.price END) as avg_order_value,
          
          -- Efficiency KPIs
          AVG(EXTRACT(days FROM (o.updated_at - o.created_at))) as avg_order_duration_days,
          COUNT(DISTINCT e.id) as active_employees,
          ROUND(COUNT(o.id) / NULLIF(COUNT(DISTINCT e.id), 0), 2) as orders_per_employee,
          
          -- Equipment KPIs
          COUNT(DISTINCT eq.id) as total_equipment,
          COUNT(DISTINCT CASE WHEN eq.status = 'OPERATIVE' THEN eq.id END) as operative_equipment,
          ROUND(COUNT(DISTINCT CASE WHEN eq.status = 'OPERATIVE' THEN eq.id END) * 100.0 / NULLIF(COUNT(DISTINCT eq.id), 0), 2) as equipment_uptime,
          
          l.name as location_name
        FROM locations l
        LEFT JOIN orders o ON l.id = o.location_id AND o.created_at >= NOW() - INTERVAL '1 ${period}'
        LEFT JOIN services s ON o.service_id = s.id
        LEFT JOIN employees e ON l.id = e.location_id
        LEFT JOIN equipment eq ON l.id = eq.location_id
      `;
      
      const params = [];
      if (locationId) {
        sql += ' WHERE l.id = $1';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY l.id, l.name
        ORDER BY total_revenue DESC NULLS LAST
      `;
      
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      log.error(`Error getting performance KPIs: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new StatsRepository(); 