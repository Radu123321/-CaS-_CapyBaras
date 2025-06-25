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
    console.log('🚀 OrdersManager: Starting initialization');
    
    // Check authentication
    if (!authManager.requireAuth()) {
      console.log('❌ OrdersManager: Authentication check failed');
      return;
    }
    console.log('✅ OrdersManager: Authentication check passed');

    try {
      // Show loading state
      console.log('⏳ OrdersManager: Showing loading state');
      this.showLoading();
      
      // Load initial data
      console.log('📊 OrdersManager: Loading initial data');
      await this.loadInitialData();
      console.log('✅ OrdersManager: Initial data loaded successfully');
      
      // Show orders content
      console.log('📋 OrdersManager: Showing orders content');
      this.showOrders();
      console.log('🎉 OrdersManager: Initialization completed successfully');
      
    } catch (error) {
      console.error('❌ OrdersManager: Initialization error:', error);
      this.showError('Nu s-a putut încărca pagina de comenzi. Vă rugăm să reîncărcați pagina.');
    }
  }

  // ===== LOADING AND ERROR STATES =====
  
  showLoading() {
    document.getElementById('loadingState').style.display = 'flex';
    document.getElementById('ordersContent').classList.remove('visible');
    document.getElementById('errorState').classList.add('hidden');
  }
  
  showOrders() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('ordersContent').classList.add('visible');
    document.getElementById('errorState').classList.add('hidden');
  }
  
  showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('ordersContent').classList.remove('visible');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
  }

  // ===== DATA LOADING =====
  
  async loadInitialData() {
    console.log('📊 OrdersManager: loadInitialData() starting');
    
    // Load all required data in parallel  
    console.log('📥 OrdersManager: Loading all data in parallel');
    await Promise.all([
      this.loadOrders(),
      this.loadCustomers(),
      this.loadLocations(),
      this.loadServices()
    ]);
    console.log('✅ OrdersManager: All data loaded. Data state:');
    console.log('  - Orders:', this.orders.length, 'items');
    console.log('  - Customers:', this.customers.length, 'items');
    console.log('  - Locations:', this.locations.length, 'items');
    console.log('  - Services:', this.services.length, 'items');
    
    // Populate filter dropdowns
    console.log('🔧 OrdersManager: Populating filters');
    this.populateFilters();
    
    // Display orders
    console.log('📋 OrdersManager: Displaying orders');
    this.displayOrders();
    console.log('✅ OrdersManager: loadInitialData() completed');
  }
  
  async loadOrders() {
    console.log('📋 OrdersManager: loadOrders() starting');
    try {
      console.log('📋 OrdersManager: Making API request to /orders');
      const response = await authManager.apiRequest('/orders');
      console.log('📋 OrdersManager: Orders API response:', response);
      
      if (response.success) {
        this.orders = response.data || [];
        this.filteredOrders = [...this.orders];
        console.log('✅ OrdersManager: Orders loaded successfully:', this.orders.length, 'orders');
        console.log('📋 OrdersManager: Sample order data:', this.orders[0] || 'No orders');
      } else {
        console.error('❌ OrdersManager: Orders API returned error:', response.error);
        throw new Error(response.error || 'Failed to load orders');
      }
    } catch (error) {
      console.error('❌ OrdersManager: Error loading orders:', error);
      this.orders = [];
      this.filteredOrders = [];
    }
  }
  
  async loadCustomers() {
    console.log('👥 OrdersManager: loadCustomers() starting');
    try {
      console.log('👥 OrdersManager: Making API request to /customers');
      const response = await authManager.apiRequest('/customers');
      console.log('👥 OrdersManager: Customers API response:', response);
      
      if (response.success) {
        this.customers = response.data || [];
        console.log('✅ OrdersManager: Customers loaded successfully:', this.customers.length, 'customers');
        console.log('👥 OrdersManager: Sample customer data:', this.customers[0] || 'No customers');
      } else {
        console.error('❌ OrdersManager: Customers API returned error:', response.error);
      }
    } catch (error) {
      console.error('❌ OrdersManager: Error loading customers:', error);
      this.customers = [];
    }
  }
  
  async loadLocations() {
    console.log('📍 OrdersManager: loadLocations() starting');
    try {
      console.log('📍 OrdersManager: Making API request to /locations');
      const response = await authManager.apiRequest('/locations');
      console.log('📍 OrdersManager: Locations API response:', response);
      
      if (response.success) {
        this.locations = response.data || [];
        console.log('✅ OrdersManager: Locations loaded successfully:', this.locations.length, 'locations');
        console.log('📍 OrdersManager: Sample location data:', this.locations[0] || 'No locations');
      } else {
        console.error('❌ OrdersManager: Locations API returned error:', response.error);
      }
    } catch (error) {
      console.error('❌ OrdersManager: Error loading locations:', error);
      this.locations = [];
    }
  }
  
  async loadServices() {
    console.log('🔧 OrdersManager: loadServices() starting');
    try {
      console.log('🔧 OrdersManager: Making API request to /services');
      const response = await authManager.apiRequest('/services');
      console.log('🔧 OrdersManager: Services API response:', response);
      
      if (response.success) {
        this.services = response.data || [];
        console.log('✅ OrdersManager: Services loaded successfully:', this.services.length, 'services');
        console.log('🔧 OrdersManager: Sample service data:', this.services[0] || 'No services');
      } else {
        console.error('❌ OrdersManager: Services API returned error:', response.error);
      }
    } catch (error) {
      console.error('❌ OrdersManager: Error loading services:', error);
      this.services = [];
    }
  }

  // ===== DISPLAY METHODS =====
  
  populateFilters() {
    console.log('🔧 OrdersManager: populateFilters() starting');
    
    // Populate location filter
    const locationFilter = document.getElementById('locationFilter');
    console.log('🔧 OrdersManager: Location filter element:', locationFilter ? 'Found' : 'NOT FOUND');
    
    if (locationFilter) {
      locationFilter.innerHTML = '<option value="">Toate locațiile</option>';
      console.log('🔧 OrdersManager: Populating location filter with', this.locations.length, 'locations');
      
      this.locations.forEach((location, index) => {
        const locationName = location.name || location.location_name || `Locație #${location.location_id}`;
        const locationId = location.location_id || location.id;
        locationFilter.innerHTML += `<option value="${locationId}">${locationName}</option>`;
        
        if (index === 0) {
          console.log('🔧 OrdersManager: Sample location filter option:', locationName, 'ID:', locationId);
        }
      });
      console.log('🔧 OrdersManager: Location filter populated with', locationFilter.options.length - 1, 'options');
    }
    
    // Populate service filter
    const serviceFilter = document.getElementById('serviceFilter');
    console.log('🔧 OrdersManager: Service filter element:', serviceFilter ? 'Found' : 'NOT FOUND');
    
    if (serviceFilter) {
      serviceFilter.innerHTML = '<option value="">Toate serviciile</option>';
      console.log('🔧 OrdersManager: Populating service filter with', this.services.length, 'services');
      
      this.services.forEach((service, index) => {
        const serviceName = service.name || service.service_name || `Serviciu #${service.service_id}`;
        const serviceId = service.service_id || service.id;
        serviceFilter.innerHTML += `<option value="${serviceId}">${serviceName}</option>`;
        
        if (index === 0) {
          console.log('🔧 OrdersManager: Sample service filter option:', serviceName, 'ID:', serviceId);
        }
      });
      console.log('🔧 OrdersManager: Service filter populated with', serviceFilter.options.length - 1, 'options');
    }
    
    console.log('✅ OrdersManager: populateFilters() completed');
  }
  
  populateModalDropdowns() {
    console.log('🔄 OrdersManager: populateModalDropdowns() starting');
    
    // Only populate if we have data
    if (!this.customers || !this.locations || !this.services) {
      console.log('❌ OrdersManager: Missing data for dropdowns');
      console.log('  - Customers:', this.customers?.length || 0);
      console.log('  - Locations:', this.locations?.length || 0);
      console.log('  - Services:', this.services?.length || 0);
      return;
    }
    console.log('✅ OrdersManager: All data available for dropdowns');
    
    // Populate customer dropdown
    const customerSelect = document.getElementById('customerId');
    console.log('👥 OrdersManager: Customer select element:', customerSelect ? 'Found' : 'NOT FOUND');
    if (customerSelect) {
      customerSelect.innerHTML = '<option value="">Selectează clientul</option>';
      console.log('👥 OrdersManager: Populating customers, count:', this.customers.length);
      
      this.customers.forEach((customer, index) => {
        let customerDisplay = '';
        if (customer.first_name && customer.last_name) {
          customerDisplay = `${customer.first_name} ${customer.last_name}`;
        } else if (customer.name) {
          customerDisplay = customer.name;
        } else {
          customerDisplay = customer.email || `Client #${customer.customer_id}`;
        }
        
        if (customer.email && !customerDisplay.includes(customer.email)) {
          customerDisplay += ` - ${customer.email}`;
        }
        
        customerSelect.innerHTML += `<option value="${customer.customer_id}">${customerDisplay}</option>`;
        
        if (index === 0) {
          console.log('👥 OrdersManager: Sample customer option:', customerDisplay, 'ID:', customer.customer_id);
        }
      });
      console.log('👥 OrdersManager: Customer dropdown populated with', customerSelect.options.length - 1, 'customers');
    }
    
    // Populate location dropdown
    const locationSelect = document.getElementById('locationId');
    console.log('📍 OrdersManager: Location select element:', locationSelect ? 'Found' : 'NOT FOUND');
    if (locationSelect) {
      locationSelect.innerHTML = '<option value="">Selectează locația</option>';
      console.log('📍 OrdersManager: Populating locations, count:', this.locations.length);
      
      this.locations.forEach((location, index) => {
        const locationName = location.name || location.location_name || `Locație #${location.location_id}`;
        locationSelect.innerHTML += `<option value="${location.location_id}">${locationName}</option>`;
        
        if (index === 0) {
          console.log('📍 OrdersManager: Sample location option:', locationName, 'ID:', location.location_id);
        }
      });
      console.log('📍 OrdersManager: Location dropdown populated with', locationSelect.options.length - 1, 'locations');
    }
    
    // Populate service dropdown
    const serviceSelect = document.getElementById('serviceId');
    console.log('🔧 OrdersManager: Service select element:', serviceSelect ? 'Found' : 'NOT FOUND');
    if (serviceSelect) {
      serviceSelect.innerHTML = '<option value="">Selectează serviciul</option>';
      console.log('🔧 OrdersManager: Populating services, count:', this.services.length);
      
      this.services.forEach((service, index) => {
        const serviceName = service.name || service.service_name || `Serviciu #${service.service_id}`;
        const servicePrice = service.price ? ` - ${service.price} RON` : '';
        serviceSelect.innerHTML += `<option value="${service.service_id}">${serviceName}${servicePrice}</option>`;
        
        if (index === 0) {
          console.log('🔧 OrdersManager: Sample service option:', serviceName, 'ID:', service.service_id);
        }
      });
      console.log('🔧 OrdersManager: Service dropdown populated with', serviceSelect.options.length - 1, 'services');
    }
    
    console.log('✅ OrdersManager: populateModalDropdowns() completed');
  }
  
  displayOrders() {
    console.log('📋 OrdersManager: displayOrders() starting');
    console.log('📋 OrdersManager: Orders to display:', this.filteredOrders.length);
    
    const tbody = document.getElementById('ordersTableBody');
    console.log('📋 OrdersManager: Table tbody element:', tbody ? 'Found' : 'NOT FOUND');
    
    if (!tbody) {
      console.error('❌ OrdersManager: Orders table tbody not found!');
      return;
    }

    if (this.filteredOrders.length === 0) {
      console.log('📋 OrdersManager: No orders to display');
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nu există comenzi</td></tr>';
      return;
    }

    console.log('📋 OrdersManager: Clearing table and adding orders');
    tbody.innerHTML = '';
    
    // Check if current user is admin
    const userRole = authManager.currentUser?.role;
    const isAdmin = userRole === 'ADMIN';
    
    console.log('👤 OrdersManager: User role check:', {
      currentUser: authManager.currentUser,
      userRole: userRole,
      isAdmin: isAdmin
    });
    
    this.filteredOrders.forEach((order, index) => {
      console.log(`📋 OrdersManager: Processing order ${index + 1}:`, order);
      
      const customerName = this.getCustomerNameFromOrder(order);
      const serviceName = this.getServiceNameFromOrder(order);
      const locationName = this.getLocationNameFromOrder(order);
      
      console.log(`📋 OrdersManager: Order ${index + 1} details:`);
      console.log('  - Customer:', customerName);
      console.log('  - Service:', serviceName);
      console.log('  - Location:', locationName);
      console.log('  - Status:', order.status);
      console.log('  - Date:', order.scheduled_for);

      // Create action buttons based on user role
      let actionButtons = `
        <button class="btn-sm btn-primary" onclick="ordersManager.showEditOrderModal(${order.order_id})" title="Editează comanda">
          Editează
        </button>
      `;
      
      // Add status edit button for admins (doar pentru schimbarea rapidă de status)
      if (isAdmin) {
        actionButtons += `
          <button class="btn-sm btn-warning" onclick="ordersManager.editOrderStatus(${order.order_id})" title="Schimbă doar status">
            Status
          </button>
        `;
      }
      
      // Add cancel button (available for all roles, but different functionality)
      if (order.status !== 'CANCELLED' && order.status !== 'COMPLETED') {
        actionButtons += `
          <button class="btn-sm btn-danger" onclick="ordersManager.cancelOrder(${order.order_id})" title="Anulează">
            Anulează
          </button>
        `;
      }

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>#${order.order_id}</td>
        <td>${customerName}</td>
        <td>${serviceName}</td>
        <td>${locationName}</td>
        <td><span class="status-badge status-${order.status?.toLowerCase() || 'unknown'}">${this.getStatusLabel(order.status)}</span></td>
        <td>${this.getScheduledDateTime(order)}</td>
        <td>${this.getTotalPriceFromOrder(order)}</td>
        <td class="actions-cell">
          ${actionButtons}
        </td>
      `;
      tbody.appendChild(row);
    });
    
    // Update orders count
    const ordersCount = document.getElementById('ordersCount');
    if (ordersCount) {
      ordersCount.textContent = `${this.filteredOrders.length} comenzi`;
      console.log('📋 OrdersManager: Updated orders count:', this.filteredOrders.length);
    }
    
    // Update stats
    this.updateStats();
    
    console.log('✅ OrdersManager: Orders displayed successfully');
  }

  updateStats() {
    console.log('📊 OrdersManager: updateStats() starting');
    console.log('📊 OrdersManager: Total orders:', this.orders.length);
    
    const stats = {
      pending: this.orders.filter(o => o.status === 'PENDING').length,
      confirmed: this.orders.filter(o => o.status === 'CONFIRMED').length,
      completed: this.orders.filter(o => o.status === 'COMPLETED').length,
      cancelled: this.orders.filter(o => o.status === 'CANCELLED').length,
      refunded: this.orders.filter(o => o.status === 'REFUNDED').length
    };
    
    console.log('📊 OrdersManager: Stats breakdown:', stats);
    
    // Update stat cards
    const pendingCount = document.getElementById('pendingCount');
    const confirmedCount = document.getElementById('confirmedCount');
    const completedCount = document.getElementById('completedCount');
    const cancelledCount = document.getElementById('cancelledCount');
    
    console.log('📊 OrdersManager: Stat elements found:', {
      pendingCount: pendingCount ? 'Found' : 'NOT FOUND',
      confirmedCount: confirmedCount ? 'Found' : 'NOT FOUND',
      completedCount: completedCount ? 'Found' : 'NOT FOUND',
      cancelledCount: cancelledCount ? 'Found' : 'NOT FOUND'
    });
    
    if (pendingCount) pendingCount.textContent = stats.pending;
    if (confirmedCount) confirmedCount.textContent = stats.confirmed;
    if (completedCount) completedCount.textContent = stats.completed;
    if (cancelledCount) cancelledCount.textContent = stats.cancelled;
    
    console.log('✅ OrdersManager: Stats updated successfully');
    console.log('📊 REFUNDED orders not displayed in UI cards (only 4 cards available), but counted:', stats.refunded);
  }

  // ===== HELPER METHODS =====
  
  getCustomerName(customerId) {
    const customer = this.customers.find(c => c.customer_id === customerId);
    if (customer) {
      // Use full name from first_name + last_name or fallback to email
      if (customer.first_name && customer.last_name) {
        return `${customer.first_name} ${customer.last_name}`;
      } else if (customer.name) {
        return customer.name;
      } else if (customer.email) {
        return customer.email;
      }
    }
    return `Client #${customerId}`;
  }
  
  getServiceName(serviceId) {
    const service = this.services.find(s => s.service_id === serviceId);
    return service ? (service.name || service.service_name || `Serviciu #${serviceId}`) : `Serviciu #${serviceId}`;
  }
  
  getLocationName(locationId) {
    const location = this.locations.find(l => l.location_id === locationId);
    return location ? (location.name || location.location_name || `Locație #${locationId}`) : `Locație #${locationId}`;
  }
  
  getStatusLabel(status) {
    const labels = {
      'PENDING': '⏳ În așteptare',
      'CONFIRMED': '✅ Confirmat',
      'IN_PROGRESS': '🔄 În progres',
      'COMPLETED': '✅ Finalizat',
      'CANCELLED': '❌ Anulat',
      'REFUNDED': '💰 Rambursat'
    };
    return labels[status] || `❓ ${status}`;
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
  
  async editOrderStatus(orderId) {
    console.log('🔄 OrdersManager: editOrderStatus() for order:', orderId);
    
    const order = this.orders.find(o => o.order_id === orderId);
    if (!order) {
      console.error('❌ OrdersManager: Order not found:', orderId);
      this.showToast('Comanda nu a fost găsită', 'error');
      return;
    }
    
    // Check if user is admin
    const userRole = authManager.currentUser?.role;
    console.log('🔄 OrdersManager: Current user role:', userRole);
    
    if (userRole !== 'ADMIN') {
      console.log('❌ OrdersManager: User is not admin, role:', userRole);
      this.showToast('Doar administratorii pot schimba statusul comenzilor', 'error');
      return;
    }
    
    console.log('✅ OrdersManager: Admin verification passed, showing status modal');
    this.showEditStatusModal(order);
  }

  async cancelOrder(orderId) {
    if (!confirm('Sigur doriți să anulați această comandă?')) {
      return;
    }

    try {
      const response = await authManager.apiRequest(`/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'CANCELLED'
        })
      });
      
      if (response.success) {
        this.showToast('Comanda a fost anulată cu succes', 'success');
        await this.loadOrders();
        this.applyFilters();
      } else {
        this.showToast(response.error || 'Eroare la anularea comenzii', 'error');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      this.showToast('Eroare la anularea comenzii', 'error');
    }
  }

  showEditOrderModal(orderId) {
    console.log('✏️ OrdersManager: showEditOrderModal() for order:', orderId);
    
    // Find the order by ID
    const order = this.orders.find(o => o.order_id === orderId);
    if (!order) {
      console.error('❌ OrdersManager: Order not found:', orderId);
      this.showToast('Comanda nu a fost găsită', 'error');
      return;
    }
    
    // Check if user is admin - doar adminii pot edita toate câmpurile
    const userRole = authManager.currentUser?.role;
    const isAdmin = userRole === 'ADMIN';
    
    if (!isAdmin) {
      // Pentru utilizatori non-admin, doar vizualizează detaliile
      this.showOrderDetails(order);
      return;
    }
    
    console.log('✅ OrdersManager: Admin verification passed, showing edit modal');
    
    // Close order details modal first
    this.closeOrderDetailsModal();
    
    // Show create order modal in edit mode
    const modal = document.getElementById('createOrderModal');
    const title = modal.querySelector('.modal-header h3');
    const submitBtn = modal.querySelector('.btn-new-order');
    
    // Set to edit mode
    title.textContent = `Editează Comanda #${order.order_id}`;
    submitBtn.textContent = 'Actualizează Comanda';
    submitBtn.onclick = () => this.updateOrder(order.order_id);
    
    // Populate form with current order data
    this.populateModalDropdowns();
    
    // Show status field for editing
    document.getElementById('statusFormGroup').style.display = 'block';
    
    // Wait for dropdowns to populate, then set values
    setTimeout(() => {
      document.getElementById('customerId').value = order.customer_id || '';
      document.getElementById('locationId').value = order.location_id || '';
      document.getElementById('serviceId').value = order.service_id || '';
      
      // Format scheduled date for datetime-local input
      if (order.scheduled_date) {
        const date = new Date(order.scheduled_date);
        // Format to YYYY-MM-DDTHH:MM
        const formattedDate = date.getFullYear() + '-' + 
          String(date.getMonth() + 1).padStart(2, '0') + '-' + 
          String(date.getDate()).padStart(2, '0') + 'T' + 
          String(date.getHours()).padStart(2, '0') + ':' + 
          String(date.getMinutes()).padStart(2, '0');
        document.getElementById('scheduledDate').value = formattedDate;
      }
      
      document.getElementById('orderStatus').value = order.status || 'PENDING';
      document.getElementById('notes').value = order.notes || '';
      document.getElementById('needsTransport').checked = order.needs_transport || false;
    }, 100);
    
    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('visible');
    
    console.log('✅ OrdersManager: Edit modal shown for order:', order.order_id);
  }

  showEditStatusModal(order) {
    console.log('🔄 OrdersManager: showEditStatusModal() for order:', order);
    
    // Create modal HTML
    const modalHtml = `
      <div id="editStatusModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Editează Status - Comanda #${order.order_id}</h3>
            <button class="modal-close" onclick="ordersManager.closeEditStatusModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="newStatus">Noul status:</label>
              <select id="newStatus" required>
                <option value="PENDING" ${order.status === 'PENDING' ? 'selected' : ''}>În așteptare</option>
                <option value="CONFIRMED" ${order.status === 'CONFIRMED' ? 'selected' : ''}>Confirmat</option>
                <option value="IN_PROGRESS" ${order.status === 'IN_PROGRESS' ? 'selected' : ''}>În progres</option>
                <option value="COMPLETED" ${order.status === 'COMPLETED' ? 'selected' : ''}>Finalizat</option>
                <option value="CANCELLED" ${order.status === 'CANCELLED' ? 'selected' : ''}>Anulat</option>
                <option value="REFUNDED" ${order.status === 'REFUNDED' ? 'selected' : ''}>Rambursat</option>
              </select>
            </div>
            <div class="form-group">
              <label for="statusNotes">Observații (opțional):</label>
              <textarea id="statusNotes" rows="3" placeholder="Notați motivul schimbării statusului..."></textarea>
            </div>
            <div class="status-info">
              <p><strong>Status actual:</strong> ${this.getStatusLabel(order.status)}</p>
              <p><strong>Client:</strong> ${this.getCustomerName(order.customer_id)}</p>
              <p><strong>Serviciu:</strong> ${this.getServiceName(order.service_id)}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-back" onclick="ordersManager.closeEditStatusModal()">Anulează</button>
            <button class="btn-primary" onclick="ordersManager.updateOrderStatus(${order.order_id})">Actualizează Status</button>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = document.getElementById('editStatusModal');
    modal.style.display = 'flex';
    modal.classList.add('visible');
  }

  closeEditStatusModal() {
    const modal = document.getElementById('editStatusModal');
    if (modal) {
      modal.remove();
    }
  }

  async updateOrderStatus(orderId) {
    console.log('🔄 OrdersManager: updateOrderStatus() for order:', orderId);
    
    const newStatus = document.getElementById('newStatus').value;
    const notes = document.getElementById('statusNotes').value;
    
    if (!newStatus) {
      this.showToast('Vă rugăm să selectați un status', 'error');
      return;
    }
    
    try {
      const response = await authManager.apiRequest(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          notes: notes
        })
      });
      
      if (response.success) {
        this.showToast('Statusul comenzii a fost actualizat cu succes', 'success');
        this.closeEditStatusModal();
        await this.loadOrders(); // Reload orders
        this.displayOrders(); // Refresh display
      } else {
        this.showToast(response.error || 'Eroare la actualizarea statusului', 'error');
      }
    } catch (error) {
      console.error('❌ OrdersManager: Error updating order status:', error);
      this.showToast('Eroare la actualizarea statusului', 'error');
    }
  }

  showOrderDetails(order) {
    const modal = document.getElementById('orderDetailsModal');
    const title = document.getElementById('orderDetailsTitle');
    const content = document.getElementById('orderDetailsContent');
    
    title.textContent = `Comandă #${order.order_id}`;
    
    // Check if user is admin to show appropriate buttons
    const userRole = authManager.currentUser?.role;
    const isAdmin = userRole === 'ADMIN';
    
    content.innerHTML = `
      <div class="order-details">
        <div class="details-grid">
          <div class="detail-item">
            <label>👤 Client:</label>
            <span>${this.getCustomerNameFromOrder(order)}</span>
          </div>
          <div class="detail-item">
            <label>💼 Serviciu:</label>
            <span>${this.getServiceNameFromOrder(order)}</span>
          </div>
          <div class="detail-item">
            <label>🏢 Locație:</label>
            <span>${this.getLocationNameFromOrder(order)}</span>
          </div>
          <div class="detail-item">
            <label>📊 Status:</label>
            <span class="status-badge status-${order.status.toLowerCase()}">${this.getStatusLabel(order.status)}</span>
          </div>
          <div class="detail-item">
            <label>📅 Data creării:</label>
            <span>${this.formatDate(order.created_at)}</span>
          </div>
          <div class="detail-item">
            <label>⏰ Data programată:</label>
            <span>${this.getScheduledDateTime(order)}</span>
          </div>
          <div class="detail-item">
            <label>💰 Preț total:</label>
            <span>${this.getTotalPriceFromOrder(order)}</span>
          </div>
          <div class="detail-item">
            <label>🚚 Transport:</label>
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
    
    // Update modal footer cu butonul de editare
    const modalFooter = modal.querySelector('.modal-footer');
    modalFooter.innerHTML = `
      <button class="btn-back" onclick="closeOrderDetailsModal()">Închide</button>
      <button class="btn-primary" onclick="ordersManager.closeOrderDetailsModal(); ordersManager.showEditOrderModal(${order.order_id})">Editează</button>
    `;
    
    modal.style.display = 'flex';
    modal.classList.add('visible');
  }

  // ===== MODAL MANAGEMENT =====
  
  showCreateOrderModal() {
    console.log('📝 OrdersManager: showCreateOrderModal() starting');
    
    const modal = document.getElementById('createOrderModal');
    console.log('📝 OrdersManager: Modal element:', modal ? 'Found' : 'NOT FOUND');
    
    // Reset modal to creation mode
    const title = modal.querySelector('.modal-header h3');
    const createBtn = modal.querySelector('.btn-new-order');
    console.log('📝 OrdersManager: Modal elements found:', {
      title: title ? 'Found' : 'NOT FOUND',
      createBtn: createBtn ? 'Found' : 'NOT FOUND'
    });
    
    title.textContent = 'Comandă Nouă';
    createBtn.textContent = 'Creează Comanda';
    createBtn.onclick = () => createOrder();
    console.log('📝 OrdersManager: Modal reset to creation mode');
    
    // Clear form
    const form = document.getElementById('createOrderForm');
    console.log('📝 OrdersManager: Form element:', form ? 'Found' : 'NOT FOUND');
    form.reset();
    console.log('📝 OrdersManager: Form reset');
    
    // Hide status field for new orders
    document.getElementById('statusFormGroup').style.display = 'none';
    
    // Ensure dropdowns are populated with current data
    console.log('📝 OrdersManager: About to populate dropdowns');
    this.populateModalDropdowns();
    
    // Show modal
    console.log('📝 OrdersManager: Showing modal');
    modal.classList.remove('hidden');
    modal.classList.add('visible');
    console.log('✅ OrdersManager: showCreateOrderModal() completed');
  }
  
  closeCreateOrderModal() {
    const modal = document.getElementById('createOrderModal');
    modal.classList.remove('visible');
    modal.classList.add('hidden');
    document.getElementById('createOrderForm').reset();
  }
  
  closeOrderDetailsModal() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('visible');
      modal.classList.add('hidden');
    }
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

  async updateOrder(orderId) {
    console.log('🔄 OrdersManager: updateOrder() for order:', orderId);
    
    // Get form field values
    const customerIdField = document.getElementById('customerId');
    const locationIdField = document.getElementById('locationId');
    const serviceIdField = document.getElementById('serviceId');
    const scheduledDateField = document.getElementById('scheduledDate');
    const notesField = document.getElementById('notes');
    const needsTransportField = document.getElementById('needsTransport');
    
    const statusField = document.getElementById('orderStatus');
    
    const formData = {
      customer_id: parseInt(customerIdField?.value),
      location_id: parseInt(locationIdField?.value),
      service_id: parseInt(serviceIdField?.value),
      scheduled_for: scheduledDateField?.value || null,
      status: statusField?.value || 'PENDING',
      notes: notesField?.value || null,
      needs_transport: needsTransportField?.checked || false
    };
    
    console.log('🔄 OrdersManager: Update data prepared:', formData);

    // Validate required fields
    if (!formData.customer_id || !formData.location_id || !formData.service_id) {
      console.log('❌ Validation failed - missing required fields');
      this.showToast('Vă rugăm să completați toate câmpurile obligatorii', 'error');
      return;
    }

    try {
      console.log('🔄 Sending PUT request to /orders/' + orderId);
      const response = await authManager.apiRequest(`/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      console.log('🔄 API response:', response);
      
      if (response.success) {
        console.log('✅ Order updated successfully');
        this.showToast('Comanda a fost actualizată cu succes', 'success');
        this.closeCreateOrderModal();
        await this.loadOrders();
        this.displayOrders();
      } else {
        console.error('❌ API returned error:', response.error);
        this.showToast(response.error || 'Eroare la actualizarea comenzii', 'error');
      }
    } catch (error) {
      console.error('❌ Exception updating order:', error);
      this.showToast('Eroare la actualizarea comenzii', 'error');
    }
  }

  // Helper function to get customer name from order data (when joined)
  getCustomerNameFromOrder(order) {
    if (order.customer_first_name && order.customer_last_name) {
      return `${order.customer_first_name} ${order.customer_last_name}`;
    } else if (order.customer_name) {
      return order.customer_name;
    } else if (order.customer_email) {
      return order.customer_email;
    }
    return this.getCustomerName(order.customer_id);
  }

  // Helper function to get service name from order data (when joined)
  getServiceNameFromOrder(order) {
    return order.service_name || this.getServiceName(order.service_id);
  }

  // Helper function to get location name from order data (when joined)
  getLocationNameFromOrder(order) {
    return order.location_name || this.getLocationName(order.location_id);
  }

  // Helper function to get total price from order
  getTotalPriceFromOrder(order) {
    if (order.total_amount) {
      return `${order.total_amount} RON`;
    } else if (order.base_price) {
      return `${order.base_price} RON`;
    }
    return 'Preț nespecificat';
  }

  // Helper function to get scheduled date and time
  getScheduledDateTime(order) {
    if (order.scheduled_date) {
      const date = this.formatDate(order.scheduled_date);
      const time = order.scheduled_time || '';
      return time ? `${date} ${time}` : date;
    }
    return 'Data nespecificată';
  }
}

// Global functions for HTML onclick handlers
async function refreshOrders() {
  await ordersManager.loadOrders();
  ordersManager.applyFilters();
  ordersManager.showToast('Comenzile au fost reîmprospătate', 'success');
}

function showCreateOrderModal() {
  console.log('🌍 Global showCreateOrderModal() called');
  
  if (ordersManager) {
    console.log('✅ OrdersManager instance found, calling method');
    ordersManager.showCreateOrderModal();
  } else {
    console.error('❌ OrdersManager instance not found!');
  }
}

function closeCreateOrderModal() {
  if (ordersManager) {
    ordersManager.closeCreateOrderModal();
  }
}

function closeOrderDetailsModal() {
  if (ordersManager) {
    ordersManager.closeOrderDetailsModal();
  }
}

function applyFilters() {
  ordersManager.applyFilters();
}

function showUpdateStatusModal() {
  console.log('🔄 showUpdateStatusModal() called from order details modal');
  
  // Get the order ID from the modal title or a data attribute
  const modalTitle = document.getElementById('orderDetailsTitle');
  const titleText = modalTitle ? modalTitle.textContent : '';
  
  // Extract order ID from title like "Detalii Comandă #73"
  const orderIdMatch = titleText.match(/#(\d+)/);
  
  if (orderIdMatch && ordersManager) {
    const orderId = parseInt(orderIdMatch[1]);
    console.log('🔄 Extracted order ID:', orderId);
    
    // Close the order details modal first
    ordersManager.closeOrderDetailsModal();
    
    // Open the edit status modal
    ordersManager.editOrderStatus(orderId);
  } else {
    console.error('❌ Could not extract order ID from modal title:', titleText);
    if (ordersManager) {
      ordersManager.showToast('Nu s-a putut identifica comanda pentru editare', 'error');
    }
  }
}

async function createOrder() {
  console.log('➕ createOrder() function called');
  
  if (ordersManager) {
    console.log('➕ OrdersManager instance available');
    
    // Get form field values with logging
    const customerIdField = document.getElementById('customerId');
    const locationIdField = document.getElementById('locationId');
    const serviceIdField = document.getElementById('serviceId');
    const scheduledDateField = document.getElementById('scheduledDate');
    const notesField = document.getElementById('notes');
    const needsTransportField = document.getElementById('needsTransport');
    
    console.log('➕ Form fields found:', {
      customerId: customerIdField ? 'Found' : 'NOT FOUND',
      locationId: locationIdField ? 'Found' : 'NOT FOUND',
      serviceId: serviceIdField ? 'Found' : 'NOT FOUND',
      scheduledDate: scheduledDateField ? 'Found' : 'NOT FOUND',
      notes: notesField ? 'Found' : 'NOT FOUND',
      needsTransport: needsTransportField ? 'Found' : 'NOT FOUND'
    });
    
    const formData = {
      customer_id: parseInt(customerIdField?.value),
      location_id: parseInt(locationIdField?.value),
      service_id: parseInt(serviceIdField?.value),
      scheduled_for: scheduledDateField?.value || null,
      notes: notesField?.value || null,
      needs_transport: needsTransportField?.checked || false,
      unit_price: 100 // Default price, should get from service
    };
    
    console.log('➕ Form data prepared:', formData);

    // Validate required fields
    if (!formData.customer_id || !formData.location_id || !formData.service_id) {
      console.log('❌ Validation failed - missing required fields');
      console.log('  - Customer ID:', formData.customer_id);
      console.log('  - Location ID:', formData.location_id);
      console.log('  - Service ID:', formData.service_id);
      ordersManager.showToast('Vă rugăm să completați toate câmpurile obligatorii', 'error');
      return;
    }
    console.log('✅ Validation passed');

    try {
      console.log('➕ Sending POST request to /orders');
      const response = await authManager.apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      console.log('➕ API response:', response);
      
      if (response.success) {
        console.log('✅ Order created successfully');
        ordersManager.showToast('Comanda a fost creată cu succes', 'success');
        ordersManager.closeCreateOrderModal();
        await ordersManager.loadOrders();
        ordersManager.applyFilters();
      } else {
        console.error('❌ API returned error:', response.error);
        ordersManager.showToast(response.error || 'Eroare la crearea comenzii', 'error');
      }
    } catch (error) {
      console.error('❌ Exception creating order:', error);
      ordersManager.showToast('Eroare la crearea comenzii', 'error');
    }
  } else {
    console.error('❌ OrdersManager instance not available');
  }
}

// Debug function to check all critical elements
function debugPageElements() {
  console.log('🔍 === DEBUGGING PAGE ELEMENTS ===');
  
  // Check modal elements
  const createOrderModal = document.getElementById('createOrderModal');
  const orderDetailsModal = document.getElementById('orderDetailsModal');
  
  console.log('🔍 Modal elements:', {
    createOrderModal: createOrderModal ? 'Found' : 'NOT FOUND',
    orderDetailsModal: orderDetailsModal ? 'Found' : 'NOT FOUND'
  });
  
  // Check form elements
  const createOrderForm = document.getElementById('createOrderForm');
  const customerId = document.getElementById('customerId');
  const locationId = document.getElementById('locationId');
  const serviceId = document.getElementById('serviceId');
  const scheduledDate = document.getElementById('scheduledDate');
  const notes = document.getElementById('notes');
  const needsTransport = document.getElementById('needsTransport');
  
  console.log('🔍 Form elements:', {
    createOrderForm: createOrderForm ? 'Found' : 'NOT FOUND',
    customerId: customerId ? 'Found' : 'NOT FOUND',
    locationId: locationId ? 'Found' : 'NOT FOUND',
    serviceId: serviceId ? 'Found' : 'NOT FOUND',
    scheduledDate: scheduledDate ? 'Found' : 'NOT FOUND',
    notes: notes ? 'Found' : 'NOT FOUND',
    needsTransport: needsTransport ? 'Found' : 'NOT FOUND'
  });
  
  // Check display elements
  const ordersTableBody = document.getElementById('ordersTableBody');
  const loadingState = document.getElementById('loadingState');
  const ordersContent = document.getElementById('ordersContent');
  const errorState = document.getElementById('errorState');
  const ordersCount = document.getElementById('ordersCount');
  
  console.log('🔍 Display elements:', {
    ordersTableBody: ordersTableBody ? 'Found' : 'NOT FOUND',
    loadingState: loadingState ? 'Found' : 'NOT FOUND',
    ordersContent: ordersContent ? 'Found' : 'NOT FOUND',
    errorState: errorState ? 'Found' : 'NOT FOUND',
    ordersCount: ordersCount ? 'Found' : 'NOT FOUND'
  });
  
  // Check stat elements
  const pendingCount = document.getElementById('pendingCount');
  const confirmedCount = document.getElementById('confirmedCount');
  const completedCount = document.getElementById('completedCount');
  const cancelledCount = document.getElementById('cancelledCount');
  
  console.log('🔍 Stat elements:', {
    pendingCount: pendingCount ? 'Found' : 'NOT FOUND',
    confirmedCount: confirmedCount ? 'Found' : 'NOT FOUND',
    completedCount: completedCount ? 'Found' : 'NOT FOUND',
    cancelledCount: cancelledCount ? 'Found' : 'NOT FOUND'
  });
  
  // Check filter elements
  const statusFilter = document.getElementById('statusFilter');
  const locationFilter = document.getElementById('locationFilter');
  const serviceFilter = document.getElementById('serviceFilter');
  const dateFilter = document.getElementById('dateFilter');
  
  console.log('🔍 Filter elements:', {
    statusFilter: statusFilter ? 'Found' : 'NOT FOUND',
    locationFilter: locationFilter ? 'Found' : 'NOT FOUND',
    serviceFilter: serviceFilter ? 'Found' : 'NOT FOUND',
    dateFilter: dateFilter ? 'Found' : 'NOT FOUND'
  });
  
  // Check buttons
  const createOrderBtn = document.querySelector('[onclick="showCreateOrderModal()"]');
  const refreshBtn = document.querySelector('[onclick="refreshOrders()"]');
  const toastContainer = document.getElementById('toastContainer');
  
  console.log('🔍 Button and other elements:', {
    createOrderBtn: createOrderBtn ? 'Found' : 'NOT FOUND',
    refreshBtn: refreshBtn ? 'Found' : 'NOT FOUND',
    toastContainer: toastContainer ? 'Found' : 'NOT FOUND'
  });
  
  console.log('🔍 === END DEBUG ===');
}

// Initialize the orders manager when the page loads
let ordersManager;

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM loaded, starting initialization');
  
  // Debug page elements first
  debugPageElements();
  
  console.log('🚀 Initializing OrdersManager');
  ordersManager = new OrdersManager();
});

// Add event listeners for all buttons
document.addEventListener('DOMContentLoaded', function() {
  // Add event listeners for buttons
  const buttons = {
    'createOrderBtn': () => ordersManager?.showCreateOrderModal(),
    'refreshOrdersBtn': refreshOrders,
    'closeCreateModalBtn': () => ordersManager?.closeCreateOrderModal(),
    'cancelCreateOrderBtn': () => ordersManager?.closeCreateOrderModal(),
    'createOrderSubmitBtn': createOrder,
    'closeOrderDetailsBtn': () => ordersManager?.closeOrderDetailsModal(),
    'closeOrderDetailsFooterBtn': () => ordersManager?.closeOrderDetailsModal(),
    'updateStatusBtn': showUpdateStatusModal,
    'reloadPageBtn': () => location.reload()
  };

  // Add event listeners if elements exist
  Object.keys(buttons).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('click', buttons[id]);
      console.log(`✅ Event listener added for ${id}`);
    } else {
      console.log(`❌ Element not found: ${id}`);
    }
  });

  // Add change listeners for filters
  const filters = ['statusFilter', 'locationFilter', 'serviceFilter', 'dateFilter'];
  filters.forEach(filterId => {
    const element = document.getElementById(filterId);
    if (element) {
      element.addEventListener('change', applyFilters);
      console.log(`✅ Change listener added for ${filterId}`);
    } else {
      console.log(`❌ Filter element not found: ${filterId}`);
    }
  });
}); 