const Base = require('./_base');
const pool = require('../core/psql');

/**
 * Equipment Repository
 * Handles all database operations for equipment and maintenance
 */
class EquipmentRepository extends Base {
    constructor() {
        super('equipment');
    }

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
                b.name as branch_name,
                COUNT(ms.id) as maintenance_count,
                MAX(ms.completed_at) as last_completed_maintenance,
                MIN(CASE WHEN ms.status = 'PENDING' THEN ms.due_at END) as next_scheduled_maintenance
            FROM equipment e
            LEFT JOIN branches b ON e.branch_id = b.id
            LEFT JOIN maintenance_tasks ms ON e.id = ms.equipment_id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        if (filters.branch_id || filters.location_id) {
            sql += ` AND e.branch_id = $${paramIndex++}`;
            params.push(filters.branch_id || filters.location_id);
        }
        
        if (filters.status) {
            sql += ` AND e.status = $${paramIndex++}`;
            params.push(filters.status);
        }
        
        if (filters.type_code || filters.type) {
            sql += ` AND e.type_code = $${paramIndex++}`;
            params.push(filters.type_code || filters.type);
        }
        
        if (filters.name) {
            sql += ` AND LOWER(e.name) LIKE LOWER($${paramIndex++})`;
            params.push(`%${filters.name}%`);
        }
        
        sql += `
            GROUP BY e.id, b.name
            ORDER BY e.branch_id, e.name
        `;
        
        const result = await pool.query(sql, params);
        return result.rows;
    }
    
    /**
     * Get equipment by ID with detailed information
     */
    async getEquipmentById(equipmentId) {
        const sql = `
            SELECT 
                e.*,
                b.name as branch_name,
                b.address as branch_address
            FROM equipment e
            LEFT JOIN branches b ON e.branch_id = b.id
            WHERE e.id = $1
        `;
        
        const result = await pool.query(sql, [equipmentId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    
    /**
     * Create new equipment
     */
    async createEquipment(equipmentData) {
        const {
            branch_id, name, type_code, status, purchase_date, notes
        } = equipmentData;
        
        const sql = `
            INSERT INTO equipment (branch_id, name, type_code, status, purchase_date, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        
        const params = [branch_id, name, type_code, status || 'OPERATIONAL', purchase_date, notes];
        
        const result = await pool.query(sql, params);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    
    /**
     * Update equipment
     */
    async updateEquipment(equipmentId, updateData) {
        const fields = [];
        const params = [];
        let paramIndex = 1;
        
        const allowedFields = ['name', 'type_code', 'status', 'purchase_date', 'notes'];
        
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
            WHERE id = $${paramIndex}
            RETURNING *
        `;
        
        const result = await pool.query(sql, params);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    
    /**
     * Delete equipment
     */
    async deleteEquipment(equipmentId) {
        const sql = 'DELETE FROM equipment WHERE id = $1 RETURNING *';
        const result = await pool.query(sql, [equipmentId]);
        return result.rows.length > 0 ? result.rows[0] : null;
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
                ms.*,
                e.name as equipment_name,
                b.name as branch_name
            FROM maintenance_tasks ms
            JOIN equipment e ON ms.equipment_id = e.id
            JOIN branches b ON e.branch_id = b.id
            WHERE ms.equipment_id = $1
            ORDER BY ms.due_at DESC
            LIMIT $2
        `;
        
        const result = await pool.query(sql, [equipmentId, limit]);
        return result.rows || [];
    }
    
    /**
     * Get all maintenance records with filtering
     */
    async getAllMaintenance(filters = {}) {
        let sql = `
            SELECT 
                ms.*,
                e.name as equipment_name,
                e.status as equipment_status,
                b.name as branch_name
            FROM maintenance_tasks ms
            JOIN equipment e ON ms.equipment_id = e.id
            JOIN branches b ON e.branch_id = b.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        if (filters.branch_id || filters.location_id) {
            sql += ` AND e.branch_id = $${paramIndex++}`;
            params.push(filters.branch_id || filters.location_id);
        }
        
        if (filters.equipment_id) {
            sql += ` AND ms.equipment_id = $${paramIndex++}`;
            params.push(filters.equipment_id);
        }
        
        if (filters.type_code || filters.type) {
            sql += ` AND ms.type = $${paramIndex++}`;
            params.push(filters.type_code || filters.type);
        }
        
        sql += ` ORDER BY ms.due_at DESC`;
        
        if (filters.limit) {
            sql += ` LIMIT $${paramIndex++}`;
            params.push(filters.limit);
        }
        
        const result = await pool.query(sql, params);
        return result.rows || [];
    }
    
    /**
     * Create maintenance record
     */
    async createMaintenance(maintenanceData) {
        const { equipment_id, due_at, task_desc } = maintenanceData;
        
        const sql = `
            INSERT INTO maintenance_tasks (equipment_id, due_at, task_desc, mandatory, status)
            VALUES ($1, $2, $3, true, 'PENDING')
            RETURNING *
        `;
        
        const params = [equipment_id, due_at, task_desc || 'Scheduled maintenance'];
        
        const result = await pool.query(sql, params);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    
    /**
     * Update maintenance record
     */
    async updateMaintenance(maintenanceId, updateData) {
        const fields = [];
        const params = [];
        let paramIndex = 1;
        
        const allowedFields = ['status', 'completed_at', 'actual_cost', 'notes'];
        
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
            UPDATE maintenance_tasks 
            SET ${fields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;
        
        const result = await pool.query(sql, params);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // ANALYTICS & REPORTING
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Get equipment status summary
     */
    async getEquipmentStatusSummary(branchId = null) {
        let sql = `
            SELECT 
                b.id as branch_id,
                b.name as branch_name,
                e.status,
                COUNT(*) as count
            FROM equipment e
            JOIN branches b ON e.branch_id = b.id
            WHERE 1=1
        `;
        
        const params = [];
        if (branchId) {
            sql += ' AND e.branch_id = $1';
            params.push(branchId);
        }
        
        sql += `
            GROUP BY b.id, b.name, e.status
            ORDER BY b.name, e.status
        `;
        
        const result = await pool.query(sql, params);
        return result.rows || [];
    }
    
    /**
     * Get equipment needing maintenance (using v2.0 schema)
     */
    async getEquipmentNeedingMaintenance() {
        const sql = `
            SELECT 
                e.*,
                b.name as branch_name,
                MAX(ms.completed_at) as last_maintenance
            FROM equipment e
            JOIN branches b ON e.branch_id = b.id
            LEFT JOIN maintenance_tasks ms ON e.id = ms.equipment_id 
                AND ms.completed_at IS NOT NULL
            WHERE e.status = 'OPERATIONAL'
            GROUP BY e.id, b.name
            HAVING MAX(ms.completed_at) < NOW() - INTERVAL '90 days' OR MAX(ms.completed_at) IS NULL
            ORDER BY MAX(ms.completed_at) ASC NULLS FIRST
        `;
        
        const result = await pool.query(sql);
        return result.rows || [];
    }

    // list global or by branch
    list(branchId = null) {
        return pool.query(
            `SELECT e.*, b.name AS branch_name, t.description AS type_desc
               FROM equipment e
               JOIN branches b ON b.id = e.branch_id
               LEFT JOIN equipment_types t ON t.code = e.type_code
              WHERE ($1::int IS NULL OR e.branch_id=$1)
              ORDER BY e.id`, [branchId]
        ).then(r => r.rows);
    }

    async create(eq) {
        const cols = `branch_id,type_code,name,model,serial_no,purchase_date,warranty_until,status,usage_unit_code,notes`;
        const vals = [
            eq.branchId, eq.typeCode, eq.name, eq.model, eq.serialNo,
            eq.purchaseDate, eq.warrantyUntil, eq.status || 'OPERATIONAL',
            eq.usageUnitCode || 'h', eq.notes
        ];
        return this.insert(cols, vals);
    }

    updateStatus(id, status, notes = '') {
        return this.patch(id, 'status=$2, notes=$3', [status, notes]);
    }
}

module.exports = new EquipmentRepository(); 