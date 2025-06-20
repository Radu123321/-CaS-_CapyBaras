const SMTPClient = require('../core/smtpClient');
const EmailTemplates = require('../core/emailTemplates');
const log = require('../core/logger');

/**
 * Enhanced Alert Service
 * Handles multi-channel notifications: Email + WebSocket + RSS
 * Supports alert prioritization and delivery status tracking
 */
class AlertService {
    constructor() {
        this.emailTemplates = new EmailTemplates();
        this.smtpClient = null;
        this.config = this._loadConfiguration();
        this.alertHistory = new Map(); // In-memory alert tracking
        this.deliveryStats = {
            emailsSent: 0,
            emailsFailed: 0,
            alertsTriggered: 0
        };
        
        this._initializeSMTP();
    }

    /**
     * Load configuration from environment variables
     */
    _loadConfiguration() {
        return {
            smtp: {
                host: process.env.SMTP_HOST || 'localhost',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_PORT === '465',
                auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                } : null
            },
            alerts: {
                emailEnabled: process.env.ALERT_EMAIL_ENABLED !== 'false',
                websocketEnabled: process.env.ALERT_WEBSOCKET_ENABLED !== 'false',
                rssEnabled: process.env.ALERT_RSS_ENABLED !== 'false',
                defaultRecipients: process.env.ALERT_DEFAULT_RECIPIENTS ? 
                    process.env.ALERT_DEFAULT_RECIPIENTS.split(',') : [],
                retryAttempts: parseInt(process.env.ALERT_RETRY_ATTEMPTS) || 3
            },
            from: process.env.SMTP_FROM || 'noreply@cas-system.com'
        };
    }

    /**
     * Initialize SMTP client
     */
    _initializeSMTP() {
        if (this.config.alerts.emailEnabled && this.config.smtp.auth) {
            this.smtpClient = new SMTPClient(this.config.smtp);
            log.info('AlertService: SMTP client initialized');
        } else {
            log.warn('AlertService: SMTP not configured - email alerts disabled');
        }
    }

    /**
     * Send equipment failure alert
     */
    async sendEquipmentFailureAlert(equipmentData, locationData, options = {}) {
        const alertData = {
            type: 'equipmentFailure',
            priority: 'HIGH',
            equipmentName: equipmentData.name || 'Unknown Equipment',
            equipmentStatus: equipmentData.status || 'OUT_OF_SERVICE',
            locationName: locationData.name || 'Unknown Location',
            errorDescription: options.errorDescription || 'Equipment malfunction detected',
            ...options
        };

        return await this._sendMultiChannelAlert(alertData);
    }

    /**
     * Send staff unavailability alert
     */
    async sendStaffUnavailabilityAlert(employeeData, locationData, options = {}) {
        const alertData = {
            type: 'staffUnavailable',
            priority: 'MEDIUM',
            employeeName: employeeData.full_name || 'Unknown Employee',
            jobTitle: employeeData.job_title || 'Employee',
            locationName: locationData.name || 'Unknown Location',
            shiftTime: options.shiftTime || 'Current shift',
            unavailabilityReason: options.reason || 'Unspecified',
            ...options
        };

        return await this._sendMultiChannelAlert(alertData);
    }

    /**
     * Send power outage alert
     */
    async sendPowerOutageAlert(locationData, options = {}) {
        const alertData = {
            type: 'powerOutage',
            priority: 'HIGH',
            locationName: locationData.name || 'Unknown Location',
            ...options
        };

        return await this._sendMultiChannelAlert(alertData);
    }

    /**
     * Send critical inventory alert
     */
    async sendCriticalInventoryAlert(resourceData, locationData, inventoryData, options = {}) {
        const alertData = {
            type: 'criticalInventory',
            priority: inventoryData.quantity <= 0 ? 'HIGH' : 'MEDIUM',
            resourceName: resourceData.name || 'Unknown Resource',
            locationName: locationData.name || 'Unknown Location',
            currentQuantity: inventoryData.quantity || 0,
            unit: resourceData.unit || 'units',
            stockStatus: inventoryData.quantity <= 0 ? 'OUT OF STOCK' : 'LOW STOCK',
            ...options
        };

        return await this._sendMultiChannelAlert(alertData);
    }

    /**
     * Send transport delay alert
     */
    async sendTransportDelayAlert(orderData, transportData, options = {}) {
        const alertData = {
            type: 'transportDelay',
            priority: 'MEDIUM',
            orderId: orderData.order_id || 'Unknown',
            driverName: transportData.driver_name || 'Unknown Driver',
            delayReason: options.delayReason || 'Unspecified delay',
            ...options
        };

        return await this._sendMultiChannelAlert(alertData);
    }

    /**
     * Send maintenance due alert
     */
    async sendMaintenanceDueAlert(equipmentData, locationData, options = {}) {
        const alertData = {
            type: 'maintenanceDue',
            priority: 'LOW',
            equipmentName: equipmentData.name || 'Unknown Equipment',
            locationName: locationData.name || 'Unknown Location',
            dueDate: options.dueDate || 'Soon',
            ...options
        };

        return await this._sendMultiChannelAlert(alertData);
    }

    /**
     * Send system test email
     */
    async sendTestEmail(recipients = null, options = {}) {
        const alertData = {
            type: 'systemTest',
            priority: 'LOW',
            ...options
        };

        const testRecipients = recipients || this.config.alerts.defaultRecipients;
        if (!testRecipients || testRecipients.length === 0) {
            throw new Error('No recipients specified for test email');
        }

        return await this._sendEmailAlert(alertData, testRecipients);
    }

    /**
     * Multi-channel alert sending
     */
    async _sendMultiChannelAlert(alertData) {
        const alertId = this._generateAlertId();
        const results = {
            alertId,
            timestamp: new Date(),
            type: alertData.type,
            priority: alertData.priority,
            channels: {}
        };

        // Store alert in history
        this.alertHistory.set(alertId, {
            ...alertData,
            timestamp: results.timestamp,
            status: 'PROCESSING'
        });

        this.deliveryStats.alertsTriggered++;

        try {
            // Send email alert
            if (this.config.alerts.emailEnabled) {
                try {
                    const emailResult = await this._sendEmailAlert(alertData);
                    results.channels.email = { success: true, ...emailResult };
                } catch (error) {
                    results.channels.email = { success: false, error: error.message };
                    log.error(`Failed to send email alert: ${error.message}`);
                }
            }

            // Send WebSocket alert
            if (this.config.alerts.websocketEnabled) {
                try {
                    const wsResult = await this._sendWebSocketAlert(alertData);
                    results.channels.websocket = { success: true, ...wsResult };
                } catch (error) {
                    results.channels.websocket = { success: false, error: error.message };
                    log.error(`Failed to send WebSocket alert: ${error.message}`);
                }
            }

            // Update RSS feeds
            if (this.config.alerts.rssEnabled) {
                try {
                    const rssResult = await this._updateRSSFeeds(alertData);
                    results.channels.rss = { success: true, ...rssResult };
                } catch (error) {
                    results.channels.rss = { success: false, error: error.message };
                    log.error(`Failed to update RSS feeds: ${error.message}`);
                }
            }

            // Update alert status
            const alert = this.alertHistory.get(alertId);
            alert.status = 'COMPLETED';
            alert.results = results;

            log.info(`Alert ${alertId} sent via multiple channels: ${Object.keys(results.channels).join(', ')}`);
            return results;

        } catch (error) {
            const alert = this.alertHistory.get(alertId);
            alert.status = 'FAILED';
            alert.error = error.message;
            
            log.error(`Failed to send multi-channel alert: ${error.message}`);
            throw error;
        }
    }

    /**
     * Send email alert
     */
    async _sendEmailAlert(alertData, customRecipients = null) {
        if (!this.smtpClient) {
            throw new Error('SMTP client not configured');
        }

        const recipients = customRecipients || this.config.alerts.defaultRecipients;
        if (!recipients || recipients.length === 0) {
            throw new Error('No email recipients configured');
        }

        try {
            // Generate email content
            const emailContent = this.emailTemplates.generateEmail(alertData.type, alertData);
            
            // Prepare mail options
            const mailOptions = {
                from: this.config.from,
                to: recipients,
                subject: emailContent.subject,
                text: emailContent.text,
                html: emailContent.html
            };

            // Send email
            const result = await this.smtpClient.sendMail(mailOptions);
            
            this.deliveryStats.emailsSent++;
            log.info(`Email alert sent successfully to ${recipients.length} recipients`);
            
            return {
                recipients: recipients.length,
                messageId: result.messageId,
                deliveredAt: new Date()
            };

        } catch (error) {
            this.deliveryStats.emailsFailed++;
            log.error(`Failed to send email alert: ${error.message}`);
            throw error;
        }
    }

    /**
     * Send WebSocket alert
     */
    async _sendWebSocketAlert(alertData) {
        try {
            // Import WebSocket controller dynamically to avoid circular dependencies
            const { broadcastToAll, broadcastToLocation } = require('../controllers/websocketController');
            
            const wsMessage = {
                type: 'alert',
                alertType: alertData.type,
                priority: alertData.priority,
                timestamp: new Date().toISOString(),
                data: alertData
            };

            let sentCount = 0;

            // Send to specific location if available
            if (alertData.locationId) {
                sentCount += broadcastToLocation(alertData.locationId, wsMessage);
            }

            // Send critical alerts to all clients
            if (alertData.priority === 'HIGH') {
                sentCount += broadcastToAll(wsMessage);
            }

            log.info(`WebSocket alert sent to ${sentCount} clients`);
            return { clientsNotified: sentCount };

        } catch (error) {
            log.error(`Failed to send WebSocket alert: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update RSS feeds with alert
     */
    async _updateRSSFeeds(alertData) {
        try {
            // RSS feeds are automatically updated when accessed
            // This is a placeholder for future RSS feed caching/updating logic
            log.info('RSS feeds will be updated on next access');
            return { updated: true };
        } catch (error) {
            log.error(`Failed to update RSS feeds: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get alert history
     */
    getAlertHistory(limit = 50) {
        const alerts = Array.from(this.alertHistory.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);

        return alerts;
    }

    /**
     * Get delivery statistics
     */
    getDeliveryStats() {
        return {
            ...this.deliveryStats,
            alertHistory: this.alertHistory.size,
            successRate: this.deliveryStats.alertsTriggered > 0 ? 
                ((this.deliveryStats.emailsSent / this.deliveryStats.alertsTriggered) * 100).toFixed(2) + '%' : 'N/A'
        };
    }

    /**
     * Get alert by ID
     */
    getAlert(alertId) {
        return this.alertHistory.get(alertId);
    }

    /**
     * Clear old alerts from history
     */
    clearOldAlerts(olderThanHours = 24) {
        const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
        let cleared = 0;

        for (const [alertId, alert] of this.alertHistory.entries()) {
            if (alert.timestamp < cutoffTime) {
                this.alertHistory.delete(alertId);
                cleared++;
            }
        }

        log.info(`Cleared ${cleared} old alerts from history`);
        return cleared;
    }

    /**
     * Test SMTP connection
     */
    async testSMTPConnection() {
        if (!this.smtpClient) {
            throw new Error('SMTP client not configured');
        }

        try {
            // Create a minimal test connection
            await this.smtpClient._connect();
            await this.smtpClient._authenticate();
            await this.smtpClient._quit();
            
            log.info('SMTP connection test successful');
            return { success: true, message: 'SMTP connection successful' };
        } catch (error) {
            log.error(`SMTP connection test failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get available alert types
     */
    getAvailableAlertTypes() {
        return this.emailTemplates.getAvailableTemplates();
    }

    /**
     * Update configuration
     */
    updateConfiguration(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        if (newConfig.smtp) {
            this._initializeSMTP();
        }
        
        log.info('AlertService configuration updated');
    }

    /**
     * Utility methods
     */
    _generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get configuration (without sensitive data)
     */
    getConfiguration() {
        const config = { ...this.config };
        if (config.smtp && config.smtp.auth) {
            config.smtp.auth = { user: config.smtp.auth.user, pass: '[HIDDEN]' };
        }
        return config;
    }
}

module.exports = AlertService; 