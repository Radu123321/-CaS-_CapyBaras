const log = require('./logger');

/**
 * Email Template Engine
 * Provides HTML/Text templates for all alert types
 * Supports variable substitution and proper formatting
 */
class EmailTemplates {
    constructor() {
        this.templates = {
            // Equipment failure alerts
            equipmentFailure: {
                subject: '🚨 URGENT: Equipment Failure at {{locationName}}',
                html: this._getEquipmentFailureHTML(),
                text: this._getEquipmentFailureText()
            },
            
            // Staff unavailability alerts
            staffUnavailable: {
                subject: '⚠️ Staff Unavailability Alert - {{locationName}}',
                html: this._getStaffUnavailableHTML(),
                text: this._getStaffUnavailableText()
            },
            
            // Power outage alerts
            powerOutage: {
                subject: '🔌 Power Outage Alert - {{locationName}}',
                html: this._getPowerOutageHTML(),
                text: this._getPowerOutageText()
            },
            
            // Critical inventory alerts
            criticalInventory: {
                subject: '📦 Critical Inventory Alert - {{resourceName}}',
                html: this._getCriticalInventoryHTML(),
                text: this._getCriticalInventoryText()
            },
            
            // Transport delay alerts
            transportDelay: {
                subject: '🚚 Transport Delay Alert - Order #{{orderId}}',
                html: this._getTransportDelayHTML(),
                text: this._getTransportDelayText()
            },
            
            // Equipment maintenance alerts
            maintenanceDue: {
                subject: '🔧 Maintenance Due - {{equipmentName}}',
                html: this._getMaintenanceDueHTML(),
                text: this._getMaintenanceDueText()
            },
            
            // System test email
            systemTest: {
                subject: '✅ CaS System Test Email',
                html: this._getSystemTestHTML(),
                text: this._getSystemTestText()
            }
        };
    }

    /**
     * Generate email content for specific alert type
     */
    generateEmail(alertType, variables = {}) {
        const template = this.templates[alertType];
        if (!template) {
            throw new Error(`Email template not found for alert type: ${alertType}`);
        }

        // Add common variables
        const allVariables = {
            timestamp: new Date().toLocaleString('ro-RO', { 
                timeZone: 'Europe/Bucharest',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }),
            systemName: 'CaS - Cleaning Web Simulator',
            supportEmail: 'support@cas-system.com',
            dashboardUrl: 'http://localhost:8000/dashboard.html',
            ...variables
        };

        try {
            return {
                subject: this._substituteVariables(template.subject, allVariables),
                html: this._substituteVariables(template.html, allVariables),
                text: this._substituteVariables(template.text, allVariables)
            };
        } catch (error) {
            log.error(`Failed to generate email template for ${alertType}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get available template types
     */
    getAvailableTemplates() {
        return Object.keys(this.templates);
    }

    /**
     * Variable substitution
     */
    _substituteVariables(template, variables) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return variables[key] !== undefined ? variables[key] : match;
        });
    }

    /**
     * Equipment Failure Templates
     */
    _getEquipmentFailureHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Equipment Failure Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background: #6c757d; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .alert-box { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 URGENT: Equipment Failure</h1>
            <p>Immediate attention required</p>
        </div>
        <div class="content">
            <div class="alert-box">
                <strong>Equipment Failure Detected!</strong><br>
                Location: <strong>{{locationName}}</strong><br>
                Time: <strong>{{timestamp}}</strong>
            </div>
            <div class="details">
                <h3>Equipment Details:</h3>
                <ul>
                    <li><strong>Equipment:</strong> {{equipmentName}}</li>
                    <li><strong>Status:</strong> {{equipmentStatus}}</li>
                    <li><strong>Location:</strong> {{locationName}}</li>
                    <li><strong>Error Description:</strong> {{errorDescription}}</li>
                </ul>
            </div>
            <div class="details">
                <h3>Immediate Actions Required:</h3>
                <ol>
                    <li>Inspect equipment immediately</li>
                    <li>Contact maintenance team</li>
                    <li>Notify affected customers</li>
                    <li>Implement backup procedures if available</li>
                </ol>
            </div>
            <p style="text-align: center;">
                <a href="{{dashboardUrl}}" class="btn">View Dashboard</a>
            </p>
        </div>
        <div class="footer">
            <p>{{systemName}} - Automated Alert System</p>
            <p>For support, contact: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`;
    }

    _getEquipmentFailureText() {
        return `🚨 URGENT: EQUIPMENT FAILURE ALERT

Equipment: {{equipmentName}}
Location: {{locationName}}
Status: {{equipmentStatus}}
Time: {{timestamp}}

ERROR DESCRIPTION:
{{errorDescription}}

IMMEDIATE ACTIONS REQUIRED:
1. Inspect equipment immediately
2. Contact maintenance team
3. Notify affected customers
4. Implement backup procedures if available

Dashboard: {{dashboardUrl}}

---
{{systemName}} - Automated Alert System
Support: {{supportEmail}}`;
    }

    /**
     * Staff Unavailability Templates
     */
    _getStaffUnavailableHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Staff Unavailability Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffc107; color: #212529; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background: #6c757d; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .alert-box { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Staff Unavailability Alert</h1>
            <p>Staffing issue requires attention</p>
        </div>
        <div class="content">
            <div class="alert-box">
                <strong>Staff Unavailability Detected!</strong><br>
                Location: <strong>{{locationName}}</strong><br>
                Time: <strong>{{timestamp}}</strong>
            </div>
            <div class="details">
                <h3>Staff Details:</h3>
                <ul>
                    <li><strong>Employee:</strong> {{employeeName}}</li>
                    <li><strong>Position:</strong> {{jobTitle}}</li>
                    <li><strong>Shift:</strong> {{shiftTime}}</li>
                    <li><strong>Reason:</strong> {{unavailabilityReason}}</li>
                </ul>
            </div>
            <div class="details">
                <h3>Recommended Actions:</h3>
                <ol>
                    <li>Contact replacement staff</li>
                    <li>Reschedule affected appointments</li>
                    <li>Notify customers of any delays</li>
                    <li>Update staff schedule</li>
                </ol>
            </div>
        </div>
        <div class="footer">
            <p>{{systemName}} - Automated Alert System</p>
            <p>For support, contact: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`;
    }

    _getStaffUnavailableText() {
        return `⚠️ STAFF UNAVAILABILITY ALERT

Employee: {{employeeName}}
Position: {{jobTitle}}
Location: {{locationName}}
Shift: {{shiftTime}}
Time: {{timestamp}}

UNAVAILABILITY REASON:
{{unavailabilityReason}}

RECOMMENDED ACTIONS:
1. Contact replacement staff
2. Reschedule affected appointments
3. Notify customers of any delays
4. Update staff schedule

---
{{systemName}} - Automated Alert System
Support: {{supportEmail}}`;
    }

    /**
     * Power Outage Templates
     */
    _getPowerOutageHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Power Outage Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background: #6c757d; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .alert-box { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔌 Power Outage Alert</h1>
            <p>Critical infrastructure issue</p>
        </div>
        <div class="content">
            <div class="alert-box">
                <strong>Power Outage Detected!</strong><br>
                Location: <strong>{{locationName}}</strong><br>
                Time: <strong>{{timestamp}}</strong>
            </div>
            <div class="details">
                <h3>Emergency Procedures:</h3>
                <ol>
                    <li>Activate backup power systems</li>
                    <li>Secure all equipment safely</li>
                    <li>Contact utility company</li>
                    <li>Notify affected customers</li>
                    <li>Implement contingency plans</li>
                </ol>
            </div>
        </div>
        <div class="footer">
            <p>{{systemName}} - Automated Alert System</p>
            <p>For support, contact: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`;
    }

    _getPowerOutageText() {
        return `🔌 POWER OUTAGE ALERT

Location: {{locationName}}
Time: {{timestamp}}

EMERGENCY PROCEDURES:
1. Activate backup power systems
2. Secure all equipment safely
3. Contact utility company
4. Notify affected customers
5. Implement contingency plans

---
{{systemName}} - Automated Alert System
Support: {{supportEmail}}`;
    }

    /**
     * Critical Inventory Templates
     */
    _getCriticalInventoryHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Critical Inventory Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #fd7e14; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background: #6c757d; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .alert-box { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .critical { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 Critical Inventory Alert</h1>
            <p>Immediate restocking required</p>
        </div>
        <div class="content">
            <div class="alert-box">
                <strong>Critical Inventory Level!</strong><br>
                Resource: <strong>{{resourceName}}</strong><br>
                Location: <strong>{{locationName}}</strong><br>
                Time: <strong>{{timestamp}}</strong>
            </div>
            <div class="details">
                <h3>Inventory Status:</h3>
                <ul>
                    <li><strong>Resource:</strong> {{resourceName}}</li>
                    <li><strong>Current Stock:</strong> <span class="critical">{{currentQuantity}} {{unit}}</span></li>
                    <li><strong>Status:</strong> <span class="critical">{{stockStatus}}</span></li>
                </ul>
            </div>
            <div class="details">
                <h3>Immediate Actions:</h3>
                <ol>
                    <li>Contact suppliers immediately</li>
                    <li>Check other locations for transfers</li>
                    <li>Prioritize critical orders</li>
                    <li>Update order scheduling</li>
                </ol>
            </div>
        </div>
        <div class="footer">
            <p>{{systemName}} - Automated Alert System</p>
            <p>For support, contact: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`;
    }

    _getCriticalInventoryText() {
        return `📦 CRITICAL INVENTORY ALERT

Resource: {{resourceName}}
Location: {{locationName}}
Current Stock: {{currentQuantity}} {{unit}}
Status: {{stockStatus}}
Time: {{timestamp}}

IMMEDIATE ACTIONS:
1. Contact suppliers immediately
2. Check other locations for transfers
3. Prioritize critical orders
4. Update order scheduling

---
{{systemName}} - Automated Alert System
Support: {{supportEmail}}`;
    }

    /**
     * Transport Delay Templates
     */
    _getTransportDelayHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Transport Delay Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #17a2b8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background: #6c757d; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .alert-box { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚚 Transport Delay Alert</h1>
            <p>Delivery schedule update required</p>
        </div>
        <div class="content">
            <div class="alert-box">
                <strong>Transport Delay Detected!</strong><br>
                Order: <strong>#{{orderId}}</strong><br>
                Time: <strong>{{timestamp}}</strong>
            </div>
            <div class="details">
                <h3>Transport Details:</h3>
                <ul>
                    <li><strong>Order ID:</strong> #{{orderId}}</li>
                    <li><strong>Driver:</strong> {{driverName}}</li>
                    <li><strong>Delay Reason:</strong> {{delayReason}}</li>
                </ul>
            </div>
            <div class="details">
                <h3>Required Actions:</h3>
                <ol>
                    <li>Contact customer immediately</li>
                    <li>Provide updated delivery time</li>
                    <li>Update order status</li>
                </ol>
            </div>
        </div>
        <div class="footer">
            <p>{{systemName}} - Automated Alert System</p>
            <p>For support, contact: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`;
    }

    _getTransportDelayText() {
        return `🚚 TRANSPORT DELAY ALERT

Order: #{{orderId}}
Driver: {{driverName}}
Delay Reason: {{delayReason}}
Time: {{timestamp}}

REQUIRED ACTIONS:
1. Contact customer immediately
2. Provide updated delivery time
3. Update order status

---
{{systemName}} - Automated Alert System
Support: {{supportEmail}}`;
    }

    /**
     * Maintenance Due Templates
     */
    _getMaintenanceDueHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Maintenance Due Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background: #6c757d; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .alert-box { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 Maintenance Due</h1>
            <p>Scheduled maintenance reminder</p>
        </div>
        <div class="content">
            <div class="alert-box">
                <strong>Maintenance Due!</strong><br>
                Equipment: <strong>{{equipmentName}}</strong><br>
                Location: <strong>{{locationName}}</strong><br>
                Due Date: <strong>{{dueDate}}</strong>
            </div>
            <div class="details">
                <h3>Scheduling Recommendations:</h3>
                <ol>
                    <li>Schedule maintenance during low-activity periods</li>
                    <li>Ensure required parts are available</li>
                    <li>Coordinate with operations team</li>
                    <li>Prepare backup equipment if needed</li>
                </ol>
            </div>
        </div>
        <div class="footer">
            <p>{{systemName}} - Automated Alert System</p>
            <p>For support, contact: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`;
    }

    _getMaintenanceDueText() {
        return `🔧 MAINTENANCE DUE ALERT

Equipment: {{equipmentName}}
Location: {{locationName}}
Due Date: {{dueDate}}

SCHEDULING RECOMMENDATIONS:
1. Schedule maintenance during low-activity periods
2. Ensure required parts are available
3. Coordinate with operations team
4. Prepare backup equipment if needed

---
{{systemName}} - Automated Alert System
Support: {{supportEmail}}`;
    }

    /**
     * System Test Templates
     */
    _getSystemTestHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>System Test Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background: #6c757d; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .success-box { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ System Test Email</h1>
            <p>Email system is working correctly</p>
        </div>
        <div class="content">
            <div class="success-box">
                <strong>Email System Test Successful!</strong><br>
                This email confirms that the CaS email notification system is working properly.
            </div>
            <div class="details">
                <h3>Test Details:</h3>
                <ul>
                    <li><strong>Test Time:</strong> {{timestamp}}</li>
                    <li><strong>System:</strong> {{systemName}}</li>
                    <li><strong>Email Template:</strong> System Test</li>
                </ul>
            </div>
            <p style="text-align: center; color: #28a745; font-weight: bold;">
                🎉 Email notifications are ready to use!
            </p>
        </div>
        <div class="footer">
            <p>{{systemName}} - Automated Alert System</p>
            <p>For support, contact: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`;
    }

    _getSystemTestText() {
        return `✅ SYSTEM TEST EMAIL

This email confirms that the CaS email notification system is working properly.

TEST DETAILS:
- Test Time: {{timestamp}}
- System: {{systemName}}
- Email Template: System Test

🎉 Email notifications are ready to use!

---
{{systemName}} - Automated Alert System
Support: {{supportEmail}}`;
    }
}

module.exports = EmailTemplates; 