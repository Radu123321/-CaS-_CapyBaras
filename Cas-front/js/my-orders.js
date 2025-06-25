class MyOrders {
  constructor() {
    this.orders = [];
    this.services = [];
    this.locations = [];
    this.currentUser = null;
  }

  async init() {
    try {
      this.showLoading();
      
      // Get current user info
      this.currentUser = authManager.currentUser;
      if (!this.currentUser) {
        // Try to get user profile from API
        this.currentUser = await authManager.getUserProfile();
        if (!this.currentUser) {
          window.location.href = 'login.html';
          return;
        }
      }

      // Update user welcome message
      this.updateUserDisplay();

      // Load initial data
      await this.loadInitialData();
      await this.loadOrders();
    } catch (error) {
      console.error('Error initializing My Orders:', error);
      this.showToast('Eroare la încărcarea paginii', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async loadInitialData() {
    try {
      // Load services and locations in parallel
      const [servicesResponse, locationsResponse] = await Promise.all([
        authManager.apiRequest('/services'),
        authManager.apiRequest('/locations')
      ]);

      if (servicesResponse.success) {
        this.services = servicesResponse.data;
        this.populateServiceOptions();
      }

      if (locationsResponse.success) {
        this.locations = locationsResponse.data;
        this.populateLocationOptions();
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      throw error;
    }
  }

  async loadOrders() {
    try {
      // First get the customer_id for this user
      const customerId = await this.getCustomerIdForUser();
      
      if (!customerId) {
        this.showError('Nu s-a putut identifica clientul. Încearcă să te loghezi din nou.');
        return;
      }

      console.log('Loading orders for customer_id:', customerId, 'User:', this.currentUser);

      // Get orders for current customer
      const response = await authManager.apiRequest(`/orders?customer_id=${customerId}`);
      
      if (response.success) {
        this.orders = response.data || [];
        this.renderOrders();
      } else {
        console.error('Failed to load orders:', response.error);
        this.showError('Nu s-au putut încărca comenzile');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      this.showError('Eroare la încărcarea comenzilor');
    }
  }

  renderOrders() {
    const grid = document.getElementById('ordersGrid');
    const emptyState = document.getElementById('emptyState');

    if (!this.orders || this.orders.length === 0) {
      grid.style.display = 'none';
      emptyState.classList.remove('hidden');
      return;
    }

    grid.style.display = 'grid';
    emptyState.classList.add('hidden');

    // Sort orders by creation date (newest first)
    const sortedOrders = [...this.orders].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );

    grid.innerHTML = sortedOrders.map(order => this.createOrderCard(order)).join('');
  }

  createOrderCard(order) {
    const statusClass = `status-${order.status.toLowerCase().replace(/\s+/g, '_')}`;
    const statusLabel = this.getStatusLabel(order.status);
    
    return `
      <div class="order-card">
        <div class="order-header">
          <div class="order-id">Comanda #${order.order_code || order.order_id}</div>
          <div class="order-status ${statusClass}">${statusLabel}</div>
        </div>
        
        <div class="order-details">
          <div class="detail-item">
            <div class="detail-label">Serviciu</div>
            <div class="detail-value">${order.service_name || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Locație</div>
            <div class="detail-value">${order.location_name || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Data Programării</div>
            <div class="detail-value">${this.formatDate(order.scheduled_date)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Ora</div>
            <div class="detail-value">${order.scheduled_time || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Preț</div>
            <div class="detail-value">${order.total_amount || order.base_price || 0} RON</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Data Creării</div>
            <div class="detail-value">${this.formatDateTime(order.created_at)}</div>
          </div>
        </div>
        
        <div class="order-actions">
          <button class="btn-small btn-view" onclick="myOrders.viewOrderDetails(${order.order_id})">
            Detalii
          </button>
          ${order.status === 'PENDING' ? `
            <button class="btn-small btn-cancel" onclick="myOrders.cancelOrder(${order.order_id})">
              Anulează
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Modal Management
  showNewOrderModal() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('orderDate').min = today;
    document.getElementById('orderDate').value = today;
    
    // Set default time
    const now = new Date();
    const defaultTime = `${String(now.getHours() + 1).padStart(2, '0')}:00`;
    document.getElementById('orderTime').value = defaultTime;

    const modal = document.getElementById('newOrderModal');
    modal.style.display = 'block';
    modal.classList.add('visible');
    this.setupFormHandlers();
  }

  closeNewOrderModal() {
    const modal = document.getElementById('newOrderModal');
    modal.style.display = 'none';
    modal.classList.remove('visible');
    this.resetOrderForm();
  }

  setupFormHandlers() {
    const form = document.getElementById('newOrderForm');
    form.onsubmit = (e) => {
      e.preventDefault();
      this.createOrder();
    };
  }

  resetOrderForm() {
    document.getElementById('newOrderForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('orderDate').value = today;
    document.getElementById('orderDuration').value = 60;
    document.getElementById('orderQuantity').value = 1;
  }

  async createOrder() {
    try {
      this.showLoading();

      const formData = await this.getOrderFormData();
      if (!formData) return;

      const response = await authManager.apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.success) {
        this.showToast('Comanda a fost creată cu succes!', 'success');
        this.closeNewOrderModal();
        await this.loadOrders(); // Reload orders
      } else {
        this.showToast(response.error || 'Eroare la crearea comenzii', 'error');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      this.showToast('Eroare la crearea comenzii', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async getOrderFormData() {
    const serviceId = parseInt(document.getElementById('orderService').value);
    const locationId = parseInt(document.getElementById('orderLocation').value);
    const date = document.getElementById('orderDate').value;
    const time = document.getElementById('orderTime').value;

    if (!serviceId || !locationId || !date || !time) {
      this.showToast('Completează toate câmpurile obligatorii', 'error');
      return null;
    }

    // Find selected service to get price
    const selectedService = this.services.find(s => s.service_id === serviceId);
    if (!selectedService) {
      this.showToast('Serviciul selectat nu a fost găsit', 'error');
      return null;
    }

    // Get customer_id for this user
    const customerId = await this.getCustomerIdForUser();
    if (!customerId) {
      this.showToast('Nu s-a putut identifica clientul', 'error');
      return null;
    }

    // Combine date and time
    const scheduledDateTime = `${date}T${time}:00`;
    
    return {
      customer_id: customerId,
      service_id: serviceId,
      location_id: locationId,
      quantity: parseInt(document.getElementById('orderQuantity').value) || 1,
      unit_price: parseFloat(selectedService.base_price),
      scheduled_for: scheduledDateTime,
      notes: document.getElementById('orderNotes').value.trim() || null
    };
  }

  async viewOrderDetails(orderId) {
    try {
      this.showLoading();

      const response = await authManager.apiRequest(`/orders/${orderId}`);
      
      if (response.success) {
        this.showOrderDetailsModal(response.data);
      } else {
        this.showToast('Nu s-au putut încărca detaliile comenzii', 'error');
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      this.showToast('Eroare la încărcarea detaliilor', 'error');
    } finally {
      this.hideLoading();
    }
  }

  showOrderDetailsModal(order) {
    const modal = document.getElementById('orderDetailsModal');
    const content = document.getElementById('orderDetailsContent');
    
    const statusClass = `status-${order.status.toLowerCase().replace(/\s+/g, '_')}`;
    const statusLabel = this.getStatusLabel(order.status);
    
    content.innerHTML = `
      <div class="order-details-view">
        <div class="detail-section">
          <h4>Informații Generale</h4>
          <div class="detail-row">
            <strong>Cod Comandă:</strong>
            <span>${order.order_code || order.order_id}</span>
          </div>
          <div class="detail-row">
            <strong>Status:</strong>
            <span class="order-status ${statusClass}">${statusLabel}</span>
          </div>
          <div class="detail-row">
            <strong>Data Creării:</strong>
            <span>${this.formatDateTime(order.created_at)}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4>Serviciu</h4>
          <div class="detail-row">
            <strong>Nume:</strong>
            <span>${order.service_name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <strong>Descriere:</strong>
            <span>${order.service_description || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <strong>Categorie:</strong>
            <span>${order.category || 'N/A'}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4>Programare</h4>
          <div class="detail-row">
            <strong>Data:</strong>
            <span>${this.formatDate(order.scheduled_date)}</span>
          </div>
          <div class="detail-row">
            <strong>Ora:</strong>
            <span>${order.scheduled_time || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <strong>Locație:</strong>
            <span>${order.location_name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <strong>Adresa:</strong>
            <span>${order.location_address || 'N/A'}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4>Detalii Financiare</h4>
          <div class="detail-row">
            <strong>Preț de Bază:</strong>
            <span>${order.base_price || 0} RON</span>
          </div>
          <div class="detail-row">
            <strong>Taxa Transport:</strong>
            <span>${order.transport_fee || 0} RON</span>
          </div>
          <div class="detail-row">
            <strong>Total:</strong>
            <strong>${order.total_amount || order.base_price || 0} RON</strong>
          </div>
        </div>

        ${order.employee_first_name ? `
          <div class="detail-section">
            <h4>Angajat Asignat</h4>
            <div class="detail-row">
              <strong>Nume:</strong>
              <span>${order.employee_first_name} ${order.employee_last_name}</span>
            </div>
            <div class="detail-row">
              <strong>Telefon:</strong>
              <span>${order.employee_phone || 'N/A'}</span>
            </div>
          </div>
        ` : ''}

        ${order.special_instructions ? `
          <div class="detail-section">
            <h4>Instrucțiuni Speciale</h4>
            <p>${order.special_instructions}</p>
          </div>
        ` : ''}


      </div>
    `;

    modal.style.display = 'block';
    modal.classList.add('visible');
  }

  closeOrderDetailsModal() {
    const modal = document.getElementById('orderDetailsModal');
    modal.style.display = 'none';
    modal.classList.remove('visible');
  }

  async cancelOrder(orderId) {
    if (!confirm('Ești sigur că vrei să anulezi această comandă?')) {
      return;
    }

    try {
      this.showLoading();

      const response = await authManager.apiRequest(`/orders/${orderId}/cancel`, {
        method: 'PUT'
      });

      if (response.success) {
        this.showToast('Comanda a fost anulată cu succes', 'success');
        await this.loadOrders(); // Reload orders
      } else {
        this.showToast(response.error || 'Eroare la anularea comenzii', 'error');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      this.showToast('Eroare la anularea comenzii', 'error');
    } finally {
      this.hideLoading();
    }
  }

  // Helper Functions
  populateServiceOptions() {
    const select = document.getElementById('orderService');
    select.innerHTML = '<option value="">Selectează serviciul</option>';
    
    this.services.forEach(service => {
      const option = document.createElement('option');
      option.value = service.service_id;
      option.textContent = `${service.description} - ${service.base_price} RON`;
      select.appendChild(option);
    });
  }

  populateLocationOptions() {
    const select = document.getElementById('orderLocation');
    select.innerHTML = '<option value="">Selectează locația</option>';
    
    this.locations.forEach(location => {
      const option = document.createElement('option');
      option.value = location.location_id;
      option.textContent = location.name;
      select.appendChild(option);
    });
  }

  getStatusLabel(status) {
    const statusLabels = {
      'PENDING': 'În așteptare',
      'SCHEDULED': 'Programat',
      'CONFIRMED': 'Confirmat',
      'IN_PROGRESS': 'În progres',
      'COMPLETED': 'Finalizat',
      'CANCELLED': 'Anulat'
    };
    return statusLabels[status] || status;
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  showError(message) {
    const grid = document.getElementById('ordersGrid');
    grid.innerHTML = `
      <div class="error-message">
        <h3>Eroare</h3>
        <p>${message}</p>
        <button onclick="myOrders.loadOrders()" class="btn-primary">Reîncearcă</button>
      </div>
    `;
  }

  showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
  }

  hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
  }

  showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, duration);
  }

  updateUserDisplay() {
    const welcomeElement = document.getElementById('userWelcome');
    if (welcomeElement && this.currentUser) {
      const fullName = `${this.currentUser.first_name || 'Utilizator'} ${this.currentUser.last_name || ''}`.trim();
      welcomeElement.textContent = `Bun venit, ${fullName}!`;
    }
  }

  async getCustomerIdForUser() {
    try {
      // Try to get from user object first
      if (this.currentUser.customer_id) {
        return this.currentUser.customer_id;
      }

      // Get customer record by user_id
      const response = await authManager.apiRequest(`/customers?user_id=${this.currentUser.user_id || this.currentUser.id}`);
      
      if (response.success && response.data && response.data.length > 0) {
        return response.data[0].customer_id;
      }

      // Fallback: try to create customer profile for this user
      console.warn('No customer record found for user, this should not happen for CUSTOMER role users');
      return null;
    } catch (error) {
      console.error('Error getting customer_id:', error);
      return null;
    }
  }
}

// Initialize MyOrders instance
const myOrders = new MyOrders();

// Close modals when clicking outside
window.onclick = function(event) {
  const newOrderModal = document.getElementById('newOrderModal');
  const detailsModal = document.getElementById('orderDetailsModal');
  
  if (event.target === newOrderModal) {
    myOrders.closeNewOrderModal();
  }
  if (event.target === detailsModal) {
    myOrders.closeOrderDetailsModal();
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  if (!authManager.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }
  
  myOrders.init();
  
  // Add event listeners for buttons
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('newOrderBtn').addEventListener('click', () => myOrders.showNewOrderModal());
  document.getElementById('emptyStateNewOrderBtn').addEventListener('click', () => myOrders.showNewOrderModal());
  document.getElementById('closeNewOrderModal').addEventListener('click', () => myOrders.closeNewOrderModal());
  document.getElementById('cancelNewOrderBtn').addEventListener('click', () => myOrders.closeNewOrderModal());
  document.getElementById('closeOrderDetailsModal').addEventListener('click', () => myOrders.closeOrderDetailsModal());
});

// Logout function
function logout() {
  authManager.logout();
  window.location.href = 'login.html';
} 