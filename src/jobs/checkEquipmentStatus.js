const equipmentService = require('../services/equipmentService');
const logger = require('../core/logger');

/**
 * Equipment Status Check Job
 * Automatically monitors equipment status and generates maintenance alerts
 */
class CheckEquipmentStatus {
    
    constructor() {
        this.name = 'checkEquipmentStatus';
        this.description = 'Monitor equipment status and generate maintenance alerts';
    }
    
    /**
     * Execute the equipment status check job
     */
    async execute() {
        try {
            logger.info('CheckEquipmentStatus: Starting equipment monitoring job');
            
            const startTime = Date.now();
            
            // Run equipment status check
            const result = await equipmentService.checkEquipmentStatus();
            
            const duration = Date.now() - startTime;
            
            logger.info(`CheckEquipmentStatus: Job completed in ${duration}ms`, {
                equipment_checked: result.checked,
                alerts_generated: result.alerts_generated,
                duration_ms: duration
            });
            
            return {
                success: true,
                equipment_checked: result.checked,
                alerts_generated: result.alerts_generated,
                duration_ms: duration,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            logger.error('CheckEquipmentStatus: Job failed', error);
            
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    /**
     * Get job configuration
     */
    getConfig() {
        return {
            name: this.name,
            description: this.description,
            schedule: '0 */6 * * *', // Every 6 hours
            enabled: true,
            timeout: 30000, // 30 seconds timeout
            retries: 3
        };
    }
    
    /**
     * Health check for the job
     */
    async healthCheck() {
        try {
            // Simple health check - verify we can access the equipment service
            const summary = await equipmentService.getDashboardSummary();
            
            return {
                healthy: true,
                total_equipment: summary.total_equipment,
                maintenance_alerts: summary.maintenance_alerts,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('CheckEquipmentStatus: Health check failed', error);
            return {
                healthy: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = new CheckEquipmentStatus(); 