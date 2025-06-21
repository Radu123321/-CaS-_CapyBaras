// ===== CaS DASHBOARD - INTEGRARE ENDPOINT-URI =====
// Sistem Web pentru managementul spălătoriilor
// JavaScript pur cu fetch API - fără framework-uri externe

class CaSDashboard {
  constructor() {
    this.baseURL = 'http://localhost:8000/api';
    this.token = localStorage.getItem('authToken');
    this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.websocket = null;
    this.refreshInterval = null;
    
    this.init();
  }

  // ===== INIȚIALIZARE =====
  async init() {
    if (!this.checkAuth()) {
      window.location.href = 'login.html';
      return;
    }

    try {
      this.showLoading();
      await this.loadDashboardData();
      this.setupWebSocket();
      this.startPeriodicRefresh();
      this.showDashboard();
    } catch (error) {
      console.error('Dashboard init error:', error);
      this.showError('Eroare la încărcarea dashboard-ului');
    }
  }

  // ===== AUTENTIFICARE =====
  checkAuth() {
    return this.token && this.currentUser.id;
  }

  async apiRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    };

    const config = { ...defaultOptions, ...options };
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // ===== UI STATES =====
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

  // ===== ÎNCĂRCARE DATE DASHBOARD =====
  async loadDashboardData() {
    // Actualizare mesaj de bun venit
    document.getElementById('welcomeTitle').textContent = `Bun venit în CaS Management!`;
    document.getElementById('welcomeSubtitle').textContent = `Dashboard pentru gestionarea spălătoriilor`;

    // Încărcare statistici principale
    await this.loadMainStats();
    
    // Încărcare widget-uri principale
    await this.loadLocations();
    await this.loadServices();
    await this.loadRecentOrders();
    await this.loadInventoryStatus();
    await this.loadEquipmentStatus();
    await this.loadSystemStatus();
    
    // Încărcare widget-uri suplimentare
    await this.loadCustomers();
    await this.loadEmployees();
    await this.loadActiveTransports();
    await this.loadWeatherData();
    await this.loadRSSFeeds();
    
    // Solicitare permisiuni notificări browser
    await this.requestNotificationPermission();
  }

  // ===== STATISTICI PRINCIPALE =====
  async loadMainStats() {
    try {
      // Încărcare locații
      const locationsResponse = await this.apiRequest('/locations');
      const totalLocations = locationsResponse.success ? locationsResponse.data.length : 0;
      
      // Încărcare comenzi active
      const ordersResponse = await this.apiRequest('/orders?status=IN_PROGRESS');
      const activeOrders = ordersResponse.success ? ordersResponse.data.length : 0;
      
      // Încărcare venituri (simulat - ar trebui implementat endpoint specific)
      const todayRevenue = await this.calculateTodayRevenue();
      
      // Actualizare UI
      document.getElementById('totalLocations').textContent = totalLocations;
      document.getElementById('activeOrders').textContent = activeOrders;
      document.getElementById('totalRevenue').textContent = `${todayRevenue} RON`;
      
    } catch (error) {
      console.error('Error loading main stats:', error);
    }
  }

  async calculateTodayRevenue() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const ordersResponse = await this.apiRequest(`/orders?status=COMPLETED&date=${today}`);
      
      if (ordersResponse.success) {
        return ordersResponse.data.reduce((total, order) => total + (order.total_price || 0), 0);
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  // ===== GESTIONARE LOCAȚII =====
  async loadLocations() {
    try {
      const response = await this.apiRequest('/locations');
      
      if (response.success) {
        this.displayLocations(response.data);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  }

  displayLocations(locations) {
    const container = this.getOrCreateWidget('locations', 'Locații Spălătorii');
    
    container.innerHTML = `
      <div class="widget-header">
        <h3>Locații Spălătorii (${locations.length})</h3>
        <button onclick="dashboard.showAddLocationModal()" class="btn-add">+ Adaugă</button>
      </div>
      <div class="widget-content">
        ${locations.map(location => `
          <div class="location-item" data-id="${location.location_id}">
            <div class="location-info">
              <h4>${location.name}</h4>
              <p>${location.address}</p>
              ${location.latitude && location.longitude ? 
                `<small>GPS: ${location.latitude}, ${location.longitude}</small>` : ''}
            </div>
            <div class="location-actions">
              <button onclick="dashboard.editLocation(${location.location_id})" class="btn-edit">✏️</button>
              <button onclick="dashboard.deleteLocation(${location.location_id})" class="btn-delete">🗑️</button>
              <button onclick="dashboard.viewLocationDetails(${location.location_id})" class="btn-view">👁️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ===== GESTIONARE SERVICII =====
  async loadServices() {
    try {
      const response = await this.apiRequest('/services');
      
      if (response.success) {
        this.displayServices(response.data);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  }

  displayServices(services) {
    const container = this.getOrCreateWidget('services', 'Servicii Disponibile');
    
    container.innerHTML = `
      <div class="widget-header">
        <h3>Servicii (${services.length})</h3>
        <button onclick="dashboard.showAddServiceModal()" class="btn-add">+ Adaugă</button>
      </div>
      <div class="widget-content">
        ${services.map(service => `
          <div class="service-item" data-id="${service.service_id}">
            <div class="service-info">
              <h4>${this.getServiceTypeLabel(service.service_type)}</h4>
              <p>${service.description}</p>
              <span class="service-price">${service.base_price} RON</span>
            </div>
            <div class="service-actions">
              <button onclick="dashboard.editService(${service.service_id})" class="btn-edit">✏️</button>
              <button onclick="dashboard.deleteService(${service.service_id})" class="btn-delete">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  getServiceTypeLabel(type) {
    const labels = {
      'CARPET': 'Curățare Covoare',
      'CAR_WASH': 'Spălare Auto',
      'GARMENT': 'Curățare Îmbrăcăminte',
      'OTHER': 'Alte Servicii'
    };
    return labels[type] || type;
  }

  // ===== GESTIONARE COMENZI =====
  async loadRecentOrders() {
    try {
      const response = await this.apiRequest('/orders?limit=10&sort=created_at:desc');
      
      if (response.success) {
        this.displayRecentOrders(response.data);
      }
    } catch (error) {
      console.error('Error loading recent orders:', error);
    }
  }

  displayRecentOrders(orders) {
    const container = this.getOrCreateWidget('recent-orders', 'Comenzi Recente');
    
    container.innerHTML = `
      <div class="widget-header">
        <h3>Comenzi Recente</h3>
        <button onclick="dashboard.showAllOrders()" class="btn-view-all">Vezi toate</button>
      </div>
      <div class="widget-content">
        ${orders.length > 0 ? orders.map(order => `
          <div class="order-item" data-id="${order.order_id}">
            <div class="order-info">
              <div class="order-id">#${order.order_id}</div>
              <div class="order-details">
                <p>Client: ${order.customer_name || 'N/A'}</p>
                <p>Locație: ${order.location_name || 'N/A'}</p>
                <p>Data: ${this.formatDate(order.created_at)}</p>
                ${order.total_price ? `<p>Total: ${order.total_price} RON</p>` : ''}
              </div>
            </div>
            <div class="order-status">
              <span class="status-badge ${order.status.toLowerCase()}">${this.getOrderStatusLabel(order.status)}</span>
              <div class="order-actions">
                <button onclick="dashboard.viewOrderDetails(${order.order_id})" class="btn-view">👁️</button>
                <button onclick="dashboard.updateOrderStatus(${order.order_id})" class="btn-edit">📝</button>
              </div>
            </div>
          </div>
        `).join('') : '<p class="no-data">Nu există comenzi recente</p>'}
      </div>
    `;
  }

  getOrderStatusLabel(status) {
    const labels = {
      'PENDING': 'În Așteptare',
      'SCHEDULED': 'Programată',
      'IN_PROGRESS': 'În Progres',
      'COMPLETED': 'Completată',
      'CANCELLED': 'Anulată'
    };
    return labels[status] || status;
  }

  // ===== GESTIONARE INVENTAR =====
  async loadInventoryStatus() {
    try {
      const response = await this.apiRequest('/inventory/alerts');
      
      if (response.success) {
        this.displayInventoryStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading inventory status:', error);
    }
  }

  displayInventoryStatus(alerts) {
    const container = this.getOrCreateWidget('inventory-status', 'Status Inventar');
    
    container.innerHTML = `
      <div class="widget-header">
        <h3>Status Inventar</h3>
        <button onclick="dashboard.showInventoryManagement()" class="btn-manage">Gestionează</button>
      </div>
      <div class="widget-content">
        ${alerts.length > 0 ? `
          <div class="alerts-list">
            ${alerts.map(alert => `
              <div class="alert-item ${alert.severity.toLowerCase()}">
                <span class="alert-icon">${this.getAlertIcon(alert.severity)}</span>
                <div class="alert-content">
                  <p><strong>${alert.resource_name}</strong></p>
                  <p>Locație: ${alert.location_name}</p>
                  <p>Cantitate: ${alert.current_quantity} ${alert.unit}</p>
                  <p>Minim: ${alert.min_stock} ${alert.unit}</p>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="no-alerts">✅ Toate resursele sunt la nivel optim</p>'}
      </div>
    `;
  }

  getAlertIcon(severity) {
    const icons = {
      'CRITICAL': '🚨',
      'WARNING': '⚠️',
      'INFO': 'ℹ️'
    };
    return icons[severity] || 'ℹ️';
  }

  // ===== GESTIONARE ECHIPAMENTE =====
  async loadEquipmentStatus() {
    try {
      const response = await this.apiRequest('/equipment/statuses');
      
      if (response.success) {
        this.displayEquipmentStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading equipment status:', error);
    }
  }

  displayEquipmentStatus(equipment) {
    const container = this.getOrCreateWidget('equipment-status', 'Status Echipamente');
    
    const statusCounts = equipment.reduce((acc, eq) => {
      acc[eq.status] = (acc[eq.status] || 0) + 1;
      return acc;
    }, {});

    container.innerHTML = `
      <div class="widget-header">
        <h3>Status Echipamente</h3>
        <button onclick="dashboard.showEquipmentManagement()" class="btn-manage">Gestionează</button>
      </div>
      <div class="widget-content">
        <div class="status-summary">
          <div class="status-item operative">
            <span class="count">${statusCounts.OPERATIVE || 0}</span>
            <span class="label">Operaționale</span>
          </div>
          <div class="status-item maintenance">
            <span class="count">${statusCounts.UNDER_MAINTENANCE || 0}</span>
            <span class="label">În Mentenanță</span>
          </div>
          <div class="status-item offline">
            <span class="count">${statusCounts.OUT_OF_SERVICE || 0}</span>
            <span class="label">Defecte</span>
          </div>
        </div>
        <div class="equipment-list">
          ${equipment.slice(0, 5).map(eq => `
            <div class="equipment-item">
              <span class="equipment-name">${eq.name}</span>
              <span class="equipment-location">${eq.location_name}</span>
              <span class="equipment-status ${eq.status.toLowerCase()}">${eq.status}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ===== STATUS SISTEM =====
  async loadSystemStatus() {
    try {
      // Test conectivitate API
      const pingResponse = await this.apiRequest('/ping');
      const isOnline = pingResponse.status === 'ok';
      
      this.displaySystemStatus({
        api: isOnline,
        database: isOnline, // Presupunem că dacă API răspunde, DB-ul funcționează
        websocket: this.websocket && this.websocket.readyState === WebSocket.OPEN,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.displaySystemStatus({
        api: false,
        database: false,
        websocket: false,
        timestamp: new Date().toISOString()
      });
    }
  }

  displaySystemStatus(status) {
    const container = this.getOrCreateWidget('system-status', 'Status Sistem');
    
    container.innerHTML = `
      <div class="widget-header">
        <h3>Status Sistem</h3>
        <button onclick="dashboard.refreshSystemStatus()" class="btn-refresh">🔄</button>
      </div>
      <div class="widget-content">
        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">API Server</span>
            <span class="status-indicator ${status.api ? 'online' : 'offline'}">
              ${status.api ? '🟢' : '🔴'}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">Baza de Date</span>
            <span class="status-indicator ${status.database ? 'online' : 'offline'}">
              ${status.database ? '🟢' : '🔴'}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">WebSocket</span>
            <span class="status-indicator ${status.websocket ? 'online' : 'offline'}">
              ${status.websocket ? '🟢' : '🔴'}
            </span>
          </div>
        </div>
        <div class="status-info">
          <p>Ultima actualizare: ${this.formatDate(status.timestamp)}</p>
        </div>
      </div>
    `;
  }

  // ===== WEBSOCKET PENTRU TIMP REAL =====
  setupWebSocket() {
    try {
      const wsUrl = 'ws://localhost:8000/ws';
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
        setTimeout(() => this.setupWebSocket(), 5000); // Reconnect
      };
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket setup error:', error);
    }
  }

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'order_update':
        this.loadRecentOrders();
        this.loadMainStats();
        this.showToast(`Comandă #${message.data.order_id} actualizată`, 'info');
        this.showBrowserNotification('Actualizare Comandă', `Comandă #${message.data.order_id} actualizată`, 'info');
        break;
      case 'inventory_alert':
        this.loadInventoryStatus();
        this.showToast(`Alertă inventar: ${message.data.message}`, 'warning');
        this.showBrowserNotification('Alertă Inventar', message.data.message, 'warning');
        break;
      case 'equipment_status':
        this.loadEquipmentStatus();
        this.showToast(`Status echipament actualizat`, 'info');
        break;
      case 'transport_update':
        this.loadActiveTransports();
        this.showToast(`Transport #${message.data.transport_id} actualizat`, 'info');
        break;
      case 'weather_update':
        this.loadWeatherData();
        this.showToast('Date meteo actualizate', 'info');
        break;
      case 'staff_unavailable':
        this.loadEmployees();
        this.showToast('Indisponibilitate personal raportată', 'warning');
        this.showBrowserNotification('Alertă Personal', message.data.message, 'warning');
        break;
      case 'power_outage':
        this.loadSystemStatus();
        this.showToast('Pană de curent detectată', 'error');
        this.showBrowserNotification('Alertă Critică', 'Pană de curent detectată', 'error');
        break;
      case 'system_notification':
        this.showToast(message.data.message, message.data.type || 'info');
        this.showBrowserNotification('Notificare Sistem', message.data.message, message.data.type || 'info');
        break;
    }
  }

  // ===== RSS FEEDS =====
  async loadRSSFeeds() {
    const container = this.getOrCreateWidget('rss-feeds', 'RSS Feeds');
    
    container.innerHTML = `
      <div class="widget-header">
        <h3>RSS Feeds</h3>
        <button onclick="dashboard.refreshRSSFeeds()" class="btn-refresh">🔄</button>
      </div>
      <div class="widget-content">
        <div class="rss-links">
          <a href="/rss" target="_blank" class="rss-link">
            🌐 Feed General Sistem
          </a>
          <a href="/rss/orders" target="_blank" class="rss-link">
            📋 Feed Actualizări Comenzi
          </a>
          <a href="/rss/inventory" target="_blank" class="rss-link">
            📦 Feed Alerte Inventar
          </a>
        </div>
      </div>
    `;
  }

  // ===== NOTIFICĂRI BROWSER =====
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.showToast('Notificările browser au fost activate', 'success');
      }
    }
  }

  showBrowserNotification(title, message, type = 'info') {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'cas-notification'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    }
  }

  // ===== GESTIONARE CLIENȚI =====
  async loadCustomers() {
    try {
      const response = await this.apiRequest('/customers');
      
      if (response.success) {
        this.displayCustomers(response.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }

  displayCustomers(customers) {
    const container = this.getOrCreateWidget('customers', 'Clienți');
    
    container.innerHTML = `
      <div class="widget-header">
        <h3>Clienți (${customers.length})</h3>
        <button onclick="dashboard.showAddCustomerModal()" class="btn-add">+ Adaugă</button>
      </div>
      <div class="widget-content">
        ${customers.slice(0, 5).map(customer => `
          <div class="customer-item" data-id="${customer.customer_id}">
            <div class="customer-info">
              <h4>${customer.full_name || customer.email}</h4>
              <p>${customer.address || 'Adresă nespecificată'}</p>
              <p>📞 ${customer.phone || 'Telefon nespecificat'}</p>
            </div>
            <div class="customer-actions">
              <button onclick="dashboard.editCustomer(${customer.customer_id})" class="btn-edit">✏️</button>
              <button onclick="dashboard.viewCustomerOrders(${customer.customer_id})" class="btn-view">📋</button>
            </div>
          </div>
        `).join('')}
        ${customers.length > 5 ? `<p class="show-more">și încă ${customers.length - 5} clienți...</p>` : ''}
      </div>
    `;
  }

  // ===== GESTIONARE ANGAJAȚI =====
  async loadEmployees() {
    try {
      const response = await this.apiRequest('/employees');
      
      if (response.success) {
        this.displayEmployees(response.data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  }

  displayEmployees(employees) {
    const container = this.getOrCreateWidget('employees', 'Angajați');
    
    container.innerHTML = `
      <div class="widget-header">
        <h3>Angajați (${employees.length})</h3>
        <button onclick="dashboard.showAddEmployeeModal()" class="btn-add">+ Adaugă</button>
      </div>
      <div class="widget-content">
        ${employees.slice(0, 5).map(employee => `
          <div class="employee-item" data-id="${employee.employee_id}">
            <div class="employee-info">
              <h4>${employee.full_name}</h4>
              <p>Poziție: ${employee.job_title || employee.employee_type}</p>
              <p>Locație: ${employee.location_name || 'Nespecificată'}</p>
              <p>Salariu: ${employee.salary ? employee.salary + ' RON' : 'Nespecificat'}</p>
            </div>
            <div class="employee-actions">
              <button onclick="dashboard.editEmployee(${employee.employee_id})" class="btn-edit">✏️</button>
              <button onclick="dashboard.viewEmployeeSchedule(${employee.employee_id})" class="btn-view">📅</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ===== GESTIONARE TRANSPORT =====
  async loadActiveTransports() {
    try {
      const response = await this.apiRequest('/transports/active');
      
      if (response.success) {
        this.displayActiveTransports(response.data);
      }
    } catch (error) {
      console.error('Error loading active transports:', error);
    }
  }

  displayActiveTransports(transports) {
    const container = this.getOrCreateWidget('active-transports', 'Transport Activ');
    
    container.innerHTML = `
      <div class="widget-header">
        <h3>Transport Activ (${transports.length})</h3>
        <button onclick="dashboard.showAllTransports()" class="btn-view-all">Vezi toate</button>
      </div>
      <div class="widget-content">
        ${transports.length > 0 ? transports.map(transport => `
          <div class="transport-item" data-id="${transport.transport_id}">
            <div class="transport-info">
              <div class="transport-id">#${transport.transport_id}</div>
              <p>Comandă: #${transport.order_id}</p>
              <p>Status: ${this.getTransportStatusLabel(transport.status)}</p>
              <p>Șofer: ${transport.driver_name || 'Neatribuit'}</p>
            </div>
            <div class="transport-actions">
              <button onclick="dashboard.updateTransportStatus(${transport.transport_id})" class="btn-edit">📝</button>
              <button onclick="dashboard.trackTransport(${transport.transport_id})" class="btn-view">📍</button>
            </div>
          </div>
        `).join('') : '<p class="no-data">Nu există transport activ</p>'}
      </div>
    `;
  }

  getTransportStatusLabel(status) {
    const labels = {
      'NOT_REQUIRED': 'Nu este necesar',
      'PLANNED': 'Planificat',
      'ON_ROUTE': 'În drum',
      'ARRIVED': 'Sosit',
      'FINISHED': 'Finalizat'
    };
    return labels[status] || status;
  }

  // ===== MONITORIZARE METEO =====
  async loadWeatherData() {
    try {
      const response = await this.apiRequest('/weather/current');
      
      if (response.success) {
        this.displayWeatherData(response.data);
      }
    } catch (error) {
      console.error('Error loading weather data:', error);
    }
  }

  displayWeatherData(weatherData) {
    const container = this.getOrCreateWidget('weather-status', 'Condiții Meteo');
    
    container.innerHTML = `
      <div class="widget-header">
        <h3>Condiții Meteo</h3>
        <button onclick="dashboard.refreshWeatherData()" class="btn-refresh">🔄</button>
      </div>
      <div class="widget-content">
        ${weatherData.length > 0 ? weatherData.map(weather => `
          <div class="weather-item">
            <div class="weather-location">
              <h4>${weather.location_name}</h4>
            </div>
            <div class="weather-details">
              <div class="weather-temp">${weather.temperature}°C</div>
              <div class="weather-condition">${weather.description}</div>
              <div class="weather-impact ${weather.impact_level?.toLowerCase() || 'normal'}">
                Impact: ${weather.impact_level || 'Normal'}
              </div>
            </div>
          </div>
        `).join('') : '<p class="no-data">Date meteo indisponibile</p>'}
      </div>
    `;
  }

  // ===== ACȚIUNI CRUD =====
  
  // Locații
  async showAddLocationModal() {
    const modal = this.createModal('Adaugă Locație', `
      <form id="addLocationForm">
        <div class="form-group">
          <label>Nume:</label>
          <input type="text" name="name" required>
        </div>
        <div class="form-group">
          <label>Adresă:</label>
          <textarea name="address" required></textarea>
        </div>
        <div class="form-group">
          <label>Latitudine:</label>
          <input type="number" name="latitude" step="any">
        </div>
        <div class="form-group">
          <label>Longitudine:</label>
          <input type="number" name="longitude" step="any">
        </div>
      </form>
    `, async () => {
      const form = document.getElementById('addLocationForm');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      try {
        const response = await this.apiRequest('/locations', {
          method: 'POST',
          body: data
        });
        
        if (response.success) {
          this.showToast('Locația a fost adăugată cu succes', 'success');
          this.loadLocations();
          this.closeModal();
        }
      } catch (error) {
        this.showToast('Eroare la adăugarea locației', 'error');
      }
    });
  }

  async editLocation(locationId) {
    try {
      const response = await this.apiRequest(`/locations/${locationId}`);
      if (response.success) {
        const location = response.data;
        
        const modal = this.createModal('Editează Locația', `
          <form id="editLocationForm">
            <div class="form-group">
              <label>Nume:</label>
              <input type="text" name="name" value="${location.name}" required>
            </div>
            <div class="form-group">
              <label>Adresă:</label>
              <textarea name="address" required>${location.address}</textarea>
            </div>
          </form>
        `, async () => {
          const form = document.getElementById('editLocationForm');
          const formData = new FormData(form);
          const data = Object.fromEntries(formData);
          
          try {
            const updateResponse = await this.apiRequest(`/locations/${locationId}`, {
              method: 'PUT',
              body: data
            });
            
            if (updateResponse.success) {
              this.showToast('Locația a fost actualizată', 'success');
              this.loadLocations();
              this.closeModal();
            }
          } catch (error) {
            this.showToast('Eroare la actualizarea locației', 'error');
          }
        });
      }
    } catch (error) {
      this.showToast('Eroare la încărcarea datelor locației', 'error');
    }
  }

  async deleteLocation(locationId) {
    if (confirm('Ești sigur că vrei să ștergi această locație?')) {
      try {
        const response = await this.apiRequest(`/locations/${locationId}`, {
          method: 'DELETE'
        });
        
        if (response.success) {
          this.showToast('Locația a fost ștearsă', 'success');
          this.loadLocations();
        }
      } catch (error) {
        this.showToast('Eroare la ștergerea locației', 'error');
      }
    }
  }

  // Servicii
  async showAddServiceModal() {
    const modal = this.createModal('Adaugă Serviciu', `
      <form id="addServiceForm">
        <div class="form-group">
          <label>Tip Serviciu:</label>
          <select name="service_type" required>
            <option value="CARPET">Curățare Covoare</option>
            <option value="CAR_WASH">Spălare Auto</option>
            <option value="GARMENT">Curățare Îmbrăcăminte</option>
            <option value="OTHER">Alte Servicii</option>
          </select>
        </div>
        <div class="form-group">
          <label>Descriere:</label>
          <textarea name="description" required></textarea>
        </div>
        <div class="form-group">
          <label>Preț de bază (RON):</label>
          <input type="number" name="base_price" step="0.01" required>
        </div>
      </form>
    `, async () => {
      const form = document.getElementById('addServiceForm');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      try {
        const response = await this.apiRequest('/services', {
          method: 'POST',
          body: data
        });
        
        if (response.success) {
          this.showToast('Serviciul a fost adăugat cu succes', 'success');
          this.loadServices();
          this.closeModal();
        }
      } catch (error) {
        this.showToast('Eroare la adăugarea serviciului', 'error');
      }
    });
  }

  async editService(serviceId) {
    try {
      const response = await this.apiRequest(`/services/${serviceId}`);
      if (response.success) {
        const service = response.data;
        
        const modal = this.createModal('Editează Serviciul', `
          <form id="editServiceForm">
            <div class="form-group">
              <label>Descriere:</label>
              <textarea name="description" required>${service.description}</textarea>
            </div>
            <div class="form-group">
              <label>Preț de bază (RON):</label>
              <input type="number" name="base_price" step="0.01" value="${service.base_price}" required>
            </div>
          </form>
        `, async () => {
          const form = document.getElementById('editServiceForm');
          const formData = new FormData(form);
          const data = Object.fromEntries(formData);
          
          try {
            const updateResponse = await this.apiRequest(`/services/${serviceId}`, {
              method: 'PUT',
              body: data
            });
            
            if (updateResponse.success) {
              this.showToast('Serviciul a fost actualizat', 'success');
              this.loadServices();
              this.closeModal();
            }
          } catch (error) {
            this.showToast('Eroare la actualizarea serviciului', 'error');
          }
        });
      }
    } catch (error) {
      this.showToast('Eroare la încărcarea datelor serviciului', 'error');
    }
  }

  async deleteService(serviceId) {
    if (confirm('Ești sigur că vrei să ștergi acest serviciu?')) {
      try {
        const response = await this.apiRequest(`/services/${serviceId}`, {
          method: 'DELETE'
        });
        
        if (response.success) {
          this.showToast('Serviciul a fost șters', 'success');
          this.loadServices();
        }
      } catch (error) {
        this.showToast('Eroare la ștergerea serviciului', 'error');
      }
    }
  }

  // ===== UTILITĂȚI UI =====
  getOrCreateWidget(id, title) {
    let widget = document.getElementById(`widget-${id}`);
    if (!widget) {
      widget = document.createElement('div');
      widget.id = `widget-${id}`;
      widget.className = 'widget';
      
      const widgetsContainer = document.querySelector('.widgets-grid') || 
                              document.querySelector('.dashboard-widgets') ||
                              document.getElementById('dashboardContent');
      widgetsContainer.appendChild(widget);
    }
    return widget;
  }

  createModal(title, content, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="dashboard.closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="dashboard.closeModal()">Anulează</button>
          <button class="btn btn-primary" id="modalConfirmBtn">Salvează</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('modalConfirmBtn').onclick = onConfirm;
    
    return modal;
  }

  closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      modal.remove();
    }
  }

  showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    const container = document.getElementById('toastContainer') || document.body;
    container.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, duration);
  }

  // ===== FORMATARE DATE =====
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO') + ' ' + date.toLocaleTimeString('ro-RO');
  }

  // ===== REFRESH PERIODIC =====
  startPeriodicRefresh() {
    this.refreshInterval = setInterval(() => {
      this.loadMainStats();
      this.loadRecentOrders();
      this.loadInventoryStatus();
      this.loadEquipmentStatus();
    }, 30000); // Refresh la 30 secunde
  }

  stopPeriodicRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // ===== CLEANUP =====
  destroy() {
    this.stopPeriodicRefresh();
    if (this.websocket) {
      this.websocket.close();
    }
  }
}

// ===== FUNCȚII GLOBALE =====
let dashboard;

// Inițializare dashboard când pagina se încarcă
document.addEventListener('DOMContentLoaded', () => {
  dashboard = new CaSDashboard();
});

// Funcții pentru butoanele din HTML
async function refreshRecentOrders() {
  await dashboard.loadRecentOrders();
}

async function refreshSystemStatus() {
  await dashboard.loadSystemStatus();
}

function showAllOrders() {
  window.location.href = 'orders.html';
}

function showInventoryManagement() {
  window.location.href = 'inventory.html';
}

function showEquipmentManagement() {
  window.location.href = 'equipment.html';
}

function showAllTransports() {
  window.location.href = 'transports.html';
}

async function refreshWeatherData() {
  if (dashboard) {
    await dashboard.loadWeatherData();
  }
}

async function refreshRSSFeeds() {
  if (dashboard) {
    await dashboard.loadRSSFeeds();
  }
}

// Funcții pentru gestionarea alertelor și excepțiilor
async function sendTestAlert() {
  try {
    const response = await dashboard.apiRequest('/alerts/test-email', { method: 'GET' });
    if (response.success) {
      dashboard.showToast('Email de test trimis cu succes', 'success');
    }
  } catch (error) {
    dashboard.showToast('Eroare la trimiterea email-ului de test', 'error');
  }
}

async function triggerEquipmentFailure(equipmentId) {
  try {
    const response = await dashboard.apiRequest('/alerts/equipment-failure', {
      method: 'POST',
      body: { equipment_id: equipmentId }
    });
    if (response.success) {
      dashboard.showToast('Alertă echipament trimisă', 'warning');
      dashboard.showBrowserNotification('Alertă Echipament', 'Un echipament necesită atenție', 'warning');
    }
  } catch (error) {
    dashboard.showToast('Eroare la trimiterea alertei', 'error');
  }
}

async function triggerInventoryAlert(locationId, resourceId) {
  try {
    const response = await dashboard.apiRequest('/alerts/critical-inventory', {
      method: 'POST',
      body: { location_id: locationId, resource_id: resourceId }
    });
    if (response.success) {
      dashboard.showToast('Alertă inventar trimisă', 'warning');
      dashboard.showBrowserNotification('Alertă Inventar', 'Stoc critic detectat', 'warning');
    }
  } catch (error) {
    dashboard.showToast('Eroare la trimiterea alertei', 'error');
  }
}

// Funcții pentru RSS
function openRSSFeed(feedType) {
  const feedUrls = {
    'general': '/rss',
    'orders': '/rss/orders',
    'inventory': '/rss/inventory',
    'location': (id) => `/rss/location/${id}`
  };
  
  const url = typeof feedUrls[feedType] === 'function' ? 
    feedUrls[feedType](arguments[1]) : feedUrls[feedType];
  
  if (url) {
    window.open(url, '_blank');
  }
}

// Funcții pentru statistici și raportare
async function generateDailyReport() {
  try {
    const response = await dashboard.apiRequest('/stats/reports', {
      method: 'POST',
      body: { 
        type: 'daily',
        date: new Date().toISOString().split('T')[0]
      }
    });
    
    if (response.success) {
      dashboard.showToast('Raport zilnic generat cu succes', 'success');
    }
  } catch (error) {
    dashboard.showToast('Eroare la generarea raportului', 'error');
  }
}

// Funcții pentru WebSocket și timp real
function subscribeToLocationUpdates(locationId) {
  if (dashboard.websocket && dashboard.websocket.readyState === WebSocket.OPEN) {
    dashboard.websocket.send(JSON.stringify({
      type: 'subscribe',
      locationId: locationId
    }));
  }
}

// Funcții pentru gestionarea excepțiilor
async function reportStaffUnavailability(employeeId, reason) {
  try {
    const response = await dashboard.apiRequest('/alerts/staff-unavailable', {
      method: 'POST',
      body: { 
        employee_id: employeeId,
        reason: reason,
        timestamp: new Date().toISOString()
      }
    });
    
    if (response.success) {
      dashboard.showToast('Indisponibilitate personal raportată', 'warning');
      dashboard.showBrowserNotification(
        'Alertă Personal', 
        'Indisponibilitate personal raportată', 
        'warning'
      );
    }
  } catch (error) {
    dashboard.showToast('Eroare la raportarea indisponibilității', 'error');
  }
}

async function reportPowerOutage(locationId) {
  try {
    const response = await dashboard.apiRequest('/alerts/power-outage', {
      method: 'POST',
      body: { 
        location_id: locationId,
        timestamp: new Date().toISOString()
      }
    });
    
    if (response.success) {
      dashboard.showToast('Pană de curent raportată', 'error');
      dashboard.showBrowserNotification(
        'Alertă Critică', 
        'Pană de curent detectată', 
        'error'
      );
    }
  } catch (error) {
    dashboard.showToast('Eroare la raportarea pănii de curent', 'error');
  }
}

// Funcții pentru monitorizarea în timp real
function startRealTimeMonitoring() {
  // Monitorizare status echipamente
  setInterval(async () => {
    try {
      const response = await dashboard.apiRequest('/equipment/check-status', { method: 'POST' });
      if (response.success && response.data.alerts) {
        response.data.alerts.forEach(alert => {
          dashboard.showBrowserNotification(
            'Alertă Echipament',
            alert.message,
            alert.severity.toLowerCase()
          );
        });
      }
    } catch (error) {
      console.error('Equipment monitoring error:', error);
    }
  }, 60000); // Check every minute

  // Monitorizare inventar
  setInterval(async () => {
    try {
      const response = await dashboard.apiRequest('/inventory/low-stock');
      if (response.success && response.data.length > 0) {
        response.data.forEach(item => {
          dashboard.showBrowserNotification(
            'Alertă Inventar',
            `Stoc scăzut: ${item.resource_name} la ${item.location_name}`,
            'warning'
          );
        });
      }
    } catch (error) {
      console.error('Inventory monitoring error:', error);
    }
  }, 300000); // Check every 5 minutes
}

// Inițializare monitorizare la încărcarea dashboard-ului
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (dashboard) {
      startRealTimeMonitoring();
    }
  }, 5000); // Start monitoring after 5 seconds
});

// Cleanup la închiderea paginii
window.addEventListener('beforeunload', () => {
  if (dashboard) {
    dashboard.destroy();
  }
}); 