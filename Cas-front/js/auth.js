// ===== AUTHENTICATION CORE MODULE =====

class AuthManager {
  constructor() {
    this.apiBaseUrl = 'http://localhost:8000/api';
    this.currentUser = null;
    this.token = null;
    this.serverOfflineVisible = false;
    
    // Initialize on page load
    this.init();
  }

  // ===== INITIALIZATION =====
  
  init() {
    // Check for existing session
    this.loadSession();
    
    // Set up API request interceptor
    this.setupRequestInterceptor();
  }

  // ===== SESSION MANAGEMENT =====
  
  loadSession() {
    try {
      const token = localStorage.getItem('cas_token') || sessionStorage.getItem('cas_token');
      const user = localStorage.getItem('cas_user') || sessionStorage.getItem('cas_user');
      
      if (token && user) {
        this.token = token;
        this.currentUser = JSON.parse(user);
        
        // Validate token expiration
        const tokenData = this.parseJWT(token);
        if (tokenData && tokenData.exp * 1000 > Date.now()) {
          this.updateAuthState(true);
          return true;
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      this.clearSession();
    }
    
    return false;
  }
  
  saveSession(token, user, remember = false) {
    const storage = remember ? localStorage : sessionStorage;
    
    storage.setItem('cas_token', token);
    storage.setItem('cas_user', JSON.stringify(user));
    
    this.token = token;
    this.currentUser = user;
    this.updateAuthState(true);
  }
  
  clearSession() {
    localStorage.removeItem('cas_token');
    localStorage.removeItem('cas_user');
    sessionStorage.removeItem('cas_token');
    sessionStorage.removeItem('cas_user');
    
    this.token = null;
    this.currentUser = null;
    this.updateAuthState(false);
  }

  // ===== AUTHENTICATION METHODS =====
  
  async login(email, password, rememberMe = false) {
    try {
      console.log('Attempting login for:', email);
      
      const response = await this.apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password: password 
        })
      });
      
      console.log('Login response:', response);
      
      if (response.success) {
        this.saveSession(response.data.token, response.data.user, rememberMe);
        console.log('Login successful, user saved:', response.data.user);
        return { success: true, user: response.data.user };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please check your connection and try again.' };
    }
  }
  
  async register(userData) {
    try {
      console.log('Attempting registration for:', userData.email);
      
      const response = await this.apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: userData.email.trim().toLowerCase(),
          password: userData.password,
          firstName: userData.firstName.trim(),
          lastName: userData.lastName.trim(),
          phone: userData.phone?.trim() || null,
          role: userData.role || 'EMPLOYEE',
          locationId: userData.locationId || null
        })
      });
      
      console.log('Registration response:', response);
      
      if (response.success) {
        return { 
          success: true, 
          message: response.message || 'Registration successful! You can now login.',
          data: response.data
        };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please check your connection and try again.' };
    }
  }
  
  async logout() {
    try {
      if (this.token) {
        await this.apiRequest('/auth/logout', {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
      
      // Redirect to login page if not already there
      if (!window.location.pathname.includes('login.html') && 
          !window.location.pathname.includes('index.html')) {
        window.location.href = 'login.html';
      }
    }
  }

  // ===== API INTEGRATION =====
  
  async apiRequest(endpoint, options = {}) {
    const url = `${this.apiBaseUrl}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` })
      }
    };
    
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
    
    try {
      console.log('Making API request to:', url, mergedOptions);

      const response = await fetch(url, mergedOptions);

      // Any successful fetch hides offline banner (if shown)
      this._hideOfflineBanner();

      // If server returned no content / error HTML when down, attempt safe JSON parse
      let data = {};
      try {
        data = await response.json();
      } catch (_err) {
        // ignore JSON parse errors for non-JSON responses
      }

      console.log('API response:', data);

      // Handle token expiration
      if (response.status === 401 && this.token) {
        console.log('Token expired, clearing session');
        this.clearSession();
        throw new Error('Authentication expired');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);

      this._redirectToOfflinePage();

      throw error;
    }
  }

  // ===== REQUEST INTERCEPTOR =====
  
  setupRequestInterceptor() {
    // This will be used for future API calls
    window.addEventListener('beforeunload', () => {
      // Save any pending state before page unload
    });
  }

  // ===== UTILITY METHODS =====
  
  parseJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  }
  
  updateAuthState(isAuthenticated) {
    // Update UI elements based on authentication state
    const authElements = document.querySelectorAll('.auth-required');
    const guestElements = document.querySelectorAll('.guest-only');
    
    authElements.forEach(el => {
      el.style.display = isAuthenticated ? 'block' : 'none';
    });
    
    guestElements.forEach(el => {
      el.style.display = isAuthenticated ? 'none' : 'block';
    });
    
    // Update user info display
    if (isAuthenticated && this.currentUser) {
      this.updateUserDisplay();
    }
  }
  
  updateUserDisplay() {
    // Update user name displays
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
      // Use fullName if available, otherwise combine firstName and lastName
      const displayName = this.currentUser.fullName || 
                         `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim() ||
                         'User';
      el.textContent = displayName;
    });
    
    // Update user email displays
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(el => {
      el.textContent = this.currentUser.email;
    });
    
    // Update user role displays
    const userRoleElements = document.querySelectorAll('.user-role');
    userRoleElements.forEach(el => {
      el.textContent = this.currentUser.role;
    });
  }

  // ===== VALIDATION METHODS =====
  
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  validatePassword(password) {
    return password && password.length >= 6;
  }
  
  validateRequired(value) {
    return value && value.trim().length > 0;
  }

  // ===== ACCESS CONTROL =====
  
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
  
  requireRole(roles) {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    
    const userRole = this.currentUser?.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      this.showError('Access denied. Insufficient permissions.');
      return false;
    }
    
    return true;
  }
  
  isAuthenticated() {
    return !!(this.token && this.currentUser);
  }
  
  hasRole(role) {
    return this.currentUser?.role === role;
  }
  
  hasAnyRole(roles) {
    const userRole = this.currentUser?.role;
    return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
  }

  // ===== UI HELPER METHODS =====
  
  showAlert(message, type = 'info', duration = 5000) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
      <span>${message}</span>
      <button type="button" class="alert-close">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(alert);
    
    // Auto remove
    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, duration);
    
    // Manual close
    alert.querySelector('.alert-close').addEventListener('click', () => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    });
  }
  
  showSuccess(message, duration = 5000) {
    this.showAlert(message, 'success', duration);
  }
  
  showError(message, duration = 5000) {
    this.showAlert(message, 'error', duration);
  }
  
  showWarning(message, duration = 5000) {
    this.showAlert(message, 'warning', duration);
  }
  
  showInfo(message, duration = 5000) {
    this.showAlert(message, 'info', duration);
  }

  // ===== FORM HELPER METHODS =====
  
  setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove existing error
    this.clearFieldError(fieldId);
    
    // Add error class
    field.classList.add('error');
    
    // Add error message
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.id = `${fieldId}-error`;
    
    field.parentNode.insertBefore(errorElement, field.nextSibling);
  }
  
  clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.remove('error');
    
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
      errorElement.remove();
    }
  }
  
  setFormLoading(formId, loading = true) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    if (loading) {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Loading...';
      }
      inputs.forEach(input => input.disabled = true);
    } else {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtn.dataset.originalText || 'Submit';
      }
      inputs.forEach(input => input.disabled = false);
    }
  }

  // ===== API HELPER METHODS =====
  
  async getLocations() {
    try {
      const response = await this.apiRequest('/locations');
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  }
  
  async getUserProfile() {
    try {
      const response = await this.apiRequest('/auth/profile');
      if (response.success) {
        this.currentUser = response.data;
        this.updateUserDisplay();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /** OFFLINE HANDLING **/
  _injectOfflineStyles() {
    if (document.getElementById('offline-css')) return;
    const link = document.createElement('link');
    link.id = 'offline-css';
    link.rel = 'stylesheet';
    link.href = 'css/offline.css';
    document.head.appendChild(link);
  }

  _patchGlobalFetch() {
    if (window.__fetchPatched) return;
    window.__fetchPatched = true;
    const originalFetch = window.fetch.bind(window);
    const self = this;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        // Hide banner on any successful response
        self._hideOfflineBanner();
        return response;
      } catch (err) {
        self._showOfflineBanner();
        throw err;
      }
    };
  }

  _redirectToOfflinePage() {
    // prevent redirect loop
    if (window.location.pathname.endsWith('offline.html')) return;
    // Remember the last visited page to come back later
    sessionStorage.setItem('cas_last_page', window.location.pathname + window.location.search);
    window.location.href = 'offline.html';
  }

  _hideOfflineBanner() {
    // no-op now
  }
}

// ===== GLOBAL INSTANCE =====
window.authManager = new AuthManager();

// ===== DEMO ACCOUNTS =====
window.demoAccounts = {
  admin: { email: 'admin@cas.ro', password: 'admin123' },
  manager: { email: 'manager@cas.ro', password: 'manager123' },
  employee: { email: 'employee@cas.ro', password: 'employee123' }
}; 