const { query } = require('../core/psql');
const log = require('../core/logger');

class StatsRepository {
  // ===== ORDER STATISTICS =====
  
  async getOrdersPerPeriod(locationId = null, period = 'day', startDate = null, endDate = null) {
    try {
      let sql = `
        SELECT 
          DATE_TRUNC($1, o.created_at) as period,
          COUNT(o.order_id) as order_count,
          SUM(o.total_amount) as total_revenue,
          AVG(o.total_amount) as avg_order_value,
          l.name as location_name,
          l.location_id as location_id
        FROM orders o
        JOIN locations l ON o.location_id = l.location_id
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
        GROUP BY DATE_TRUNC($1, o.created_at), l.location_id, l.name
        ORDER BY period DESC, l.name
      `;
      
      const result = await query(sql, params);
      return result;
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
          COUNT(o.order_id) as count,
          ROUND(COUNT(o.order_id) * 100.0 / SUM(COUNT(o.order_id)) OVER(), 2) as percentage,
          l.name as location_name
        FROM orders o
        JOIN locations l ON o.location_id = l.location_id
        WHERE o.created_at >= NOW() - INTERVAL '1 ${period}'
      `;
      
      const params = [];
      if (locationId) {
        sql += ' AND o.location_id = $1';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY o.status, l.location_id, l.name
        ORDER BY count DESC
      `;
      
      const result = await query(sql, params);
      return result;
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
          SUM(rc.quantity_consumed) as total_consumed,
          AVG(rc.quantity_consumed) as avg_per_transaction,
          COUNT(rc.consumption_id) as transaction_count,
          l.name as location_name,
          l.location_id as location_id
        FROM resource_consumption rc
        JOIN resources r ON rc.resource_id = r.resource_id
        JOIN locations l ON rc.location_id = l.location_id
        WHERE rc.consumption_date >= NOW() - INTERVAL '1 ${period}'
      `;
      
      const params = [];
      if (locationId) {
        sql += ' AND rc.location_id = $1';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY r.resource_id, r.name, r.type, l.location_id, l.name
        ORDER BY total_consumed DESC
      `;
      
      const result = await query(sql, params);
      return result;
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
          COALESCE(SUM(ord.quantity_used), 0) as total_consumed,
          COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN ord.quantity_used ELSE 0 END), 0) as efficient_usage,
          CASE 
            WHEN SUM(ord.quantity_used) > 0 THEN 
              ROUND(SUM(CASE WHEN o.status = 'COMPLETED' THEN ord.quantity_used ELSE 0 END) * 100.0 / SUM(ord.quantity_used), 2)
            ELSE 0 
          END as efficiency_percentage,
          l.name as location_name
        FROM resources r
        LEFT JOIN order_resources ord ON r.resource_id = ord.resource_id
        LEFT JOIN orders o ON ord.order_id = o.order_id
        LEFT JOIN locations l ON o.location_id = l.location_id
        WHERE o.created_at >= NOW() - INTERVAL '1 month' OR o.created_at IS NULL
      `;
      
      const params = [];
      if (locationId) {
        sql += ' AND (o.location_id = $1 OR o.location_id IS NULL)';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY r.resource_id, r.name, r.type, l.location_id, l.name
        ORDER BY efficiency_percentage DESC
      `;
      
      const result = await query(sql, params);
      return result;
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
          COUNT(ms.maintenance_id) as maintenance_count,
          COALESCE(MAX(ms.completed_at), e.created_at) as last_maintenance,
          EXTRACT(days FROM (NOW() - COALESCE(MAX(ms.completed_at), e.created_at))) as days_since_maintenance,
          CASE 
            WHEN e.status = 'OPERATIVE' THEN 100
            WHEN e.status = 'MAINTENANCE' THEN 50
            ELSE 0
          END as efficiency_score,
          l.name as location_name
        FROM equipment e
        JOIN locations l ON e.location_id = l.location_id
        LEFT JOIN maintenance_schedules ms ON e.equipment_id = ms.equipment_id AND ms.completed_at IS NOT NULL
      `;
      
      const params = [];
      if (locationId) {
        sql += ' WHERE e.location_id = $1';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY e.equipment_id, e.name, e.type, e.status, e.created_at, l.name
        ORDER BY efficiency_score DESC, age_days ASC
      `;
      
      const result = await query(sql, params);
      return result;
    } catch (error) {
      log.error(`Error getting equipment efficiency: ${error.message}`);
      throw error;
    }
  }
  
  async getMaintenanceTrends(locationId = null, period = 'month') {
    try {
      let sql = `
        SELECT 
          DATE_TRUNC($1, ms.scheduled_date) as period,
          COUNT(ms.maintenance_id) as total_maintenance,
          COUNT(CASE WHEN ms.status = 'COMPLETED' THEN 1 END) as completed_maintenance,
          COUNT(CASE WHEN ms.type = 'PREVENTIVE' THEN 1 END) as preventive_count,
          COUNT(CASE WHEN ms.type = 'CORRECTIVE' THEN 1 END) as corrective_count,
          COUNT(CASE WHEN ms.type = 'EMERGENCY' THEN 1 END) as emergency_count,
          AVG(ms.actual_cost) as avg_cost,
          l.name as location_name
        FROM maintenance_schedules ms
        JOIN equipment e ON ms.equipment_id = e.equipment_id
        JOIN locations l ON e.location_id = l.location_id
        WHERE ms.scheduled_date >= NOW() - INTERVAL '1 ${period}'
      `;
      
      const params = [period];
      if (locationId) {
        sql += ' AND e.location_id = $2';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY DATE_TRUNC($1, ms.scheduled_date), l.location_id, l.name
        ORDER BY period DESC
      `;
      
      const result = await query(sql, params);
      return result;
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
          u.first_name || ' ' || u.last_name as employee_name,
          e.position,
          COUNT(o.order_id) as orders_completed,
          SUM(o.total_amount) as revenue_generated,
          AVG(EXTRACT(EPOCH FROM (o.actual_end_time - o.actual_start_time))/3600) as avg_hours_per_order,
          COUNT(es.shift_id) as shifts_worked,
          SUM(es.total_hours) as total_hours_worked,
          l.name as location_name
        FROM employees e
        JOIN users u ON e.user_id = u.user_id
        JOIN locations l ON e.location_id = l.location_id
        LEFT JOIN orders o ON e.employee_id = o.assigned_employee_id 
          AND o.status = 'COMPLETED' 
          AND o.completed_at >= NOW() - INTERVAL '1 ${period}'
        LEFT JOIN employee_shifts es ON e.employee_id = es.employee_id 
          AND es.status = 'COMPLETED'
          AND es.shift_date >= NOW() - INTERVAL '1 ${period}'
      `;
      
      const params = [];
      if (locationId) {
        sql += ' WHERE e.location_id = $1';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY e.employee_id, u.first_name, u.last_name, e.position, l.location_id, l.name
        ORDER BY orders_completed DESC
      `;
      
      const result = await query(sql, params);
      return result;
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
          wc.weather_type,
          COUNT(o.order_id) as orders_affected,
          AVG(o.total_amount) as avg_order_value,
          SUM(o.total_amount) as total_revenue,
          l.name as location_name
        FROM weather_conditions wc
        JOIN locations l ON wc.location_id = l.location_id
        LEFT JOIN orders o ON wc.location_id = o.location_id 
          AND DATE(o.created_at) = wc.date
        WHERE wc.date >= NOW() - INTERVAL '1 ${period}'
      `;
      
      const params = [];
      if (locationId) {
        sql += ' AND wc.location_id = $1';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY wc.weather_type, l.location_id, l.name
        ORDER BY orders_affected DESC
      `;
      
      const result = await query(sql, params);
      return result;
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
          s.category,
          COUNT(o.order_id) as order_count,
          SUM(o.total_amount) as total_revenue,
          AVG(o.total_amount) as avg_order_value,
          l.name as location_name
        FROM services s
        LEFT JOIN orders o ON s.service_id = o.service_id 
          AND o.created_at >= NOW() - INTERVAL '1 ${period}'
        LEFT JOIN locations l ON o.location_id = l.location_id
      `;
      
      const params = [];
      if (locationId) {
        sql += ' WHERE (o.location_id = $1 OR o.location_id IS NULL)';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY s.service_id, s.name, s.category, l.location_id, l.name
        ORDER BY total_revenue DESC NULLS LAST
      `;
      
      const result = await query(sql, params);
      return result;
    } catch (error) {
      log.error(`Error getting revenue by service: ${error.message}`);
      throw error;
    }
  }
  
  // ===== DASHBOARD SUMMARY =====
  
  async getDashboardSummary(locationId = null) {
    try {
      let sql = `
        SELECT 
          COUNT(o.order_id) as total_orders,
          COUNT(CASE WHEN o.status = 'PENDING' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN o.status = 'IN_PROGRESS' THEN 1 END) as active_orders,
          COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) as completed_orders,
          COALESCE(SUM(o.total_amount), 0) as total_revenue,
          COUNT(DISTINCT o.customer_id) as unique_customers,
          COUNT(DISTINCT e.employee_id) as active_employees,
          COUNT(DISTINCT eq.equipment_id) as total_equipment,
          COUNT(CASE WHEN eq.status = 'OPERATIVE' THEN 1 END) as operative_equipment,
          l.name as location_name
        FROM locations l
        LEFT JOIN orders o ON l.location_id = o.location_id 
          AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
        LEFT JOIN employees e ON l.location_id = e.location_id 
          AND e.is_available = true
        LEFT JOIN equipment eq ON l.location_id = eq.location_id
      `;
      
      const params = [];
      if (locationId) {
        sql += ' WHERE l.location_id = $1';
        params.push(locationId);
      }
      
      sql += `
        GROUP BY l.location_id, l.name
        ORDER BY l.name
      `;
      
      const result = await query(sql, params);
      return result;
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
          COUNT(o.order_id) as total_orders,
          COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) as completed_orders,
          ROUND(COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) * 100.0 / NULLIF(COUNT(o.order_id), 0), 2) as completion_rate,
          COALESCE(AVG(EXTRACT(EPOCH FROM (o.actual_end_time - o.actual_start_time))/3600), 0) as avg_completion_time,
          COALESCE(SUM(o.total_amount), 0) as total_revenue,
          COALESCE(AVG(o.total_amount), 0) as avg_order_value,
          COUNT(DISTINCT o.customer_id) as unique_customers,
          COUNT(DISTINCT e.employee_id) as active_staff
        FROM orders o
        LEFT JOIN employees e ON o.assigned_employee_id = e.employee_id
        WHERE o.created_at >= NOW() - INTERVAL '1 ${period}'
      `;
      
      const params = [];
      if (locationId) {
        sql += ' AND o.location_id = $1';
        params.push(locationId);
      }
      
      const result = await query(sql, params);
      return result && result.length > 0 ? result[0] : {
        total_orders: 0,
        completed_orders: 0,
        completion_rate: 0,
        avg_completion_time: 0,
        total_revenue: 0,
        avg_order_value: 0,
        unique_customers: 0,
        active_staff: 0
      };
    } catch (error) {
      log.error(`Error getting performance KPIs: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new StatsRepository(); 