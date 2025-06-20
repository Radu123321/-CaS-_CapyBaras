const equipmentRepository = require('../repositories/equipmentRepository');
const alertService = require('./alertService');
const logger = require('../core/logger');

/**
 * Equipment Service
 * Business logic for equipment management and maintenance
 */
class EquipmentService {
    
    // ═══════════════════════════════════════════════════════════════════
    // EQUIPMENT MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Get all equipment with filtering and enrichment
     */
    async getAllEquipment(filters = {}) {
        try {
            const equipment = await equipmentRepository.getAllEquipment(filters);
            
            // Enrich with status analysis
            return equipment.map(item => ({
                ...item,
                status_analysis: this.analyzeEquipmentStatus(item),
                maintenance_status: this.getMaintenanceStatus(item)
            }));
        } catch (error) {
            logger.error('Error getting all equipment:', error);
            throw new Error('Failed to retrieve equipment');
        }
    }
    
    /**
     * Get equipment by ID with detailed analysis
     */
    async getEquipmentById(equipmentId) {
        try {
            const equipment = await equipmentRepository.getEquipmentById(equipmentId);
            if (!equipment) {
                throw new Error('Equipment not found');
            }
            
            // Get maintenance history
            const maintenanceHistory = await equipmentRepository.getMaintenanceHistory(equipmentId, 10);
            
            return {
                ...equipment,
                maintenance_history: maintenanceHistory,
                status_analysis: this.analyzeEquipmentStatus(equipment),
                maintenance_status: this.getMaintenanceStatus(equipment),
                recommendations: await this.getEquipmentRecommendations(equipment)
            };
        } catch (error) {
            logger.error(`Error getting equipment ${equipmentId}:`, error);
            throw error;
        }
    }
    
    /**
     * Create new equipment
     */
    async createEquipment(equipmentData) {
        try {
            // Validate required fields
            if (!equipmentData.location_id || !equipmentData.name) {
                throw new Error('Location ID and name are required');
            }
            
            const equipment = await equipmentRepository.createEquipment(equipmentData);
            
            logger.info(`Equipment created: ${equipment.name} (ID: ${equipment.equipment_id})`);
            
            // Create welcome alert
            await alertService.createAlert({
                location_id: equipment.location_id,
                severity: 'INFO',
                alert_type: 'EQUIPMENT_ADDED',
                title: 'New Equipment Added',
                message: `New equipment "${equipment.name}" has been added to the system`
            });
            
            return equipment;
        } catch (error) {
            logger.error('Error creating equipment:', error);
            throw error;
        }
    }
    
    /**
     * Update equipment
     */
    async updateEquipment(equipmentId, updateData) {
        try {
            const existingEquipment = await equipmentRepository.getEquipmentById(equipmentId);
            if (!existingEquipment) {
                throw new Error('Equipment not found');
            }
            
            const updatedEquipment = await equipmentRepository.updateEquipment(equipmentId, updateData);
            
            // Check for status changes that need alerts
            if (updateData.status && updateData.status !== existingEquipment.status) {
                await this.handleStatusChange(updatedEquipment, existingEquipment.status, updateData.status);
            }
            
            logger.info(`Equipment updated: ${updatedEquipment.name} (ID: ${equipmentId})`);
            return updatedEquipment;
        } catch (error) {
            logger.error(`Error updating equipment ${equipmentId}:`, error);
            throw error;
        }
    }
    
    /**
     * Delete equipment
     */
    async deleteEquipment(equipmentId) {
        try {
            const equipment = await equipmentRepository.getEquipmentById(equipmentId);
            if (!equipment) {
                throw new Error('Equipment not found');
            }
            
            const deletedEquipment = await equipmentRepository.deleteEquipment(equipmentId);
            
            logger.info(`Equipment deleted: ${equipment.name} (ID: ${equipmentId})`);
            
            // Create deletion alert
            await alertService.createAlert({
                location_id: equipment.location_id,
                severity: 'WARNING',
                alert_type: 'EQUIPMENT_REMOVED',
                title: 'Equipment Removed',
                message: `Equipment "${equipment.name}" has been removed from the system`
            });
            
            return deletedEquipment;
        } catch (error) {
            logger.error(`Error deleting equipment ${equipmentId}:`, error);
            throw error;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MAINTENANCE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Schedule maintenance for equipment
     */
    async scheduleMaintenance(maintenanceData) {
        try {
            // Validate required fields
            if (!maintenanceData.equipment_id || !maintenanceData.started_at) {
                throw new Error('Equipment ID and start time are required');
            }
            
            const equipment = await equipmentRepository.getEquipmentById(maintenanceData.equipment_id);
            if (!equipment) {
                throw new Error('Equipment not found');
            }
            
            // Create maintenance record
            const maintenance = await equipmentRepository.createMaintenance(maintenanceData);
            
            // Update equipment status if maintenance is starting now
            if (new Date(maintenanceData.started_at) <= new Date()) {
                await equipmentRepository.updateEquipment(maintenanceData.equipment_id, {
                    status: 'UNDER_MAINTENANCE'
                });
            }
            
            logger.info(`Maintenance scheduled for equipment: ${equipment.name} (ID: ${maintenanceData.equipment_id})`);
            
            // Create maintenance alert
            await alertService.createAlert({
                location_id: equipment.location_id,
                severity: maintenanceData.unplanned ? 'WARNING' : 'INFO',
                alert_type: 'MAINTENANCE_SCHEDULED',
                title: `${maintenanceData.unplanned ? 'Emergency' : 'Scheduled'} Maintenance`,
                message: `Maintenance ${maintenanceData.unplanned ? 'emergency' : 'scheduled'} for equipment "${equipment.name}"`
            });
            
            return maintenance;
        } catch (error) {
            logger.error('Error scheduling maintenance:', error);
            throw error;
        }
    }
    
    /**
     * Complete maintenance
     */
    async completeMaintenance(maintenanceId, completionData) {
        try {
            const maintenance = await equipmentRepository.updateMaintenance(maintenanceId, {
                ended_at: completionData.ended_at || new Date(),
                description: completionData.description
            });
            
            if (!maintenance) {
                throw new Error('Maintenance record not found');
            }
            
            // Get equipment details
            const equipment = await equipmentRepository.getEquipmentById(maintenance.equipment_id);
            
            // Update equipment status back to operative
            await equipmentRepository.updateEquipment(maintenance.equipment_id, {
                status: 'OPERATIVE'
            });
            
            logger.info(`Maintenance completed for equipment: ${equipment.name} (ID: ${maintenance.equipment_id})`);
            
            // Create completion alert
            await alertService.createAlert({
                location_id: equipment.location_id,
                severity: 'INFO',
                alert_type: 'MAINTENANCE_COMPLETED',
                title: 'Maintenance Completed',
                message: `Maintenance completed for equipment "${equipment.name}". Equipment is now operational.`
            });
            
            return maintenance;
        } catch (error) {
            logger.error(`Error completing maintenance ${maintenanceId}:`, error);
            throw error;
        }
    }
    
    /**
     * Get maintenance history with analysis
     */
    async getMaintenanceHistory(equipmentId, limit = 50) {
        try {
            const history = await equipmentRepository.getMaintenanceHistory(equipmentId, limit);
            
            // Add analysis to each maintenance record
            return history.map(record => ({
                ...record,
                duration_hours: this.calculateMaintenanceDuration(record),
                is_overdue: record.ended_at ? false : new Date() > new Date(record.started_at),
                maintenance_type: record.unplanned ? 'Emergency' : 'Scheduled'
            }));
        } catch (error) {
            logger.error(`Error getting maintenance history for equipment ${equipmentId}:`, error);
            throw error;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MONITORING & ANALYSIS
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Check equipment status and generate alerts
     */
    async checkEquipmentStatus() {
        try {
            logger.info('Starting equipment status check...');
            
            // Get equipment needing maintenance
            const needingMaintenance = await equipmentRepository.getEquipmentNeedingMaintenance();
            
            let alertsGenerated = 0;
            
            for (const item of needingMaintenance) {
                await alertService.createAlert({
                    location_id: item.location_id,
                    severity: 'WARNING',
                    alert_type: 'MAINTENANCE_DUE',
                    title: 'Maintenance Due',
                    message: `Equipment "${item.name}" requires maintenance. Last maintenance: ${item.last_maintenance ? new Date(item.last_maintenance).toLocaleDateString() : 'Never'}`
                });
                alertsGenerated++;
            }
            
            logger.info(`Equipment status check completed. Generated ${alertsGenerated} alerts.`);
            return { checked: needingMaintenance.length, alerts_generated: alertsGenerated };
        } catch (error) {
            logger.error('Error checking equipment status:', error);
            throw error;
        }
    }
    
    /**
     * Get equipment dashboard summary
     */
    async getDashboardSummary(locationId = null) {
        try {
            const statusSummary = await equipmentRepository.getEquipmentStatusSummary(locationId);
            const needingMaintenance = await equipmentRepository.getEquipmentNeedingMaintenance();
            
            // Process status summary
            const summary = {
                total_equipment: 0,
                by_status: {
                    OPERATIVE: 0,
                    UNDER_MAINTENANCE: 0,
                    OUT_OF_SERVICE: 0
                },
                by_location: {},
                maintenance_alerts: needingMaintenance.length,
                equipment_needing_maintenance: needingMaintenance
            };
            
            statusSummary.forEach(item => {
                summary.total_equipment += parseInt(item.count);
                summary.by_status[item.status] = (summary.by_status[item.status] || 0) + parseInt(item.count);
                
                if (!summary.by_location[item.location_name]) {
                    summary.by_location[item.location_name] = {
                        total: 0,
                        by_status: {}
                    };
                }
                
                summary.by_location[item.location_name].total += parseInt(item.count);
                summary.by_location[item.location_name].by_status[item.status] = parseInt(item.count);
            });
            
            return summary;
        } catch (error) {
            logger.error('Error getting equipment dashboard summary:', error);
            throw error;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Analyze equipment status
     */
    analyzeEquipmentStatus(equipment) {
        const analysis = {
            operational: equipment.status === 'OPERATIVE',
            needs_attention: false,
            risk_level: 'LOW',
            issues: []
        };
        
        // Check age
        if (equipment.purchased_on) {
            const ageInYears = (new Date() - new Date(equipment.purchased_on)) / (1000 * 60 * 60 * 24 * 365);
            if (ageInYears > 5) {
                analysis.needs_attention = true;
                analysis.risk_level = 'MEDIUM';
                analysis.issues.push('Equipment is over 5 years old');
            }
        }
        
        // Check status
        if (equipment.status === 'OUT_OF_SERVICE') {
            analysis.risk_level = 'HIGH';
            analysis.issues.push('Equipment is out of service');
        } else if (equipment.status === 'UNDER_MAINTENANCE') {
            analysis.risk_level = 'MEDIUM';
            analysis.issues.push('Equipment is under maintenance');
        }
        
        return analysis;
    }
    
    /**
     * Get maintenance status
     */
    getMaintenanceStatus(equipment) {
        const status = {
            last_maintenance: equipment.last_completed_maintenance,
            next_maintenance: equipment.next_scheduled_maintenance,
            overdue: false,
            due_soon: false
        };
        
        if (equipment.next_scheduled_maintenance) {
            const nextDate = new Date(equipment.next_scheduled_maintenance);
            const now = new Date();
            const daysUntil = (nextDate - now) / (1000 * 60 * 60 * 24);
            
            status.overdue = daysUntil < 0;
            status.due_soon = daysUntil >= 0 && daysUntil <= 7;
        }
        
        return status;
    }
    
    /**
     * Get equipment recommendations
     */
    async getEquipmentRecommendations(equipment) {
        const recommendations = [];
        
        // Age-based recommendations
        if (equipment.purchased_on) {
            const ageInYears = (new Date() - new Date(equipment.purchased_on)) / (1000 * 60 * 60 * 24 * 365);
            if (ageInYears > 7) {
                recommendations.push({
                    type: 'REPLACEMENT',
                    priority: 'HIGH',
                    message: 'Consider replacing this equipment due to age'
                });
            } else if (ageInYears > 5) {
                recommendations.push({
                    type: 'MONITORING',
                    priority: 'MEDIUM',
                    message: 'Monitor equipment performance closely'
                });
            }
        }
        
        // Status-based recommendations
        if (equipment.status === 'OUT_OF_SERVICE') {
            recommendations.push({
                type: 'REPAIR',
                priority: 'CRITICAL',
                message: 'Equipment needs immediate repair or replacement'
            });
        }
        
        // Maintenance-based recommendations
        const maintenanceHistory = await equipmentRepository.getMaintenanceHistory(equipment.equipment_id, 5);
        const unplannedCount = maintenanceHistory.filter(m => m.unplanned).length;
        
        if (unplannedCount >= 3) {
            recommendations.push({
                type: 'REPLACEMENT',
                priority: 'HIGH',
                message: 'High number of emergency repairs - consider replacement'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Handle status changes
     */
    async handleStatusChange(equipment, oldStatus, newStatus) {
        const severityMap = {
            'OUT_OF_SERVICE': 'CRITICAL',
            'UNDER_MAINTENANCE': 'WARNING',
            'OPERATIVE': 'INFO'
        };
        
        await alertService.createAlert({
            location_id: equipment.location_id,
            severity: severityMap[newStatus] || 'INFO',
            alert_type: 'EQUIPMENT_STATUS_CHANGE',
            title: 'Equipment Status Changed',
            message: `Equipment "${equipment.name}" status changed from ${oldStatus} to ${newStatus}`
        });
    }
    
    /**
     * Calculate maintenance duration
     */
    calculateMaintenanceDuration(maintenanceRecord) {
        if (!maintenanceRecord.ended_at) {
            // Ongoing maintenance
            return (new Date() - new Date(maintenanceRecord.started_at)) / (1000 * 60 * 60);
        }
        
        return (new Date(maintenanceRecord.ended_at) - new Date(maintenanceRecord.started_at)) / (1000 * 60 * 60);
    }
}

module.exports = new EquipmentService();
