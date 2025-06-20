const weatherService = require('../services/weatherService');
const logger = require('../core/logger');

/**
 * Weather Data Update Job
 * Scheduled job to update weather data for all locations
 */
class UpdateWeatherDataJob {
    
    constructor() {
        this.isRunning = false;
        this.lastRun = null;
        this.runCount = 0;
        this.errors = [];
    }
    
    /**
     * Execute the weather data update job
     */
    async execute() {
        if (this.isRunning) {
            logger.warn('Weather data update job is already running, skipping...');
            return;
        }
        
        this.isRunning = true;
        const startTime = new Date();
        
        try {
            logger.info('Starting weather data update job...');
            
            // Update weather data for all locations
            const updateResult = await weatherService.updateWeatherDataForAllLocations();
            
            // Check for adverse weather conditions
            const adverseResult = await weatherService.checkAdverseWeatherConditions();
            
            this.runCount++;
            this.lastRun = new Date();
            
            const duration = new Date() - startTime;
            
            logger.info(`Weather data update job completed in ${duration}ms`, {
                locations_updated: updateResult.locations_updated,
                adverse_alerts: adverseResult.alerts_generated,
                run_count: this.runCount
            });
            
            return {
                success: true,
                duration,
                locations_updated: updateResult.locations_updated,
                adverse_alerts: adverseResult.alerts_generated,
                run_count: this.runCount,
                last_run: this.lastRun
            };
            
        } catch (error) {
            this.errors.push({
                timestamp: new Date(),
                error: error.message,
                stack: error.stack
            });
            
            // Keep only last 10 errors
            if (this.errors.length > 10) {
                this.errors = this.errors.slice(-10);
            }
            
            logger.error('Weather data update job failed:', error);
            
            return {
                success: false,
                error: error.message,
                run_count: this.runCount,
                last_error: new Date()
            };
            
        } finally {
            this.isRunning = false;
        }
    }
    
    /**
     * Get job status and health information
     */
    getStatus() {
        return {
            name: 'UpdateWeatherDataJob',
            is_running: this.isRunning,
            last_run: this.lastRun,
            run_count: this.runCount,
            error_count: this.errors.length,
            last_errors: this.errors.slice(-3), // Last 3 errors
            health: this.getHealthStatus()
        };
    }
    
    /**
     * Get health status based on recent performance
     */
    getHealthStatus() {
        if (this.errors.length === 0) {
            return 'HEALTHY';
        }
        
        // Check if there are recent errors (last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentErrors = this.errors.filter(error => error.timestamp > oneHourAgo);
        
        if (recentErrors.length > 3) {
            return 'CRITICAL';
        } else if (recentErrors.length > 1) {
            return 'WARNING';
        } else {
            return 'HEALTHY';
        }
    }
    
    /**
     * Reset job statistics
     */
    reset() {
        this.runCount = 0;
        this.errors = [];
        this.lastRun = null;
        logger.info('Weather data update job statistics reset');
    }
}

// Export singleton instance
module.exports = new UpdateWeatherDataJob(); 