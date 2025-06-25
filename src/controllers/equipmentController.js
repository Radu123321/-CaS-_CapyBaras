const equipmentService = require('../services/equipmentService');
const logger = require('../core/logger');

/**
 * Equipment Controller
 * HTTP endpoints for equipment and maintenance management
 */
class EquipmentController {
    
    /**
     * GET /api/equipment
     * Get all equipment with optional filtering
     */
    async getAllEquipment(req, res) {
        try {
            const filters = {
                location_id: req.query.location_id ? parseInt(req.query.location_id) : undefined,
                status: req.query.status,
                manufacturer: req.query.manufacturer
            };
            
            // Remove undefined values
            Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);
            
            const equipment = await equipmentService.getAllEquipment(filters);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: equipment,
                count: equipment.length,
                filters_applied: filters
            }));
        } catch (error) {
            logger.error('Error in getAllEquipment:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }
    
    /**
     * GET /api/equipment/:id
     * Get equipment by ID with detailed information
     */
    async getEquipmentById(req, res) {
        try {
            const equipmentId = parseInt(req.params.id);
            
            if (isNaN(equipmentId)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Invalid equipment ID'
                }));
                return;
            }
            
            const equipment = await equipmentService.getEquipmentById(equipmentId);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: equipment
            }));
        } catch (error) {
            logger.error(`Error in getEquipmentById (${req.params.id}):`, error);
            
            if (error.message === 'Equipment not found') {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: error.message
                }));
                return;
            }
            
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }
    
    /**
     * POST /api/equipment
     * Create new equipment
     */
    async createEquipment(req, res) {
        try {
            const equipmentData = {
                location_id: parseInt(req.body.location_id),
                name: req.body.name,
                status: req.body.status,
                purchased_on: req.body.purchased_on,
                notes: req.body.notes
            };
            
            // Validate required fields
            if (!equipmentData.location_id || !equipmentData.name) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Location ID and name are required'
                }));
                return;
            }
            
            const equipment = await equipmentService.createEquipment(equipmentData);
            
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: equipment,
                message: 'Equipment created successfully'
            }));
        } catch (error) {
            logger.error('Error in createEquipment:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }
    
    /**
     * PUT /api/equipment/:id
     * Update equipment
     */
    async updateEquipment(req, res) {
        try {
            const equipmentId = parseInt(req.params.id);
            
            if (isNaN(equipmentId)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Invalid equipment ID'
                }));
                return;
            }
            
            const updateData = {};
            const allowedFields = ['name', 'status', 'purchased_on', 'notes'];
            
            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                }
            });
            
            if (Object.keys(updateData).length === 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'No valid fields to update'
                }));
                return;
            }
            
            const equipment = await equipmentService.updateEquipment(equipmentId, updateData);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: equipment,
                message: 'Equipment updated successfully'
            }));
        } catch (error) {
            logger.error(`Error in updateEquipment (${req.params.id}):`, error);
            
            if (error.message === 'Equipment not found') {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: error.message
                }));
                return;
            }
            
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }
    
    /**
     * POST /api/equipment/:id/maintenance
     * Schedule maintenance for equipment
     */
    async scheduleMaintenance(req, res) {
        try {
            const equipmentId = parseInt(req.params.id);
            
            if (isNaN(equipmentId)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Invalid equipment ID'
                }));
                return;
            }
            
            const maintenanceData = {
                equipment_id: equipmentId,
                started_at: req.body.started_at,
                ended_at: req.body.ended_at,
                description: req.body.description,
                unplanned: req.body.unplanned || false
            };
            
            if (!maintenanceData.started_at) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Start time is required'
                }));
                return;
            }
            
            const maintenance = await equipmentService.scheduleMaintenance(maintenanceData);
            
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: maintenance,
                message: 'Maintenance scheduled successfully'
            }));
        } catch (error) {
            logger.error(`Error in scheduleMaintenance (${req.params.id}):`, error);
            
            if (error.message === 'Equipment not found') {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: error.message
                }));
                return;
            }
            
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }
    
    /**
     * PUT /api/maintenance/:id/complete
     * Complete maintenance
     */
    async completeMaintenance(req, res) {
        try {
            const maintenanceId = parseInt(req.params.id);
            
            if (isNaN(maintenanceId)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Invalid maintenance ID'
                }));
                return;
            }
            
            const completionData = {
                ended_at: req.body.ended_at || new Date(),
                description: req.body.description
            };
            
            const maintenance = await equipmentService.completeMaintenance(maintenanceId, completionData);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: maintenance,
                message: 'Maintenance completed successfully'
            }));
        } catch (error) {
            logger.error(`Error in completeMaintenance (${req.params.id}):`, error);
            
            if (error.message === 'Maintenance record not found') {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: error.message
                }));
                return;
            }
            
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }
    
    /**
     * POST /api/equipment/check-status
     * Manually trigger equipment status check
     */
    async checkEquipmentStatus(req, res) {
        try {
            const result = await equipmentService.checkEquipmentStatus();
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: result,
                message: 'Equipment status check completed'
            }));
        } catch (error) {
            logger.error('Error in checkEquipmentStatus:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }
    
    /**
     * GET /api/equipment/dashboard
     * Get equipment dashboard summary
     */
    async getDashboard(req, res) {
        try {
            const locationId = req.query.location_id ? parseInt(req.query.location_id) : null;
            
            const summary = await equipmentService.getDashboardSummary(locationId);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: summary
            }));
        } catch (error) {
            logger.error('Error in getDashboard:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }
    
    /**
     * GET /api/equipment/statuses
     * Get available equipment statuses
     */
    async getEquipmentStatuses(req, res) {
        try {
            const statuses = [
                'OPERATIVE',
                'OUT_OF_SERVICE', 
                'UNDER_MAINTENANCE'
            ];
            
            res.json({
                success: true,
                data: statuses
            });
        } catch (error) {
            logger.error('Error in getEquipmentStatuses:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new EquipmentController();
