// ===== DASHBOARD FUNCTIONALITY =====

class Dashboard {
  constructor() {
    this.refreshInterval = null;
    this.notifications = [];
    this.confirmCallback = null;
    
    this.init();
  }

  // ===== INITIALIZATION =====
  
  async init() {
    // Check authentication
    if (!authManager.requireAuth()) {
      return;
    }

    try {
      // Show loading state
      this.showLoading();
      
      // Load dashboard data
      await this.loadDashboardData();
      
      // Set up real-time updates
      this.setupRealTimeUpdates();
      
      // Set up periodic refresh
      this.startPeriodicRefresh();
      
      // Show dashboard content
      this.showDashboard();
      
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      this.showError('Nu s-a putut încărca dashboard-ul. Vă rugăm să reîncărcați pagina.');
    }
  }

  // ===== LOADING AND ERROR STATES =====
  
  showLoading() {
    document.getElementById('loadingState').style.display = 'flex';
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
  }
  
  showDashboard() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
    document.getElementById('errorState').style.display = 'none';
  }
  
  showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'flex';
    document.getElementById('errorMessage').textContent = message;
  }

  // ===== DATA LOADING =====
  
  async loadDashboardData() {
    const user = authManager.currentUser;
    
    // Update welcome message
    document.getElementById('welcomeTitle').textContent = `Bun venit, ${user.firstName}!`;
    document.getElementById('welcomeSubtitle').textContent = `Dashboard ${this.getRoleLabel(user.role)}`;
    
    // Load dashboard stats
    await this.loadDashboardStats();
    
    // Load quick actions based on role
    this.loadQuickActions(user.role);
    
    // Load widgets
    await this.loadRecentOrders();
    await this.loadSystemStatus();
    await this.loadNotifications();
    await this.loadPerformanceChart();
    
    // Load role-specific content
    this.loadRoleSpecificContent(user.role);
  }
  
  async loadDashboardStats() {
    try {
      const response = await authManager.apiRequest('/stats/dashboard');
      
      if (response.success) {
        const stats = response.data;
        
        document.getElementById('totalLocations').textContent = stats.totalLocations || '0';
        document.getElementById('activeOrders').textContent = stats.activeOrders || '0';
        document.getElementById('totalRevenue').textContent = stats.todayRevenue ? `${stats.todayRevenue} RON` : '0 RON';
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  }
  
  loadQuickActions(role) {
    const actionsGrid = document.getElementById('quickActionsGrid');
    const actions = this.getQuickActionsByRole(role);
    
    actionsGrid.innerHTML = actions.map(action => `
      <a href="${action.href}" class="action-card" onclick="${action.onclick || ''}">
        <span class="action-icon">${action.icon}</span>
        <h3 class="action-title">${action.title}</h3>
        <p class="action-description">${action.description}</p>
      </a>
    `).join('');
  }
  
  getQuickActionsByRole(role) {
    const commonActions = [
      {
        icon: '📊',
        title: 'Rapoarte',
        description: 'Vezi rapoarte și statistici',
        href: 'reports.html'
      },
      {
        icon: '🔔',
        title: 'Notificări',
        description: 'Gestionează notificările',
        href: '#',
        onclick: 'showNotificationsModal()'
      }
    ];
    
    const roleActions = {
      'ADMIN': [
        {
          icon: '👥',
          title: 'Utilizatori',
          description: 'Gestionează utilizatorii',
          href: 'users.html'
        },
        {
          icon: '🏢',
          title: 'Locații',
          description: 'Administrează locațiile',
          href: 'locations.html'
        },
        {
          icon: '⚙️',
          title: 'Configurări',
          description: 'Setări de sistem',
          href: 'settings.html'
        },
        {
          icon: '🔧',
          title: 'Echipamente',
          description: 'Gestionează echipamentele',
          href: 'equipment.html'
        }
      ],
      'MANAGER': [
        {
          icon: '📋',
          title: 'Comenzi',
          description: 'Gestionează comenzile',
          href: 'orders.html'
        },
        {
          icon: '👷',
          title: 'Echipa',
          description: 'Gestionează echipa',
          href: 'team.html'
        },
        {
          icon: '🔧',
          title: 'Echipamente',
          description: 'Monitorizează echipamentele',
          href: 'equipment.html'
        }
      ],
      'EMPLOYEE': [
        {
          icon: '📋',
          title: 'Comenzile Mele',
          description: 'Vezi comenzile atribuite',
          href: 'my-orders.html'
        },
        {
          icon: '✅',
          title: 'Servicii',
          description: 'Actualizează serviciile',
          href: 'services.html'
        }
      ]
    };
    
    return [...(roleActions[role] || []), ...commonActions];
  }

  // ===== WIDGET LOADING =====
  
  async loadRecentOrders() {
    try {
      const response = await authManager.apiRequest('/orders?limit=5&sort=created_at:desc');
      const ordersList = document.getElementById('recentOrdersList');
      
      if (response.success && response.data.length > 0) {
        ordersList.innerHTML = response.data.map(order => `
          <div class="order-item">
            <div class="order-info">
              <div class="order-id">#${order.id}</div>
              <div class="order-details">
                ${order.customer_name} • ${order.service_type} • ${this.formatDate(order.created_at)}
              </div>
            </div>
            <span class="order-status ${order.status.toLowerCase()}">${this.getStatusLabel(order.status)}</span>
          </div>
        `).join('');
      } else {
        ordersList.innerHTML = '<div class="loading-placeholder">Nu există comenzi recente</div>';
      }
    } catch (error) {
      console.error('Error loading recent orders:', error);
      document.getElementById('recentOrdersList').innerHTML = '<div class="loading-placeholder">Eroare la încărcare</div>';
    }
  }
  
  async loadSystemStatus() {
    try {
      const response = await authManager.apiRequest('/stats/system-status');
      const statusList = document.getElementById('systemStatusList');
      
      if (response.success) {
        const status = response.data;
        statusList.innerHTML = `
          <div class="status-item">
            <span class="status-label">Server</span>
            <span class="status-indicator ${status.server ? 'online' : 'offline'}"></span>
          </div>
          <div class="status-item">
            <span class="status-label">Baza de Date</span>
            <span class="status-indicator ${status.database ? 'online' : 'offline'}"></span>
          </div>
          <div class="status-item">
            <span class="status-label">Email Service</span>
            <span class="status-indicator ${status.email ? 'online' : 'warning'}"></span>
          </div>
          <div class="status-item">
            <span class="status-label">Echipamente Active</span>
            <span class="status-indicator ${status.equipment > 80 ? 'online' : status.equipment > 50 ? 'warning' : 'offline'}"></span>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading system status:', error);
      document.getElementById('systemStatusList').innerHTML = '<div class="loading-placeholder">Eroare la încărcare</div>';
    }
  }
  
  async loadNotifications() {
    try {
      const response = await authManager.apiRequest('/notifications/recent?limit=5');
      const notificationsList = document.getElementById('notificationsList');
      
      if (response.success && response.data.length > 0) {
        this.notifications = response.data;
        notificationsList.innerHTML = response.data.map(notification => `
          <div class="notification-item ${notification.read ? '' : 'unread'}">
            <span class="notification-icon">${this.getNotificationIcon(notification.type)}</span>
            <div class="notification-content">
              <div class="notification-title">${notification.title}</div>
              <div class="notification-message">${notification.message}</div>
              <div class="notification-time">${this.formatRelativeTime(notification.created_at)}</div>
            </div>
          </div>
        `).join('');
      } else {
        notificationsList.innerHTML = '<div class="loading-placeholder">Nu există notificări</div>';
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      document.getElementById('notificationsList').innerHTML = '<div class="loading-placeholder">Eroare la încărcare</div>';
    }
  }
  
  async loadPerformanceChart() {
    try {
      const period = document.getElementById('performancePeriod').value;
      const response = await authManager.apiRequest(`/stats/performance?days=${period}`);
      
      if (response.success) {
        this.renderPerformanceChart(response.data);
      }
    } catch (error) {
      console.error('Error loading performance chart:', error);
    }
  }
  
  renderPerformanceChart(data) {
    const canvas = document.getElementById('performanceChart');
    const ctx = canvas.getContext('2d');
    
    // Simple chart implementation (you can integrate Chart.js here)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw chart background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw chart title
    ctx.fillStyle = '#2c3e50';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Performanță Zilnică', canvas.width / 2, 30);
    
    // Draw simple line chart
    if (data && data.length > 0) {
      ctx.strokeStyle = '#667eea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const maxValue = Math.max(...data.map(d => d.value));
      const stepX = canvas.width / (data.length - 1);
      const stepY = (canvas.height - 80) / maxValue;
      
      data.forEach((point, index) => {
        const x = index * stepX;
        const y = canvas.height - 40 - (point.value * stepY);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }
  }
  
  loadRoleSpecificContent(role) {
    const roleContent = document.getElementById('roleSpecificContent');
    
    const roleContentMap = {
      'ADMIN': this.getAdminContent(),
      'MANAGER': this.getManagerContent(),
      'EMPLOYEE': this.getEmployeeContent()
    };
    
    roleContent.innerHTML = roleContentMap[role] || '';
  }
  
  getAdminContent() {
    return `
      <div class="role-section">
        <h2>Panou Administrator</h2>
        <div class="role-grid">
          <div class="role-card">
            <h3>Gestiune Sistem</h3>
            <ul>
              <li>Administrare utilizatori</li>
              <li>Configurări globale</li>
              <li>Monitorizare sistem</li>
              <li>Backup și securitate</li>
            </ul>
          </div>
          <div class="role-card">
            <h3>Rapoarte Avansate</h3>
            <ul>
              <li>Analize financiare</li>
              <li>Performanță globală</li>
              <li>Statistici utilizatori</li>
              <li>Rapoarte personalizate</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }
  
  getManagerContent() {
    return `
      <div class="role-section">
        <h2>Panou Manager</h2>
        <div class="role-grid">
          <div class="role-card">
            <h3>Gestiune Locație</h3>
            <ul>
              <li>Monitorizare echipamente</li>
              <li>Programare servicii</li>
              <li>Gestiune inventar</li>
              <li>Rapoarte locație</li>
            </ul>
          </div>
          <div class="role-card">
            <h3>Gestiune Echipă</h3>
            <ul>
              <li>Atribuire sarcini</li>
              <li>Monitorizare performanță</li>
              <li>Programare personal</li>
              <li>Training și dezvoltare</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }
  
  getEmployeeContent() {
    return `
      <div class="role-section">
        <h2>Panou Angajat</h2>
        <div class="role-grid">
          <div class="role-card">
            <h3>Activități Zilnice</h3>
            <ul>
              <li>Comenzi atribuite</li>
              <li>Actualizare status</li>
              <li>Raportare probleme</li>
              <li>Timp lucrat</li>
            </ul>
          </div>
          <div class="role-card">
            <h3>Resurse</h3>
            <ul>
              <li>Proceduri de lucru</li>
              <li>Contacte echipă</li>
              <li>Materiale training</li>
              <li>Feedback clienți</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  // ===== REAL-TIME UPDATES =====
  
  setupRealTimeUpdates() {
    // WebSocket connection for real-time updates
    if (typeof WebSocket !== 'undefined') {
      try {
        const wsUrl = 'ws://localhost:3000';
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
          console.log('WebSocket connected');
          this.showToast('Conectat la actualizări în timp real', 'success');
        };
        
        this.websocket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        };
        
        this.websocket.onclose = () => {
          console.log('WebSocket disconnected');
          // Attempt to reconnect after 5 seconds
          setTimeout(() => this.setupRealTimeUpdates(), 5000);
        };
        
        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('WebSocket setup error:', error);
      }
    }
  }
  
  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'notification':
        this.handleNotification(message.notification);
        break;
      case 'order_update':
        this.handleOrderUpdate(message.order);
        break;
      case 'system_status':
        this.handleSystemStatusUpdate(message.status);
        break;
      default:
        console.log('Unknown WebSocket message:', message);
    }
  }
  
  handleNotification(notification) {
    // Add to notifications list
    this.notifications.unshift(notification);
    
    // Show toast
    this.showToast(notification.message, this.getNotificationToastType(notification.type));
    
    // Refresh notifications widget
    this.loadNotifications();
  }
  
  handleOrderUpdate(order) {
    // Refresh recent orders
    this.loadRecentOrders();
    
    // Update stats
    this.loadDashboardStats();
  }
  
  handleSystemStatusUpdate(status) {
    // Refresh system status
    this.loadSystemStatus();
  }

  // ===== PERIODIC REFRESH =====
  
  startPeriodicRefresh() {
    // Refresh every 5 minutes
    this.refreshInterval = setInterval(() => {
      this.loadDashboardStats();
      this.loadSystemStatus();
    }, 5 * 60 * 1000);
  }
  
  stopPeriodicRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // ===== UTILITY METHODS =====
  
  getRoleLabel(role) {
    const roleLabels = {
      'ADMIN': 'Administrator',
      'MANAGER': 'Manager',
      'EMPLOYEE': 'Angajat'
    };
    return roleLabels[role] || role;
  }
  
  getStatusLabel(status) {
    const statusLabels = {
      'PENDING': 'În așteptare',
      'IN_PROGRESS': 'În progres',
      'COMPLETED': 'Finalizată',
      'CANCELLED': 'Anulată'
    };
    return statusLabels[status] || status;
  }
  
  getNotificationIcon(type) {
    const icons = {
      'ORDER': '📋',
      'EQUIPMENT': '🔧',
      'SYSTEM': '⚙️',
      'ALERT': '🚨',
      'INFO': 'ℹ️'
    };
    return icons[type] || '🔔';
  }
  
  getNotificationToastType(type) {
    const types = {
      'ALERT': 'error',
      'WARNING': 'warning',
      'INFO': 'info',
      'SUCCESS': 'success'
    };
    return types[type] || 'info';
  }
  
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Acum';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ore`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} zile`;
    }
  }

  // ===== TOAST NOTIFICATIONS =====
  
  showToast(message, type = 'info', duration = 5000) {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, duration);
  }

  // ===== MODAL FUNCTIONS =====
  
  showConfirm(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').style.display = 'flex';
    this.confirmCallback = callback;
  }
  
  closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    this.confirmCallback = null;
  }
  
  confirmAction() {
    if (this.confirmCallback) {
      this.confirmCallback();
    }
    this.closeConfirmModal();
  }

  // ===== CLEANUP =====
  
  destroy() {
    this.stopPeriodicRefresh();
    
    if (this.websocket) {
      this.websocket.close();
    }
  }
}

// ===== GLOBAL FUNCTIONS =====

let dashboard = null;

// Widget refresh functions
async function refreshRecentOrders() {
  if (dashboard) {
    await dashboard.loadRecentOrders();
  }
}

async function refreshSystemStatus() {
  if (dashboard) {
    await dashboard.loadSystemStatus();
  }
}

async function refreshNotifications() {
  if (dashboard) {
    await dashboard.loadNotifications();
  }
}

async function refreshPerformanceChart() {
  if (dashboard) {
    await dashboard.loadPerformanceChart();
  }
}

async function updatePerformanceChart() {
  if (dashboard) {
    await dashboard.loadPerformanceChart();
  }
}

function clearAllNotifications() {
  if (dashboard) {
    dashboard.showConfirm(
      'Confirmare',
      'Ești sigur că vrei să marchezi toate notificările ca citite?',
      async () => {
        try {
          await authManager.apiRequest('/notifications/mark-all-read', { method: 'POST' });
          dashboard.showToast('Toate notificările au fost marcate ca citite', 'success');
          await dashboard.loadNotifications();
        } catch (error) {
          dashboard.showToast('Eroare la marcarea notificărilor', 'error');
        }
      }
    );
  }
}

function showNotificationsModal() {
  // Implementation for notifications modal
  dashboard.showToast('Funcționalitatea va fi disponibilă în curând', 'info');
}

// Modal functions
function closeConfirmModal() {
  if (dashboard) {
    dashboard.closeConfirmModal();
  }
}

function confirmAction() {
  if (dashboard) {
    dashboard.confirmAction();
  }
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
  dashboard = new Dashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (dashboard) {
    dashboard.destroy();
  }
}); 