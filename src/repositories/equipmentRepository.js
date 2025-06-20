const { query } = require('../core/psql');

/**
 * Equipment Repository
 * Handles all database operations for equipment and maintenance
 */
class EquipmentRepository {
    
    // ═══════════════════════════════════════════════════════════════════
    // EQUIPMENT CRUD OPERATIONS
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Get all equipment with optional filtering
     */
    async getAllEquipment(filters = {}) {
        let sql = `
            SELECT 
                e.*,
                l.name as location_name,
                COUNT(em.maintenance_id) as maintenance_count,
                MAX(em.completed_at) as last_completed_maintenance,
                MIN(CASE WHEN em.status = 'SCHEDULED' THEN em.scheduled_date END) as next_scheduled_maintenance
            FROM equipment e
            LEFT JOIN locations l ON e.location_id = l.location_id
            LEFT JOIN equipment_maintenance em ON e.equipment_id = em.equipment_id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        if (filters.location_id) {
            sql += ` AND e.location_id = $${paramIndex++}`;
            params.push(filters.location_id);
        }
        
        if (filters.status) {
            sql += ` AND e.status = $${paramIndex++}`;
            params.push(filters.status);
        }
        
        if (filters.equipment_type) {
            sql += ` AND e.equipment_type = $${paramIndex++}`;
            params.push(filters.equipment_type);
        }
        
        if (filters.manufacturer) {
            sql += ` AND LOWER(e.manufacturer) LIKE LOWER($${paramIndex++})`;
            params.push(`%${filters.manufacturer}%`);
        }
        
        sql += `
            GROUP BY e.equipment_id, l.name
            ORDER BY e.location_id, e.name
        `;
        
        const result = await query(sql, params);
        return result.rows;
    }
    
    /**
     * Get equipment by ID with detailed information
     */
    async getEquipmentById(equipmentId) {
        const sql = `
            SELECT 
                e.*,
                l.name as location_name,
                l.address as location_address
            FROM equipment e
            LEFT JOIN locations l ON e.location_id = l.location_id
            WHERE e.equipment_id = $1
        `;
        
        const result = await query(sql, [equipmentId]);
        return result.rows[0] || null;
    }
    
    /**
     * Create new equipment
     */
    async createEquipment(equipmentData) {
        const {
            location_id, name, status, purchased_on, notes
        } = equipmentData;
        
        const sql = `
            INSERT INTO equipment (location_id, name, status, purchased_on, notes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        
        const params = [location_id, name, status || 'OPERATIVE', purchased_on, notes];
        
        const result = await query(sql, params);
        return result.rows[0];
    }
    
    /**
     * Update equipment
     */
    async updateEquipment(equipmentId, updateData) {
        const fields = [];
        const params = [];
        let paramIndex = 1;
        
        const allowedFields = ['name', 'status', 'purchased_on', 'notes'];
        
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = $${paramIndex++}`);
                params.push(value);
            }
        }
        
        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }
        
        params.push(equipmentId);
        
        const sql = `
            UPDATE equipment 
            SET ${fields.join(', ')}
            WHERE equipment_id = $${paramIndex}
            RETURNING *
        `;
        
        const result = await query(sql, params);
        return result.rows[0] || null;
    }
    
    /**
     * Delete equipment
     */
    async deleteEquipment(equipmentId) {
        const sql = 'DELETE FROM equipment WHERE equipment_id = $1 RETURNING *';
        const result = await query(sql, [equipmentId]);
        return result.rows[0] || null;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MAINTENANCE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Get maintenance history for equipment
     */
    async getMaintenanceHistory(equipmentId, limit = 50) {
        const sql = `
            SELECT 
                em.*,
                e.name as equipment_name,
                l.name as location_name
            FROM equipment_maintenance em
            JOIN equipment e ON em.equipment_id = e.equipment_id
            JOIN locations l ON e.location_id = l.location_id
            WHERE em.equipment_id = $1
            ORDER BY em.started_at DESC
            LIMIT $2
        `;
        
        const result = await query(sql, [equipmentId, limit]);
        return result.rows;
    }
    
    /**
     * Get all maintenance records with filtering
     */
    async getAllMaintenance(filters = {}) {
        let sql = `
            SELECT 
                em.*,
                e.name as equipment_name,
                e.status as equipment_status,
                l.name as location_name
            FROM equipment_maintenance em
            JOIN equipment e ON em.equipment_id = e.equipment_id
            JOIN locations l ON e.location_id = l.location_id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        if (filters.location_id) {
            sql += ` AND e.location_id = $${paramIndex++}`;
            params.push(filters.location_id);
        }
        
        if (filters.equipment_id) {
            sql += ` AND em.equipment_id = $${paramIndex++}`;
            params.push(filters.equipment_id);
        }
        
        if (filters.unplanned !== undefined) {
            sql += ` AND em.unplanned = $${paramIndex++}`;
            params.push(filters.unplanned);
        }
        
        sql += ` ORDER BY em.started_at DESC`;
        
        if (filters.limit) {
            sql += ` LIMIT $${paramIndex++}`;
            params.push(filters.limit);
        }
        
        const result = await query(sql, params);
        return result.rows;
    }
    
    /**
     * Create maintenance record
     */
    async createMaintenance(maintenanceData) {
        const {
            equipment_id, started_at, ended_at, description, unplanned
        } = maintenanceData;
        
        const sql = `
            INSERT INTO equipment_maintenance (equipment_id, started_at, ended_at, description, unplanned)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        
        const params = [equipment_id, started_at, ended_at, description, unplanned || false];
        
        const result = await query(sql, params);
        return result.rows[0];
    }
    
    /**
     * Update maintenance record
     */
    async updateMaintenance(maintenanceId, updateData) {
        const fields = [];
        const params = [];
        let paramIndex = 1;
        
        const allowedFields = ['ended_at', 'description'];
        
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = $${paramIndex++}`);
                params.push(value);
            }
        }
        
        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }
        
        params.push(maintenanceId);
        
        const sql = `
            UPDATE equipment_maintenance 
            SET ${fields.join(', ')}
            WHERE maint_id = $${paramIndex}
            RETURNING *
        `;
        
        const result = await query(sql, params);
        return result.rows[0] || null;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // ANALYTICS & REPORTING
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Get equipment status summary
     */
    async getEquipmentStatusSummary(locationId = null) {
        let sql = `
            SELECT 
                l.location_id,
                l.name as location_name,
                e.status,
                COUNT(*) as count
            FROM equipment e
            JOIN locations l ON e.location_id = l.location_id
            WHERE 1=1
        `;
        
        const params = [];
        if (locationId) {
            sql += ' AND e.location_id = $1';
            params.push(locationId);
        }
        
        sql += `
            GROUP BY l.location_id, l.name, e.status
            ORDER BY l.name, e.status
        `;
        
        const result = await query(sql, params);
        return result.rows;
    }
    
    /**
     * Get equipment needing maintenance (basic version)
     */
    async getEquipmentNeedingMaintenance() {
        const sql = `
            SELECT 
                e.*,
                l.name as location_name,
                MAX(em.ended_at) as last_maintenance
            FROM equipment e
            JOIN locations l ON e.location_id = l.location_id
            LEFT JOIN equipment_maintenance em ON e.equipment_id = em.equipment_id 
                AND em.ended_at IS NOT NULL
            WHERE e.status = 'OPERATIVE'
            GROUP BY e.equipment_id, l.name
            HAVING MAX(em.ended_at) < NOW() - INTERVAL '90 days' OR MAX(em.ended_at) IS NULL
            ORDER BY last_maintenance ASC NULLS FIRST
        `;
        
        const result = await query(sql);
        return result.rows;
    }
}

module.exports = new EquipmentRepository(); 