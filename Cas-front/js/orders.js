// ===== ORDERS PAGE FUNCTIONALITY =====

class OrdersManager {
  constructor() {
    this.orders = [];
    this.filteredOrders = [];
    this.customers = [];
    this.locations = [];
    this.services = [];
    
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
      
      // Load initial data
      await this.loadInitialData();
      
      // Show orders content
      this.showOrders();
      
    } catch (error) {
      console.error('Orders page initialization error:', error);
      this.showError('Nu s-a putut încărca pagina de comenzi. Vă rugăm să reîncărcați pagina.');
    }
  }

  // ===== LOADING AND ERROR STATES =====
  
  showLoading() {
    document.getElementById('loadingState').style.display = 'flex';
    document.getElementById('ordersContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
  }
  
  showOrders() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('ordersContent').style.display = 'block';
    document.getElementById('errorState').style.display = 'none';
  }
  
  showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('ordersContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'flex';
    document.getElementById('errorMessage').textContent = message;
  }

  // ===== DATA LOADING =====
  
  async loadInitialData() {
    // Load all required data in parallel
    await Promise.all([
      this.loadOrders(),
      this.loadCustomers(),
      this.loadLocations(),
      this.loadServices()
    ]);
    
    // Populate filter dropdowns
    this.populateFilters();
    
    // Display orders
    this.displayOrders();
  }
  
  async loadOrders() {
    try {
      const response = await authManager.apiRequest('/orders');
      
      if (response.success) {
        this.orders = response.data || [];
        this.filteredOrders = [...this.orders];
      } else {
        throw new Error(response.error || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      this.orders = [];
      this.filteredOrders = [];
    }
  }
  
  async loadCustomers() {
    try {
      const response = await authManager.apiRequest('/customers');
      
      if (response.success) {
        this.customers = response.data || [];
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      this.customers = [];
    }
  }
  
  async loadLocations() {
    try {
      const response = await authManager.apiRequest('/locations');
      
      if (response.success) {
        this.locations = response.data || [];
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      this.locations = [];
    }
  }
  
  async loadServices() {
    try {
      const response = await authManager.apiRequest('/services');
      
      if (response.success) {
        this.services = response.data || [];
      }
    } catch (error) {
      console.error('Error loading services:', error);
      this.services = [];
    }
  }

  // ===== DISPLAY METHODS =====
  
  populateFilters() {
    // Populate location filter
    const locationFilter = document.getElementById('locationFilter');
    locationFilter.innerHTML = '<option value="">Toate locațiile</option>';
    this.locations.forEach(location => {
      locationFilter.innerHTML += `<option value="${location.location_id}">${location.name}</option>`;
    });
    
    // Populate service filter
    const serviceFilter = document.getElementById('serviceFilter');
    serviceFilter.innerHTML = '<option value="">Toate serviciile</option>';
    this.services.forEach(service => {
      serviceFilter.innerHTML += `<option value="${service.service_id}">${service.name}</option>`;
    });
    
    // Populate modal dropdowns
    this.populateModalDropdowns();
  }
  
  populateModalDropdowns() {
    // Populate customer dropdown
    const customerSelect = document.getElementById('customerId');
    customerSelect.innerHTML = '<option value="">Selectează clientul</option>';
    this.customers.forEach(customer => {
      customerSelect.innerHTML += `<option value="${customer.customer_id}">${customer.name} - ${customer.email}</option>`;
    });
    
    // Populate location dropdown
    const locationSelect = document.getElementById('locationId');
    locationSelect.innerHTML = '<option value="">Selectează locația</option>';
    this.locations.forEach(location => {
      locationSelect.innerHTML += `<option value="${location.location_id}">${location.name}</option>`;
    });
    
    // Populate service dropdown
    const serviceSelect = document.getElementById('serviceId');
    serviceSelect.innerHTML = '<option value="">Selectează serviciul</option>';
    this.services.forEach(service => {
      serviceSelect.innerHTML += `<option value="${service.service_id}">${service.name} - ${service.price} RON</option>`;
    });
  }
  
  displayOrders() {
    const tbody = document.getElementById('ordersTableBody');
    const ordersCount = document.getElementById('ordersCount');
    
    if (this.filteredOrders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="no-data">Nu au fost găsite comenzi</td></tr>';
      ordersCount.textContent = '0 comenzi';
      return;
    }
    
    tbody.innerHTML = this.filteredOrders.map(order => `
      <tr>
        <td>#${order.order_id}</td>
        <td>${this.getCustomerName(order.customer_id)}</td>
        <td>${this.getServiceName(order.service_id)}</td>
        <td>${this.getLocationName(order.location_id)}</td>
        <td><span class="status-badge status-${order.status.toLowerCase()}">${this.getStatusLabel(order.status)}</span></td>
        <td>${this.formatDate(order.created_at)}</td>
        <td>${order.total_price} RON</td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon" onclick="ordersManager.viewOrder(${order.order_id})" title="Vezi detalii">👁️</button>
            <button class="btn-icon" onclick="ordersManager.editOrder(${order.order_id})" title="Editează">✏️</button>
            ${order.status === 'PENDING' ? `<button class="btn-icon btn-danger" onclick="ordersManager.cancelOrder(${order.order_id})" title="Anulează">❌</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
    
    ordersCount.textContent = `${this.filteredOrders.length} comenzi`;
  }

  // ===== HELPER METHODS =====
  
  getCustomerName(customerId) {
    const customer = this.customers.find(c => c.customer_id === customerId);
    return customer ? customer.name : `Client #${customerId}`;
  }
  
  getServiceName(serviceId) {
    const service = this.services.find(s => s.service_id === serviceId);
    return service ? service.name : `Serviciu #${serviceId}`;
  }
  
  getLocationName(locationId) {
    const location = this.locations.find(l => l.location_id === locationId);
    return location ? location.name : `Locație #${locationId}`;
  }
  
  getStatusLabel(status) {
    const labels = {
      'PENDING': 'În așteptare',
      'CONFIRMED': 'Confirmat',
      'IN_PROGRESS': 'În progres',
      'COMPLETED': 'Finalizat',
      'CANCELLED': 'Anulat'
    };
    return labels[status] || status;
  }
  
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO') + ' ' + date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  }

  // ===== FILTERING =====
  
  applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const locationFilter = document.getElementById('locationFilter').value;
    const serviceFilter = document.getElementById('serviceFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    this.filteredOrders = this.orders.filter(order => {
      // Status filter
      if (statusFilter && order.status !== statusFilter) return false;
      
      // Location filter
      if (locationFilter && order.location_id !== parseInt(locationFilter)) return false;
      
      // Service filter
      if (serviceFilter && order.service_id !== parseInt(serviceFilter)) return false;
      
      // Date filter
      if (dateFilter) {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            if (orderDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            if (orderDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
            if (orderDate < monthAgo) return false;
            break;
        }
      }
      
      return true;
    });
    
    this.displayOrders();
  }

  // ===== ORDER ACTIONS =====
  
  async viewOrder(orderId) {
    try {
      const response = await authManager.apiRequest(`/orders/${orderId}`);
      
      if (response.success) {
        this.showOrderDetails(response.data);
      } else {
        this.showToast('Eroare la încărcarea detaliilor comenzii', 'error');
      }
    } catch (error) {
      console.error('Error viewing order:', error);
      this.showToast('Eroare la încărcarea detaliilor comenzii', 'error');
    }
  }
  
  showOrderDetails(order) {
    const modal = document.getElementById('orderDetailsModal');
    const title = document.getElementById('orderDetailsTitle');
    const content = document.getElementById('orderDetailsContent');
    
    title.textContent = `Comandă #${order.order_id}`;
    
    content.innerHTML = `
      <div class="order-details">
        <div class="details-grid">
          <div class="detail-item">
            <label>Client:</label>
            <span>${this.getCustomerName(order.customer_id)}</span>
          </div>
          <div class="detail-item">
            <label>Serviciu:</label>
            <span>${this.getServiceName(order.service_id)}</span>
          </div>
          <div class="detail-item">
            <label>Locație:</label>
            <span>${this.getLocationName(order.location_id)}</span>
          </div>
          <div class="detail-item">
            <label>Status:</label>
            <span class="status-badge status-${order.status.toLowerCase()}">${this.getStatusLabel(order.status)}</span>
          </div>
          <div class="detail-item">
            <label>Data creării:</label>
            <span>${this.formatDate(order.created_at)}</span>
          </div>
          <div class="detail-item">
            <label>Data programată:</label>
            <span>${order.scheduled_date ? this.formatDate(order.scheduled_date) : 'Nu este programată'}</span>
          </div>
          <div class="detail-item">
            <label>Preț total:</label>
            <span>${order.total_price} RON</span>
          </div>
          <div class="detail-item">
            <label>Transport:</label>
            <span>${order.needs_transport ? 'Da' : 'Nu'}</span>
          </div>
          ${order.notes ? `
          <div class="detail-item full-width">
            <label>Observații:</label>
            <span>${order.notes}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
  }

  // ===== MODAL MANAGEMENT =====
  
  showCreateOrderModal() {
    document.getElementById('createOrderModal').style.display = 'flex';
  }
  
  closeCreateOrderModal() {
    document.getElementById('createOrderModal').style.display = 'none';
    document.getElementById('createOrderForm').reset();
  }
  
  closeOrderDetailsModal() {
    document.getElementById('orderDetailsModal').style.display = 'none';
  }

  // ===== TOAST NOTIFICATIONS =====
  
  showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, duration);
  }
}

// Global functions for HTML onclick handlers
async function refreshOrders() {
  await ordersManager.loadOrders();
  ordersManager.applyFilters();
  ordersManager.showToast('Comenzile au fost reîmprospătate', 'success');
}

function showCreateOrderModal() {
  ordersManager.showCreateOrderModal();
}

function closeCreateOrderModal() {
  ordersManager.closeCreateOrderModal();
}

function closeOrderDetailsModal() {
  ordersManager.closeOrderDetailsModal();
}

function applyFilters() {
  ordersManager.applyFilters();
}

async function createOrder() {
  // Implementation for creating new order
  ordersManager.showToast('Funcționalitatea de creare comenzi va fi implementată', 'info');
}

// Initialize orders manager when page loads
let ordersManager;
document.addEventListener('DOMContentLoaded', () => {
  ordersManager = new OrdersManager();
}); 