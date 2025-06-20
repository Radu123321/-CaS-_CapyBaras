const AlertService = require('../services/alertService');
const log = require('../core/logger');

/**
 * Alert Controller
 * Provides HTTP endpoints for alert management
 * Manual alert triggering, history, testing, and configuration
 */
class AlertController {
    constructor() {
        this.alertService = new AlertService();
    }

    /**
     * GET /api/alerts/test-email
     * Send a test email to verify SMTP configuration
     */
    async sendTestEmail(req, res) {
        try {
            const { recipients } = req.query;
            const recipientList = recipients ? recipients.split(',').map(email => email.trim()) : null;

            const result = await this.alertService.sendTestEmail(recipientList);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Test email sent successfully',
                result
            }));

        } catch (error) {
            log.error(`Failed to send test email: ${error.message}`);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * POST /api/alerts/equipment-failure
     * Manually trigger equipment failure alert
     */
    async triggerEquipmentFailureAlert(req, res) {
        try {
            const { equipmentData, locationData, options = {} } = req.body;

            if (!equipmentData || !locationData) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Equipment data and location data are required'
                }));
                return;
            }

            const result = await this.alertService.sendEquipmentFailureAlert(
                equipmentData, 
                locationData, 
                options
            );

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Equipment failure alert sent',
                result
            }));

        } catch (error) {
            log.error(`Failed to send equipment failure alert: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * POST /api/alerts/staff-unavailable
     * Manually trigger staff unavailability alert
     */
    async triggerStaffUnavailabilityAlert(req, res) {
        try {
            const { employeeData, locationData, options = {} } = req.body;

            if (!employeeData || !locationData) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Employee data and location data are required'
                }));
                return;
            }

            const result = await this.alertService.sendStaffUnavailabilityAlert(
                employeeData, 
                locationData, 
                options
            );

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Staff unavailability alert sent',
                result
            }));

        } catch (error) {
            log.error(`Failed to send staff unavailability alert: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * POST /api/alerts/power-outage
     * Manually trigger power outage alert
     */
    async triggerPowerOutageAlert(req, res) {
        try {
            const { locationData, options = {} } = req.body;

            if (!locationData) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Location data is required'
                }));
                return;
            }

            const result = await this.alertService.sendPowerOutageAlert(locationData, options);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Power outage alert sent',
                result
            }));

        } catch (error) {
            log.error(`Failed to send power outage alert: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * POST /api/alerts/critical-inventory
     * Manually trigger critical inventory alert
     */
    async triggerCriticalInventoryAlert(req, res) {
        try {
            const { resourceData, locationData, inventoryData, options = {} } = req.body;

            if (!resourceData || !locationData || !inventoryData) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Resource data, location data, and inventory data are required'
                }));
                return;
            }

            const result = await this.alertService.sendCriticalInventoryAlert(
                resourceData, 
                locationData, 
                inventoryData, 
                options
            );

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Critical inventory alert sent',
                result
            }));

        } catch (error) {
            log.error(`Failed to send critical inventory alert: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * POST /api/alerts/transport-delay
     * Manually trigger transport delay alert
     */
    async triggerTransportDelayAlert(req, res) {
        try {
            const { orderData, transportData, options = {} } = req.body;

            if (!orderData || !transportData) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Order data and transport data are required'
                }));
                return;
            }

            const result = await this.alertService.sendTransportDelayAlert(
                orderData, 
                transportData, 
                options
            );

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Transport delay alert sent',
                result
            }));

        } catch (error) {
            log.error(`Failed to send transport delay alert: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * POST /api/alerts/maintenance-due
     * Manually trigger maintenance due alert
     */
    async triggerMaintenanceDueAlert(req, res) {
        try {
            const { equipmentData, locationData, options = {} } = req.body;

            if (!equipmentData || !locationData) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Equipment data and location data are required'
                }));
                return;
            }

            const result = await this.alertService.sendMaintenanceDueAlert(
                equipmentData, 
                locationData, 
                options
            );

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Maintenance due alert sent',
                result
            }));

        } catch (error) {
            log.error(`Failed to send maintenance due alert: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * GET /api/alerts/history
     * Get alert history
     */
    async getAlertHistory(req, res) {
        try {
            const { limit = 50 } = req.query;
            const history = this.alertService.getAlertHistory(parseInt(limit));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: history,
                total: history.length
            }));

        } catch (error) {
            log.error(`Failed to get alert history: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * GET /api/alerts/stats
     * Get delivery statistics
     */
    async getDeliveryStats(req, res) {
        try {
            const stats = this.alertService.getDeliveryStats();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: stats
            }));

        } catch (error) {
            log.error(`Failed to get delivery stats: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * GET /api/alerts/:alertId
     * Get specific alert by ID
     */
    async getAlert(req, res) {
        try {
            const { alertId } = req.params;
            const alert = this.alertService.getAlert(alertId);

            if (!alert) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Alert not found'
                }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: alert
            }));

        } catch (error) {
            log.error(`Failed to get alert: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * DELETE /api/alerts/history
     * Clear old alerts from history
     */
    async clearOldAlerts(req, res) {
        try {
            const { hours = 24 } = req.query;
            const cleared = this.alertService.clearOldAlerts(parseInt(hours));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: `Cleared ${cleared} old alerts`,
                cleared
            }));

        } catch (error) {
            log.error(`Failed to clear old alerts: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * GET /api/alerts/test-smtp
     * Test SMTP connection
     */
    async testSMTPConnection(req, res) {
        try {
            const result = await this.alertService.testSMTPConnection();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                result
            }));

        } catch (error) {
            log.error(`SMTP connection test failed: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * GET /api/alerts/types
     * Get available alert types
     */
    async getAvailableAlertTypes(req, res) {
        try {
            const types = this.alertService.getAvailableAlertTypes();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: types
            }));

        } catch (error) {
            log.error(`Failed to get alert types: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * GET /api/alerts/config
     * Get alert service configuration
     */
    async getConfiguration(req, res) {
        try {
            const config = this.alertService.getConfiguration();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: config
            }));

        } catch (error) {
            log.error(`Failed to get configuration: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    /**
     * POST /api/alerts/config
     * Update alert service configuration
     */
    async updateConfiguration(req, res) {
        try {
            const newConfig = req.body;
            this.alertService.updateConfiguration(newConfig);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Configuration updated successfully'
            }));

        } catch (error) {
            log.error(`Failed to update configuration: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }
}

// Create controller instance
const alertController = new AlertController();

// Export controller methods
module.exports = {
    sendTestEmail: alertController.sendTestEmail.bind(alertController),
    triggerEquipmentFailureAlert: alertController.triggerEquipmentFailureAlert.bind(alertController),
    triggerStaffUnavailabilityAlert: alertController.triggerStaffUnavailabilityAlert.bind(alertController),
    triggerPowerOutageAlert: alertController.triggerPowerOutageAlert.bind(alertController),
    triggerCriticalInventoryAlert: alertController.triggerCriticalInventoryAlert.bind(alertController),
    triggerTransportDelayAlert: alertController.triggerTransportDelayAlert.bind(alertController),
    triggerMaintenanceDueAlert: alertController.triggerMaintenanceDueAlert.bind(alertController),
    getAlertHistory: alertController.getAlertHistory.bind(alertController),
    getDeliveryStats: alertController.getDeliveryStats.bind(alertController),
    getAlert: alertController.getAlert.bind(alertController),
    clearOldAlerts: alertController.clearOldAlerts.bind(alertController),
    testSMTPConnection: alertController.testSMTPConnection.bind(alertController),
    getAvailableAlertTypes: alertController.getAvailableAlertTypes.bind(alertController),
    getConfiguration: alertController.getConfiguration.bind(alertController),
    updateConfiguration: alertController.updateConfiguration.bind(alertController)
}; 