// ===== XSS SECURITY MODULE =====
// Comprehensive XSS protection for CaS application

class XSSSecurity {
  constructor() {
    this.htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    
    // Dangerous HTML tags that should be completely removed
    this.dangerousTags = [
      'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select',
      'button', 'link', 'meta', 'base', 'style', 'title', 'head', 'html', 'body'
    ];
    
    // Dangerous attributes that should be removed
    this.dangerousAttributes = [
      'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onkeydown',
      'onkeyup', 'onkeypress', 'onfocus', 'onblur', 'onchange', 'onsubmit',
      'onreset', 'onselect', 'onabort', 'oncanplay', 'oncanplaythrough',
      'ondurationchange', 'onemptied', 'onended', 'onloadeddata', 'onloadedmetadata',
      'onloadstart', 'onpause', 'onplay', 'onplaying', 'onprogress', 'onratechange',
      'onseeked', 'onseeking', 'onstalled', 'onsuspend', 'ontimeupdate',
      'onvolumechange', 'onwaiting', 'javascript:', 'vbscript:', 'data:'
    ];
  }

  // ===== HTML SANITIZATION =====
  
  /**
   * Escape HTML entities to prevent XSS
   * @param {string} unsafe - Unsafe string that may contain HTML
   * @returns {string} - Safe HTML-escaped string
   */
  escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
      unsafe = String(unsafe);
    }
    
    return unsafe.replace(/[&<>"'`=\/]/g, (s) => this.htmlEntities[s]);
  }
  
  /**
   * Strip all HTML tags from string
   * @param {string} html - HTML string
   * @returns {string} - Plain text without HTML
   */
  stripHtml(html) {
    if (typeof html !== 'string') {
      html = String(html);
    }
    
    return html.replace(/<[^>]*>/g, '');
  }
  
  /**
   * Sanitize HTML by removing dangerous tags and attributes
   * @param {string} html - HTML string to sanitize
   * @returns {string} - Sanitized HTML
   */
  sanitizeHtml(html) {
    if (typeof html !== 'string') {
      html = String(html);
    }
    
    // Remove dangerous tags completely
    this.dangerousTags.forEach(tag => {
      const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gis');
      html = html.replace(regex, '');
      
      // Also remove self-closing versions
      const selfClosingRegex = new RegExp(`<${tag}[^>]*\/?>`, 'gis');
      html = html.replace(selfClosingRegex, '');
    });
    
    // Remove dangerous attributes
    this.dangerousAttributes.forEach(attr => {
      const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gis');
      html = html.replace(regex, '');
    });
    
    // Remove javascript: and data: protocols
    html = html.replace(/javascript:/gi, '');
    html = html.replace(/data:/gi, '');
    html = html.replace(/vbscript:/gi, '');
    
    return html;
  }

  // ===== SECURE DOM MANIPULATION =====
  
  /**
   * Safely set text content (prevents XSS)
   * @param {HTMLElement} element - Target element
   * @param {string} text - Text content to set
   */
  setTextContent(element, text) {
    if (element && typeof text !== 'undefined') {
      element.textContent = String(text);
    }
  }
  
  /**
   * Safely set HTML content with sanitization
   * @param {HTMLElement} element - Target element
   * @param {string} html - HTML content to set
   */
  setHtmlContent(element, html) {
    if (element && typeof html !== 'undefined') {
      element.innerHTML = this.sanitizeHtml(String(html));
    }
  }
  
  /**
   * Create element with safe text content
   * @param {string} tagName - HTML tag name
   * @param {string} textContent - Text content
   * @param {Object} attributes - Element attributes
   * @returns {HTMLElement} - Created element
   */
  createElement(tagName, textContent = '', attributes = {}) {
    const element = document.createElement(tagName);
    
    if (textContent) {
      this.setTextContent(element, textContent);
    }
    
    // Set attributes safely
    Object.keys(attributes).forEach(attr => {
      if (!this.dangerousAttributes.includes(attr.toLowerCase())) {
        element.setAttribute(attr, this.escapeHtml(String(attributes[attr])));
      }
    });
    
    return element;
  }
  
  /**
   * Create element with safe HTML content
   * @param {string} tagName - HTML tag name
   * @param {string} htmlContent - HTML content
   * @param {Object} attributes - Element attributes
   * @returns {HTMLElement} - Created element
   */
  createElementWithHtml(tagName, htmlContent = '', attributes = {}) {
    const element = document.createElement(tagName);
    
    if (htmlContent) {
      this.setHtmlContent(element, htmlContent);
    }
    
    // Set attributes safely
    Object.keys(attributes).forEach(attr => {
      if (!this.dangerousAttributes.includes(attr.toLowerCase())) {
        element.setAttribute(attr, this.escapeHtml(String(attributes[attr])));
      }
    });
    
    return element;
  }

  // ===== INPUT VALIDATION =====
  
  /**
   * Validate and sanitize user input
   * @param {string} input - User input
   * @param {Object} options - Validation options
   * @returns {Object} - {isValid: boolean, sanitized: string, errors: string[]}
   */
  validateInput(input, options = {}) {
    const result = {
      isValid: true,
      sanitized: '',
      errors: []
    };
    
    if (typeof input !== 'string') {
      input = String(input);
    }
    
    // Basic sanitization
    let sanitized = input.trim();
    
    // Length validation
    if (options.minLength && sanitized.length < options.minLength) {
      result.isValid = false;
      result.errors.push(`Minimum length is ${options.minLength} characters`);
    }
    
    if (options.maxLength && sanitized.length > options.maxLength) {
      result.isValid = false;
      result.errors.push(`Maximum length is ${options.maxLength} characters`);
    }
    
    // Pattern validation
    if (options.pattern && !options.pattern.test(sanitized)) {
      result.isValid = false;
      result.errors.push('Invalid format');
    }
    
    // HTML sanitization
    if (options.allowHtml) {
      sanitized = this.sanitizeHtml(sanitized);
    } else {
      sanitized = this.escapeHtml(sanitized);
    }
    
    // SQL injection prevention
    if (options.preventSql) {
      sanitized = this.preventSqlInjection(sanitized);
    }
    
    result.sanitized = sanitized;
    return result;
  }
  
  /**
   * Prevent SQL injection attacks
   * @param {string} input - Input string
   * @returns {string} - Sanitized string
   */
  preventSqlInjection(input) {
    if (typeof input !== 'string') {
      input = String(input);
    }
    
    // Remove or escape dangerous SQL keywords and characters
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
      /(--|\/\*|\*\/|;|'|"|`)/g,
      /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi
    ];
    
    sqlPatterns.forEach(pattern => {
      input = input.replace(pattern, '');
    });
    
    return input;
  }

  // ===== FORM SECURITY =====
  
  /**
   * Secure form data processing
   * @param {FormData|Object} formData - Form data
   * @param {Object} schema - Validation schema
   * @returns {Object} - {isValid: boolean, data: Object, errors: Object}
   */
  validateFormData(formData, schema = {}) {
    const result = {
      isValid: true,
      data: {},
      errors: {}
    };
    
    // Convert FormData to Object if needed
    let data = {};
    if (formData instanceof FormData) {
      for (let [key, value] of formData.entries()) {
        data[key] = value;
      }
    } else {
      data = { ...formData };
    }
    
    // Validate each field
    Object.keys(data).forEach(field => {
      const value = data[field];
      const fieldSchema = schema[field] || {};
      
      const validation = this.validateInput(value, fieldSchema);
      
      if (validation.isValid) {
        result.data[field] = validation.sanitized;
      } else {
        result.isValid = false;
        result.errors[field] = validation.errors;
      }
    });
    
    return result;
  }

  // ===== URL SECURITY =====
  
  /**
   * Validate and sanitize URLs
   * @param {string} url - URL to validate
   * @returns {Object} - {isValid: boolean, sanitized: string}
   */
  validateUrl(url) {
    const result = {
      isValid: false,
      sanitized: ''
    };
    
    if (typeof url !== 'string') {
      return result;
    }
    
    try {
      // Remove dangerous protocols
      if (url.match(/^(javascript|data|vbscript):/i)) {
        return result;
      }
      
      // Allow only HTTP, HTTPS, and relative URLs
      if (url.match(/^(https?:\/\/|\/|\.\/|#)/i) || !url.includes(':')) {
        const sanitized = this.escapeHtml(url);
        result.isValid = true;
        result.sanitized = sanitized;
      }
    } catch (error) {
      console.error('URL validation error:', error);
    }
    
    return result;
  }

  // ===== CSP (Content Security Policy) HELPERS =====
  
  /**
   * Generate nonce for inline scripts/styles
   * @returns {string} - Random nonce
   */
  generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Add CSP meta tag to document
   * @param {Object} policies - CSP policies
   */
  addCSPMeta(policies = {}) {
    const defaultPolicies = {
      'default-src': "'self'",
      'script-src': "'self' 'unsafe-inline'",
      'style-src': "'self' 'unsafe-inline'",
      'img-src': "'self' data: https:",
      'font-src': "'self'",
      'connect-src': "'self'",
      'frame-src': "'none'",
      'object-src': "'none'",
      'base-uri': "'self'",
      'form-action': "'self'"
    };
    
    const mergedPolicies = { ...defaultPolicies, ...policies };
    const cspContent = Object.entries(mergedPolicies)
      .map(([directive, value]) => `${directive} ${value}`)
      .join('; ');
    
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = cspContent;
    
    document.head.appendChild(meta);
  }

  // ===== LOGGING & MONITORING =====
  
  /**
   * Log XSS attempt
   * @param {string} type - Type of XSS attempt
   * @param {string} payload - Malicious payload
   * @param {string} source - Source of the attempt
   */
  logXSSAttempt(type, payload, source = 'unknown') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: type,
      payload: payload.substring(0, 200), // Limit payload length
      source: source,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.warn('XSS Attempt Detected:', logEntry);
    
    // Send to server for monitoring (if endpoint exists)
    if (typeof fetch !== 'undefined') {
      fetch('/api/security/xss-attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      }).catch(error => {
        console.error('Failed to log XSS attempt:', error);
      });
    }
  }
}

// ===== GLOBAL INSTANCE =====
const xssSecurity = new XSSSecurity();

// ===== GLOBAL HELPER FUNCTIONS =====

/**
 * Global function to safely escape HTML
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  return xssSecurity.escapeHtml(text);
}

/**
 * Global function to safely set text content
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text content
 */
function safeSetText(element, text) {
  xssSecurity.setTextContent(element, text);
}

/**
 * Global function to safely set HTML content
 * @param {HTMLElement} element - Target element
 * @param {string} html - HTML content
 */
function safeSetHtml(element, html) {
  xssSecurity.setHtmlContent(element, html);
}

/**
 * Global function to safely create element
 * @param {string} tagName - Tag name
 * @param {string} textContent - Text content
 * @param {Object} attributes - Attributes
 * @returns {HTMLElement} - Created element
 */
function safeCreateElement(tagName, textContent = '', attributes = {}) {
  return xssSecurity.createElement(tagName, textContent, attributes);
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { XSSSecurity, xssSecurity };
} else {
  window.XSSSecurity = XSSSecurity;
  window.xssSecurity = xssSecurity;
} 