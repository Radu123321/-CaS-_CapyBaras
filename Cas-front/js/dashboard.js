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
        icon: '📅',
        title: 'Calendar',
        description: 'Vezi programările în calendar',
        href: 'calendar.html'
      },
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
          icon: '📋',
          title: 'Toate Comenzile',
          description: 'Gestionează toate comenzile',
          href: 'orders.html'
        },
        {
          icon: '🗓️',
          title: 'Programări',
          description: 'Gestionează programările',
          href: 'appointments.html'
        },
        {
          icon: '🔧',
          title: 'Echipamente',
          description: 'Gestionează echipamentele',
          href: 'equipment.html'
        },
        {
          icon: '👷',
          title: 'Angajați',
          description: 'Gestionează echipa',
          href: 'employees.html'
        },
        {
          icon: '👥',
          title: 'Clienți',
          description: 'Gestionează clienții',
          href: 'customers.html'
        },
        {
          icon: '⚙️',
          title: 'Configurări',
          description: 'Setări de sistem',
          href: 'settings.html'
        },
        {
          icon: '📦',
          title: 'Import Stoc',
          description: 'Reîncarcă inventar din CSV',
          href: '#',
          onclick: 'openImportModal()'
        },
        {
          icon: '📊',
          title: 'Inventar',
          description: 'Vezi stoc pe filiale',
          href: '#',
          onclick: 'openInventoryModal()'
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
          icon: '🗓️',
          title: 'Programări',
          description: 'Gestionează programările',
          href: 'appointments.html'
        },
        {
          icon: '👷',
          title: 'Echipa',
          description: 'Gestionează echipa',
          href: 'employees.html'
        },
        {
          icon: '🔧',
          title: 'Echipamente',
          description: 'Monitorizează echipamentele',
          href: 'equipment.html'
        },
        {
          icon: '👥',
          title: 'Clienți',
          description: 'Gestionează clienții',
          href: 'customers.html'
        },
        {
          icon: '🏢',
          title: 'Locații',
          description: 'Vezi locațiile',
          href: 'locations.html'
        },
        {
          icon: '💰',
          title: 'Venituri',
          description: 'Rapoarte financiare',
          href: 'revenue.html'
        }
      ],
      'EMPLOYEE': [
        {
          icon: '⏰',
          title: 'Schimbul meu',
          description: 'Pornește / închide tura',
          href: 'employee-shift.html'
        },
        {
          icon: '📋',
          title: 'Comenzile mele',
          description: 'Listă comenzi atribuite',
          href: 'orders.html'
        },
        {
          icon: '🗓️',
          title: 'Programul Meu',
          description: 'Vezi programul de lucru',
          href: 'my-schedule.html'
        },
        {
          icon: '✅',
          title: 'Servicii Active',
          description: 'Actualizează serviciile',
          href: 'active-services.html'
        },
        {
          icon: '⏰',
          title: 'Pontaj',
          description: 'Gestionează pontajul',
          href: 'timesheet.html'
        },
        {
          icon: '🔧',
          title: 'Echipamente',
          description: 'Vezi echipamentele',
          href: 'equipment.html'
        },
        {
          icon: '📝',
          title: 'Rapoarte Zilnice',
          description: 'Completează rapoarte',
          href: 'daily-reports.html'
        }
      ],
      'CUSTOMER': [
        {
          icon: '🗓️',
          title: 'Programează Serviciu',
          description: 'Creează o programare nouă',
          href: 'book-service.html'
        },
        {
          icon: '📋',
          title: 'Comenzile Mele',
          description: 'Vezi istoricul comenzilor',
          href: 'my-orders.html'
        },
        {
          icon: '💳',
          title: 'Facturi',
          description: 'Vezi facturile și plățile',
          href: 'invoices.html'
        },
        {
          icon: '⭐',
          title: 'Evaluări',
          description: 'Evaluează serviciile',
          href: 'reviews.html'
        },
        {
          icon: '🏢',
          title: 'Locații',
          description: 'Vezi locațiile disponibile',
          href: 'locations.html'
        },
        {
          icon: '📞',
          title: 'Contact',
          description: 'Contactează suportul',
          href: 'contact.html'
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
        ordersList.innerHTML = response.data.map(order => {
          // Construct customer name from first_name and last_name
          const customerName = order.customer_first_name && order.customer_last_name 
            ? `${order.customer_first_name} ${order.customer_last_name}`
            : order.customer_email || `Client #${order.customer_id}`;
          
          // Use service_name instead of service_type
          const serviceName = order.service_name || order.category || 'Serviciu necunoscut';
          
          // Ensure we have a valid order ID
          const orderId = order.order_id || order.id || 'N/A';
          
          return `
            <div class="order-item">
              <div class="order-info">
                <div class="order-id">#${orderId}</div>
                <div class="order-details">
                  ${customerName} • ${serviceName} • ${this.formatDate(order.created_at)}
                </div>
              </div>
              <span class="order-status ${(order.status || '').toLowerCase()}">${this.getStatusLabel(order.status || 'PENDING')}</span>
            </div>
          `;
        }).join('');
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
      
      if (response.success && response.data) {
        // Handle both direct array and nested structure
        const notifications = response.data.notifications || response.data || [];
        
        if (notifications.length > 0) {
          this.notifications = notifications;
          notificationsList.innerHTML = notifications.map(notification => {
            // Ensure we have valid data with fallbacks
            const notificationId = notification.notification_id || notification.id || 'N/A';
            const title = notification.title || notification.type || 'Notificare';
            const message = notification.message || 'Fără mesaj';
            const type = notification.type || 'INFO';
            const createdAt = notification.created_at || notification.timestamp || new Date().toISOString();
            const isRead = notification.is_read || notification.read || false;
            
            return `
              <div class="notification-item ${isRead ? '' : 'unread'}">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <div class="notification-content">
                  <div class="notification-title">${title}</div>
                  <div class="notification-message">${message}</div>
                  <div class="notification-time">${this.formatRelativeTime(createdAt)}</div>
                </div>
              </div>
            `;
          }).join('');
        } else {
          notificationsList.innerHTML = '<div class="loading-placeholder">Nu există notificări</div>';
        }
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
    // WebSocket disabled – exit early
    return;
    // WebSocket connection for real-time updates
    if (typeof WebSocket !== 'undefined') {
      try {
        const wsUrl = 'ws://localhost:8000/ws/status';
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
    // Only refresh recent orders, not entire dashboard stats
    this.loadRecentOrders();
    
    console.log('Order update received via WebSocket, refreshing recent orders only');
  }
  
  handleSystemStatusUpdate(status) {
    // Refresh system status
    this.loadSystemStatus();
  }

  // ===== PERIODIC REFRESH =====
  
  startPeriodicRefresh() {
    // Disabled automatic refresh - rely on WebSocket for real-time updates
    // Only refresh manually or when WebSocket indicates changes
    console.log('Periodic refresh disabled - using WebSocket for real-time updates');
    
    // Optional: Very infrequent refresh as fallback (every 10 minutes)
    this.refreshInterval = setInterval(() => {
      console.log('Fallback refresh triggered');
      this.loadSystemStatus(); // Only load system status, not all dashboard data
    }, 10 * 60 * 1000);
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
    // Handle notification types that start with specific patterns
    const typeUpper = (type || '').toUpperCase();
    
    const icons = {
      // Order related
      'ORDER_CREATED': '📋',
      'ORDER_UPDATED': '📝',
      'ORDER_COMPLETED': '✅',
      'ORDER_CANCELLED': '❌',
      'ORDER': '📋',
      
      // Equipment related
      'EQUIPMENT_FAILURE': '🔧',
      'EQUIPMENT_MAINTENANCE': '🛠️',
      'EQUIPMENT_AVAILABLE': '✅',
      'EQUIPMENT': '🔧',
      
      // Staff related
      'STAFF_SHORTAGE': '👥',
      'STAFF_AVAILABLE': '👷',
      'SHIFT_REMINDER': '⏰',
      'STAFF': '👥',
      
      // Inventory related
      'INVENTORY_LOW': '📦',
      'INVENTORY_CRITICAL': '🚨',
      'INVENTORY_RESTOCKED': '📈',
      'INVENTORY': '📦',
      
      // Transport related
      'TRANSPORT_ASSIGNED': '🚚',
      'TRANSPORT_DELAYED': '⏱️',
      'TRANSPORT_COMPLETED': '🏁',
      'TRANSPORT': '🚚',
      
      // System related
      'SYSTEM_ALERT': '🚨',
      'SYSTEM_MAINTENANCE': '⚙️',
      'SYSTEM_UPDATE': '🔄',
      'SYSTEM': '⚙️',
      
      // Customer related
      'CUSTOMER_FEEDBACK': '💬',
      'CUSTOMER_COMPLAINT': '📞',
      'CUSTOMER_REVIEW': '⭐',
      'CUSTOMER': '👤',
      
      // General
      'ALERT': '🚨',
      'WARNING': '⚠️',
      'INFO': 'ℹ️',
      'SUCCESS': '✅',
      'ERROR': '❌',
      'TEST_NOTIFICATION': '🧪',
      'GENERAL_ANNOUNCEMENT': '📢'
    };
    
    // Direct match first
    if (icons[typeUpper]) {
      return icons[typeUpper];
    }
    
    // Pattern matching for complex types
    if (typeUpper.includes('ORDER')) return '📋';
    if (typeUpper.includes('EQUIPMENT')) return '🔧';
    if (typeUpper.includes('STAFF') || typeUpper.includes('EMPLOYEE')) return '👥';
    if (typeUpper.includes('INVENTORY')) return '📦';
    if (typeUpper.includes('TRANSPORT')) return '🚚';
    if (typeUpper.includes('SYSTEM')) return '⚙️';
    if (typeUpper.includes('CUSTOMER')) return '👤';
    if (typeUpper.includes('ALERT') || typeUpper.includes('CRITICAL')) return '🚨';
    if (typeUpper.includes('WARNING')) return '⚠️';
    if (typeUpper.includes('SUCCESS') || typeUpper.includes('COMPLETED')) return '✅';
    if (typeUpper.includes('ERROR') || typeUpper.includes('FAILED')) return '❌';
    
    // Default fallback
    return '🔔';
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

// ===== INVENTORY CSV IMPORT (modal) =====
async function openImportModal(){
  const modal=document.getElementById('importModal');
  modal.style.display='flex';
  const sel=document.getElementById('importBranchSelect');
  if(sel.options.length===0){
    try{
      const resp=await authManager.apiRequest('/locations');
      if(resp.success){
        sel.innerHTML=resp.data.map(l=>`<option value="${l.id}">${l.name}</option>`).join('');
      }
    }catch(err){console.error(err);}  }
}

function closeImportModal(){
  document.getElementById('importModal').style.display='none';
  document.getElementById('importFileInput').value='';
}

async function submitImportCsv(){
  const branchId=document.getElementById('importBranchSelect').value;
  const fileInput=document.getElementById('importFileInput');
  const file=fileInput.files[0];
  if(!file){dashboard.showToast('Alege un fișier CSV','warning');return;}
  try{
    const csv=await file.text();
    const resp=await fetch(`${authManager.apiBaseUrl}/inventory/import/${branchId}`,{
      method:'POST',
      headers:{'Authorization':`Bearer ${authManager.token}`},
      body:csv
    });
    const data=await resp.json();
    if(data.success){dashboard.showToast(`Import reușit: ${data.imported}`,'success');closeImportModal();}
    else{dashboard.showToast(data.error||'Eroare import','error');}
  }catch(err){console.error(err);dashboard.showToast('Eroare rețea','error');}
}

// ===== INVENTORY VIEW MODAL =====
async function openInventoryModal(){
  const modal=document.getElementById('inventoryModal');
  modal.style.display='flex';
  // populate branches dropdown if empty
  const sel=document.getElementById('invBranchSelect');
  if(sel.options.length===0){
    try{
      const resp=await authManager.apiRequest('/locations');
      if(resp.success){
        sel.innerHTML=resp.data.map(l=>`<option value="${l.id}">${l.name}</option>`).join('');
      }
    }catch(err){console.error('branches fetch',err);}
  }
  // load first branch inventory
  if(sel.value) loadInventoryForBranch(sel.value);
}

function closeInventoryModal(){
  document.getElementById('inventoryModal').style.display='none';
}

async function renderInventoryTable(branchId, tableSelector){
  const tbody=document.querySelector(`${tableSelector} tbody`);
  tbody.innerHTML='<tr><td colspan="5">Se încarcă...</td></tr>';
  try{
    const resp=await authManager.apiRequest(`/inventory/location/${branchId}?include_zero=true`);
    if(resp.success){
      const rows = resp.data.rows || resp.data;
      tbody.innerHTML=rows.map(r=>
        `<tr><td>${r.item_name||r.item_code}</td><td>${r.qty_on_hand}</td><td>${r.unit_code||''}</td><td>${r.min_qty}</td><td>${r.expire_date||''}</td></tr>`
      ).join('') || '<tr><td colspan="5">Nicio resursă</td></tr>';
    }else{
      tbody.innerHTML=`<tr><td colspan="5">Eroare: ${resp.error}</td></tr>`;
    }
  }catch(err){
    console.error(err);
    tbody.innerHTML='<tr><td colspan="5">Eroare la comunicare</td></tr>';
  }
}

// Existing stock modal loader wraps above
async function loadInventoryForBranch(branchId){
  renderInventoryTable(branchId,'#invTable');
}

// For import modal
async function renderImportInventory(branchId){
  renderInventoryTable(branchId,'#importInvTable');
} 