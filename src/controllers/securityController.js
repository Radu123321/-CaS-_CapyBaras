// ===== SECURITY CONTROLLER =====
// Handles security-related endpoints including XSS attempt logging

const log = require('../core/logger');

class SecurityController {
  
  /**
   * Log XSS attempt
   * POST /api/security/xss-attempt
   */
  async logXSSAttempt(req, res) {
    try {
      const { timestamp, type, payload, source, userAgent, url } = req.body;
      
      // Validate required fields
      if (!timestamp || !type || !payload) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Missing required fields: timestamp, type, payload'
        }));
      }
      
      // Log the XSS attempt
      const logEntry = {
        timestamp: new Date(timestamp).toISOString(),
        type: String(type).substring(0, 50), // Limit length
        payload: String(payload).substring(0, 500), // Limit payload length
        source: String(source || 'unknown').substring(0, 100),
        userAgent: String(userAgent || '').substring(0, 200),
        url: String(url || '').substring(0, 200),
        clientIP: req.connection?.remoteAddress || req.ip || 'unknown'
      };
      
      // Log as security warning
      log.warn(`🚨 XSS ATTEMPT DETECTED: ${JSON.stringify(logEntry)}`);
      
      // In a production environment, you might want to:
      // 1. Store in a security incidents database
      // 2. Send alerts to security team
      // 3. Implement rate limiting for repeated attempts
      // 4. Block IP addresses with multiple attempts
      
      // For now, we'll just acknowledge the log
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'XSS attempt logged successfully'
      }));
      
    } catch (error) {
      log.error(`Error logging XSS attempt: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to log XSS attempt'
      }));
    }
  }
  
  /**
   * Get security status
   * GET /api/security/status
   */
  async getSecurityStatus(req, res) {
    try {
      const status = {
        xssProtection: true,
        csrfProtection: false, // Would need to implement CSRF tokens
        rateLimiting: false,   // Would need to implement rate limiting
        inputValidation: true,
        outputEncoding: true,
        secureHeaders: false,  // Would need to implement security headers
        lastUpdated: new Date().toISOString()
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: status
      }));
      
    } catch (error) {
      log.error(`Error getting security status: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get security status'
      }));
    }
  }
  
  /**
   * Validate input for XSS
   * POST /api/security/validate-input
   */
  async validateInput(req, res) {
    try {
      const { input, options = {} } = req.body;
      
      if (typeof input !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Input must be a string'
        }));
      }
      
      // Basic XSS detection patterns
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe[^>]*>/gi,
        /<object[^>]*>/gi,
        /<embed[^>]*>/gi,
        /data:text\/html/gi,
        /vbscript:/gi
      ];
      
      let hasXSS = false;
      let detectedPatterns = [];
      
      xssPatterns.forEach((pattern, index) => {
        if (pattern.test(input)) {
          hasXSS = true;
          detectedPatterns.push(`Pattern ${index + 1}`);
        }
      });
      
      // HTML entity escape function
      const escapeHtml = (unsafe) => {
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      };
      
      const result = {
        isValid: !hasXSS,
        originalInput: input.substring(0, 200), // Limit for logging
        sanitizedInput: escapeHtml(input),
        detectedPatterns: detectedPatterns,
        riskLevel: hasXSS ? 'HIGH' : 'LOW'
      };
      
      if (hasXSS) {
        // Log the XSS attempt
        log.warn(`XSS detected in input validation: ${JSON.stringify({
          input: input.substring(0, 100),
          patterns: detectedPatterns,
          clientIP: req.connection?.remoteAddress || req.ip
        })}`);
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: result
      }));
      
    } catch (error) {
      log.error(`Error validating input: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to validate input'
      }));
    }
  }
  
  /**
   * Security health check
   * GET /api/security/health
   */
  async healthCheck(req, res) {
    try {
      const checks = {
        xssModule: typeof global.xssSecurity !== 'undefined',
        logging: true,
        inputValidation: true,
        timestamp: new Date().toISOString()
      };
      
      const allHealthy = Object.values(checks).every(check => 
        typeof check === 'boolean' ? check : true
      );
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          status: allHealthy ? 'healthy' : 'degraded',
          checks: checks
        }
      }));
      
    } catch (error) {
      log.error(`Error in security health check: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Security health check failed'
      }));
    }
  }
}

module.exports = new SecurityController(); 