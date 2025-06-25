// ===== APPOINTMENTS MANAGEMENT =====

class Appointments {
  constructor() {
    this.appointments = [];
    this.customers = [];
    this.services = [];
    this.locations = [];
    this.employees = [];
    this.filteredAppointments = [];
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.totalItems = 0;
    this.totalPages = 0;
    this.selectedAppointment = null;
    this.filters = {
      status: '',
      customer: '',
      service: '',
      location: '',
      dateFrom: '',
      dateTo: ''
    };
    
    this.init();
  }

  // ===== INITIALIZATION =====
  
  async init() {
    try {
      this.showLoading();
      
      // Load initial data
      await this.loadInitialData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Load appointments
      await this.loadAppointments();
      
      this.hideLoading();
    } catch (error) {
      console.error('Appointments initialization error:', error);
      this.showToast('Eroare la încărcarea programărilor', 'error');
      this.hideLoading();
    }
  }
  
  async loadInitialData() {
    try {
      // Load customers, services, locations in parallel
      const [customersResponse, servicesResponse, locationsResponse] = await Promise.all([
        authManager.apiRequest('/customers'),
        authManager.apiRequest('/services'),
        authManager.apiRequest('/locations')
      ]);
      
      if (customersResponse.success) {
        this.customers = customersResponse.data || [];
        this.populateCustomerFilters();
      }
      
      if (servicesResponse.success) {
        this.services = servicesResponse.data || [];
        this.populateServiceFilters();
      }
      
      if (locationsResponse.success) {
        this.locations = locationsResponse.data || [];
        this.populateLocationFilters();
      }
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }
  
  setupEventListeners() {
    // Recurring checkbox
    document.getElementById('appointmentRecurring').addEventListener('change', (e) => {
      document.getElementById('recurringOptions').style.display = 
        e.target.checked ? 'block' : 'none';
    });
    
    // Filter changes
    document.getElementById('statusFilter').addEventListener('change', () => this.applyFilters());
    document.getElementById('dateFromFilter').addEventListener('change', () => this.applyFilters());
    document.getElementById('dateToFilter').addEventListener('change', () => this.applyFilters());
    document.getElementById('customerFilter').addEventListener('change', () => this.applyFilters());
    document.getElementById('serviceFilter').addEventListener('change', () => this.applyFilters());
    document.getElementById('locationFilter').addEventListener('change', () => this.applyFilters());
  }

  // ===== DATA LOADING =====
  
  async loadAppointments() {
    try {
      this.showLoading();
      
      // Build query parameters
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: this.itemsPerPage,
        include_customer: true,
        include_service: true,
        include_location: true,
        ...this.filters
      });
      
      const response = await authManager.apiRequest(`/orders?${params}`);
      
      if (response.success) {
        this.appointments = response.data || [];
        this.totalItems = response.total || this.appointments.length;
        
        this.renderAppointments();
        this.renderPagination();
        this.updateStats();
      } else {
        this.showError('Nu s-au putut încărca programările');
      }
      
    } catch (error) {
      console.error('Error loading appointments:', error);
      this.showError('Eroare la încărcarea programărilor');
    } finally {
      this.hideLoading();
    }
  }
  
  async updateStats() {
    try {
      const response = await authManager.apiRequest('/stats/appointments');
      
      if (response.success) {
        const stats = response.data;
        
        document.getElementById('totalAppointments').textContent = stats.total || this.appointments.length;
        document.getElementById('pendingAppointments').textContent = stats.pending || 0;
        document.getElementById('confirmedAppointments').textContent = stats.confirmed || 0;
        document.getElementById('todayAppointments').textContent = stats.today || 0;
      } else {
        // Fallback to calculate from current data
        const pending = this.appointments.filter(a => a.status === 'pending').length;
        const confirmed = this.appointments.filter(a => a.status === 'confirmed').length;
        const today = this.appointments.filter(a => 
          new Date(a.scheduled_date).toDateString() === new Date().toDateString()
        ).length;
        
        document.getElementById('totalAppointments').textContent = this.appointments.length;
        document.getElementById('pendingAppointments').textContent = pending;
        document.getElementById('confirmedAppointments').textContent = confirmed;
        document.getElementById('todayAppointments').textContent = today;
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  // ===== RENDERING =====
  
  renderAppointments() {
    const grid = document.getElementById('appointmentsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (this.appointments.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = this.appointments.map(appointment => this.createAppointmentCard(appointment)).join('');
  }
  
  createAppointmentCard(appointment) {
    const statusClass = `status-${(appointment.status || 'pending').toLowerCase()}`;
    const user = authManager.currentUser;
    
    // Check permissions
    const canEdit = user.role === 'ADMIN' || user.role === 'MANAGER' || 
                   (user.role === 'EMPLOYEE' && appointment.assigned_employee_id === user.id);
    
    const canCancel = canEdit && appointment.status !== 'completed' && appointment.status !== 'cancelled';
    const canComplete = canEdit && appointment.status === 'in_progress';
    
    return `
      <div class="appointment-card ${statusClass}">
        <div class="appointment-header">
          <h3 class="appointment-title">${appointment.title || this.getServiceName(appointment)}</h3>
          <p class="appointment-subtitle">
            ${this.getCustomerName(appointment)} • 
            ${this.getScheduledDateTime(appointment)}
          </p>
        </div>
        
        <div class="appointment-body">
          <div class="appointment-details">
            <div class="detail-item">
              <span class="detail-icon">📅</span>
              <span class="detail-text">${appointment.scheduled_date ? this.formatDate(appointment.scheduled_date) : 'Data nespecificată'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">⏰</span>
              <span class="detail-text">${appointment.scheduled_time || 'Oră nespecificată'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">📊</span>
              <span class="detail-text">${this.getStatusLabel(appointment.status || 'pending')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">👤</span>
              <span class="detail-text">${this.getCustomerName(appointment)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">🏢</span>
              <span class="detail-text">${this.getLocationName(appointment)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">💼</span>
              <span class="detail-text">${this.getServiceName(appointment)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">💰</span>
              <span class="detail-text">${this.getTotalPrice(appointment)}</span>
            </div>
          </div>
        </div>
        
        <div class="appointment-actions">
          <button class="btn-action btn-view" onclick="appointments.viewAppointment(${appointment.order_id})">
            👁️ Vezi
          </button>
          ${canEdit ? `
            <button class="btn-action btn-edit" onclick="appointments.editAppointment(${appointment.order_id})">
              ✏️ Editează
            </button>
          ` : ''}
          ${canComplete ? `
            <button class="btn-action btn-complete" onclick="appointments.completeAppointment(${appointment.order_id})">
              ✅ Finalizează
            </button>
          ` : ''}
          ${canCancel ? `
            <button class="btn-action btn-cancel" onclick="appointments.cancelAppointment(${appointment.order_id})">
              ❌ Anulează
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    if (totalPages <= 1) {
      pagination.style.display = 'none';
      return;
    }
    
    pagination.style.display = 'flex';
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
      <button class="pagination-btn" onclick="appointments.goToPage(${this.currentPage - 1})" 
              ${this.currentPage === 1 ? 'disabled' : ''}>
        ‹ Anterior
      </button>
    `;
    
    // Page numbers
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(totalPages, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                onclick="appointments.goToPage(${i})">
          ${i}
        </button>
      `;
    }
    
    // Next button
    paginationHTML += `
      <button class="pagination-btn" onclick="appointments.goToPage(${this.currentPage + 1})" 
              ${this.currentPage === totalPages ? 'disabled' : ''}>
        Următor ›
      </button>
    `;
    
    pagination.innerHTML = paginationHTML;
  }

  // ===== APPOINTMENT ACTIONS =====
  
  async viewAppointment(appointmentId) {
    const appointment = this.appointments.find(a => a.order_id === appointmentId);
    if (!appointment) return;
    
    this.selectedAppointment = appointment;
    
    const modal = document.getElementById('appointmentDetailsModal');
    const title = document.getElementById('appointmentDetailsTitle');
    const body = document.getElementById('appointmentDetailsBody');
    const editBtn = document.getElementById('editAppointmentBtn');
    const cancelBtn = document.getElementById('cancelAppointmentBtn');
    
    title.textContent = appointment.title || this.getServiceName(appointment);
    
    // Populate details
    body.innerHTML = `
      <div class="appointment-details-full">
        <div class="detail-section">
          <h4>Informații Generale</h4>
          <div class="detail-row">
            <strong>Titlu:</strong> ${appointment.title || this.getServiceName(appointment)}
          </div>
          <div class="detail-row">
            <strong>📅 Data:</strong> ${appointment.scheduled_date ? this.formatDate(appointment.scheduled_date) : 'Data nespecificată'}
          </div>
          <div class="detail-row">
            <strong>⏰ Ora:</strong> ${appointment.scheduled_time || 'Oră nespecificată'}
          </div>
          <div class="detail-row">
            <strong>📊 Status:</strong> 
            <span class="appointment-status status-${(appointment.status || 'pending').toLowerCase()}">
              ${this.getStatusLabel(appointment.status || 'pending')}
            </span>
          </div>
        </div>
        
        <div class="detail-section">
          <h4>Client & Serviciu</h4>
          <div class="detail-row">
            <strong>👤 Client:</strong> ${this.getCustomerName(appointment)}
          </div>
          <div class="detail-row">
            <strong>💼 Serviciu:</strong> ${this.getServiceName(appointment)}
          </div>
          <div class="detail-row">
            <strong>🏢 Locație:</strong> ${this.getLocationName(appointment)}
          </div>
          <div class="detail-row">
            <strong>💰 Preț:</strong> ${this.getTotalPrice(appointment)}
          </div>
        </div>
        
        ${appointment.description || appointment.special_instructions ? `
          <div class="detail-section">
            <h4>Descriere</h4>
            <p>${appointment.description || appointment.special_instructions}</p>
          </div>
        ` : ''}
        
        <div class="detail-section">
          <h4>Detalii Tehnice</h4>
          <div class="detail-row">
            <strong>ID Comandă:</strong> ${appointment.order_id}
          </div>
          <div class="detail-row">
            <strong>Creat la:</strong> ${this.formatDateTime(appointment.created_at)}
          </div>
          ${appointment.updated_at ? `
            <div class="detail-row">
              <strong>Actualizat la:</strong> ${this.formatDateTime(appointment.updated_at)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Show/hide action buttons based on permissions
    const user = authManager.currentUser;
    const canEdit = user.role === 'ADMIN' || user.role === 'MANAGER' || 
                   (user.role === 'EMPLOYEE' && appointment.assigned_employee_id === user.id);
    
    editBtn.style.display = canEdit ? 'inline-block' : 'none';
    cancelBtn.style.display = canEdit && appointment.status !== 'completed' && appointment.status !== 'cancelled' ? 'inline-block' : 'none';
    
    // Show modal
    modal.style.display = 'flex';
    modal.classList.add('visible');
  }
  
  closeDetailsModal() {
    const modal = document.getElementById('appointmentDetailsModal');
    modal.style.display = 'none';
    modal.classList.remove('visible');
    this.selectedAppointment = null;
  }
  
  async editAppointment(appointmentId) {
    let appointment;
    
    if (appointmentId) {
      appointment = this.appointments.find(a => a.order_id === appointmentId);
    } else {
      appointment = this.selectedAppointment;
    }
    
    if (!appointment) return;
    
    // Pre-populate form
    document.getElementById('appointmentTitle').value = appointment.title || appointment.service_name || '';
    document.getElementById('appointmentDate').value = appointment.scheduled_date || '';
    document.getElementById('appointmentTime').value = appointment.scheduled_time || '';
    document.getElementById('appointmentCustomer').value = appointment.customer_id || '';
    document.getElementById('appointmentService').value = appointment.service_id || '';
    document.getElementById('appointmentLocation').value = appointment.location_id || '';
    document.getElementById('appointmentDescription').value = appointment.description || '';
    
    // Set modal title
    document.getElementById('appointmentModalTitle').textContent = 'Editează Programarea';
    
    // Store appointment for update
    this.selectedAppointment = appointment;
    
    // Close details modal if open
    this.closeDetailsModal();
    
    // Show appointment modal
    this.showAppointmentModal();
  }
  
  async completeAppointment(appointmentId) {
    if (!confirm('Ești sigur că vrei să marchezi această programare ca finalizată?')) {
      return;
    }
    
    try {
      this.showLoading();
      
      const response = await authManager.apiRequest(`/orders/${appointmentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' })
      });
      
      if (response.success) {
        this.showToast('Programarea a fost marcată ca finalizată', 'success');
        await this.loadAppointments();
      } else {
        this.showToast('Eroare la actualizarea programării', 'error');
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
      this.showToast('Eroare la actualizarea programării', 'error');
    } finally {
      this.hideLoading();
    }
  }
  
  async cancelAppointment(appointmentId) {
    let id = appointmentId;
    
    if (!id && this.selectedAppointment) {
      id = this.selectedAppointment.order_id;
    }
    
    if (!id) return;
    
    if (!confirm('Ești sigur că vrei să anulezi această programare?')) {
      return;
    }
    
    try {
      this.showLoading();
      
      const response = await authManager.apiRequest(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' })
      });
      
      if (response.success) {
        this.showToast('Programarea a fost anulată', 'success');
        this.closeDetailsModal();
        await this.loadAppointments();
      } else {
        this.showToast('Eroare la anularea programării', 'error');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      this.showToast('Eroare la anularea programării', 'error');
    } finally {
      this.hideLoading();
    }
  }

  // ===== APPOINTMENT MODAL =====
  
  showNewAppointmentModal() {
    document.getElementById('appointmentModalTitle').textContent = 'Programare Nouă';
    this.resetAppointmentForm();
    this.selectedAppointment = null;
    
    // Set default date and time
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    document.getElementById('appointmentDate').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('appointmentTime').value = '09:00';
    
    this.showAppointmentModal();
  }
  
  showAppointmentModal() {
    const modal = document.getElementById('appointmentModal');
    modal.style.display = 'flex';
    modal.classList.add('visible');
  }
  
  closeAppointmentModal() {
    const modal = document.getElementById('appointmentModal');
    modal.style.display = 'none';
    modal.classList.remove('visible');
    this.resetAppointmentForm();
    this.selectedAppointment = null;
  }
  
  resetAppointmentForm() {
    document.getElementById('appointmentForm').reset();
    document.getElementById('recurringOptions').style.display = 'none';
    document.getElementById('appointmentRecurring').checked = false;
  }
  
  async saveAppointment() {
    const form = document.getElementById('appointmentForm');
    
    // Manual validation for better UX
    const title = document.getElementById('appointmentTitle').value.trim();
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const customerId = document.getElementById('appointmentCustomer').value;
    const serviceId = document.getElementById('appointmentService').value;
    const locationId = document.getElementById('appointmentLocation').value;
    
    if (!title) {
      this.showToast('Vă rugăm să introduceți titlul programării', 'error');
      return;
    }
    
    if (!date) {
      this.showToast('Vă rugăm să selectați data', 'error');
      return;
    }
    
    if (!time) {
      this.showToast('Vă rugăm să selectați ora', 'error');
      return;
    }
    
    if (!customerId) {
      this.showToast('Vă rugăm să selectați clientul', 'error');
      return;
    }
    
    if (!serviceId) {
      this.showToast('Vă rugăm să selectați serviciul', 'error');
      return;
    }
    
    if (!locationId) {
      this.showToast('Vă rugăm să selectați locația', 'error');
      return;
    }
    
    try {
      this.showLoading();
      
      const serviceIdInt = parseInt(serviceId);
      
      // Get the selected service to extract unit_price
      const selectedService = this.services.find(service => service.service_id === serviceIdInt);
      if (!selectedService) {
        this.showToast('Serviciul selectat nu a fost găsit', 'error');
        return;
      }
      
      const formData = {
        title: title,
        customer_id: parseInt(customerId),
        service_id: serviceIdInt,
        location_id: parseInt(locationId),
        scheduled_for: `${date}T${time}:00`, // Combine date and time for backend
        special_instructions: document.getElementById('appointmentDescription').value,
        estimated_duration: parseInt(document.getElementById('appointmentDuration').value) || 60,
        unit_price: parseFloat(selectedService.base_price), // Send unit_price to backend
        total_amount: parseFloat(selectedService.base_price), // Set total_amount as well
        is_recurring: document.getElementById('appointmentRecurring').checked,
        recurring_type: document.getElementById('recurringType').value,
        recurring_end_date: document.getElementById('recurringEnd').value || null
      };
      
      // Remove empty values (but keep 0 values for price and duration)
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === null || (isNaN(formData[key]) && typeof formData[key] === 'number')) {
          delete formData[key];
        }
      });
      
      let response;
      if (this.selectedAppointment) {
        // Update existing appointment
        response = await authManager.apiRequest(`/orders/${this.selectedAppointment.order_id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        // Create new appointment
        response = await authManager.apiRequest('/orders', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      
      if (response.success) {
        this.showToast(
          this.selectedAppointment ? 'Programarea a fost actualizată cu succes' : 'Programarea a fost creată cu succes',
          'success'
        );
        this.closeAppointmentModal();
        
        // Add a small delay to ensure server has processed the operation
        setTimeout(async () => {
          await this.loadAppointments();
        }, 500);
      } else {
        this.showToast('Eroare la salvarea programării', 'error');
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      this.showToast('Eroare la salvarea programării', 'error');
    } finally {
      this.hideLoading();
    }
  }

  // ===== FILTERS =====
  
  applyFilters() {
    this.filters = {};
    
    const status = document.getElementById('statusFilter').value;
    const dateFrom = document.getElementById('dateFromFilter').value;
    const dateTo = document.getElementById('dateToFilter').value;
    const customer = document.getElementById('customerFilter').value;
    const service = document.getElementById('serviceFilter').value;
    const location = document.getElementById('locationFilter').value;
    
    if (status) this.filters.status = status;
    if (dateFrom) this.filters.date_from = dateFrom;
    if (dateTo) this.filters.date_to = dateTo;
    if (customer) this.filters.customer_id = customer;
    if (service) this.filters.service_id = service;
    if (location) this.filters.location_id = location;
    
    this.currentPage = 1;
    this.loadAppointments();
  }
  
  resetFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    document.getElementById('customerFilter').value = '';
    document.getElementById('serviceFilter').value = '';
    document.getElementById('locationFilter').value = '';
    
    this.filters = {};
    this.currentPage = 1;
    this.loadAppointments();
  }

  // ===== PAGINATION =====
  
  goToPage(page) {
    if (page < 1 || page > Math.ceil(this.totalItems / this.itemsPerPage)) {
      return;
    }
    
    this.currentPage = page;
    this.loadAppointments();
  }

  // ===== DATA POPULATION =====
  
  populateCustomerFilters() {
    const filterSelect = document.getElementById('customerFilter');
    const modalSelect = document.getElementById('appointmentCustomer');
    
    // Clear existing options
    filterSelect.innerHTML = '<option value="">Toți clienții</option>';
    modalSelect.innerHTML = '<option value="">Selectează clientul</option>';
    
    this.customers.forEach(customer => {
      const optionText = `${customer.first_name} ${customer.last_name}`;
      
      // Filter select
      const filterOption = document.createElement('option');
      filterOption.value = customer.customer_id;
      filterOption.textContent = optionText;
      filterSelect.appendChild(filterOption);
      
      // Modal select
      const modalOption = document.createElement('option');
      modalOption.value = customer.customer_id;
      modalOption.textContent = optionText;
      modalSelect.appendChild(modalOption);
    });
  }
  
  populateServiceFilters() {
    const filterSelect = document.getElementById('serviceFilter');
    const modalSelect = document.getElementById('appointmentService');
    
    // Clear existing options
    filterSelect.innerHTML = '<option value="">Toate serviciile</option>';
    modalSelect.innerHTML = '<option value="">Selectează serviciul</option>';
    
    this.services.forEach(service => {
      const optionText = `${service.description} - ${service.base_price} RON`;
      
      // Filter select
      const filterOption = document.createElement('option');
      filterOption.value = service.service_id;
      filterOption.textContent = service.description;
      filterSelect.appendChild(filterOption);
      
      // Modal select
      const modalOption = document.createElement('option');
      modalOption.value = service.service_id;
      modalOption.textContent = optionText;
      modalSelect.appendChild(modalOption);
    });
  }
  
  populateLocationFilters() {
    const filterSelect = document.getElementById('locationFilter');
    const modalSelect = document.getElementById('appointmentLocation');
    
    // Clear existing options
    filterSelect.innerHTML = '<option value="">Toate locațiile</option>';
    modalSelect.innerHTML = '<option value="">Selectează locația</option>';
    
    this.locations.forEach(location => {
      // Filter select
      const filterOption = document.createElement('option');
      filterOption.value = location.location_id;
      filterOption.textContent = location.name;
      filterSelect.appendChild(filterOption);
      
      // Modal select
      const modalOption = document.createElement('option');
      modalOption.value = location.location_id;
      modalOption.textContent = location.name;
      modalSelect.appendChild(modalOption);
    });
  }

  // ===== UTILITY FUNCTIONS =====
  
  formatDate(dateString) {
    if (!dateString) return 'Dată nespecificată';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  formatDateTime(dateString) {
    if (!dateString) return 'Dată nespecificată';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  getStatusLabel(status) {
    const statuses = {
      'pending': '⏳ În așteptare',
      'confirmed': '✅ Confirmat',
      'in_progress': '🔄 În progres',
      'completed': '✅ Finalizat',
      'cancelled': '❌ Anulat'
    };
    return statuses[status] || `❓ ${status}`;
  }
  
  showError(message) {
    const grid = document.getElementById('appointmentsGrid');
    grid.innerHTML = `
      <div class="error-message">
        <h3>Eroare</h3>
        <p>${message}</p>
        <button onclick="appointments.loadAppointments()" class="btn btn-primary">Reîncarcă</button>
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
    const container = document.getElementById('toastContainer') || document.body;
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

  // Helper functions for data mapping
  getCustomerName(appointment) {
    if (appointment.customer_first_name && appointment.customer_last_name) {
      return `${appointment.customer_first_name} ${appointment.customer_last_name}`;
    } else if (appointment.customer_name) {
      return appointment.customer_name;
    } else if (appointment.customer_email) {
      return appointment.customer_email;
    }
    return `Client #${appointment.customer_id}`;
  }

  getServiceName(appointment) {
    return appointment.service_name || `Serviciu #${appointment.service_id}`;
  }

  getLocationName(appointment) {
    return appointment.location_name || `Locație #${appointment.location_id}`;
  }

  getTotalPrice(appointment) {
    if (appointment.total_amount) {
      return `${appointment.total_amount} RON`;
    } else if (appointment.base_price) {
      return `${appointment.base_price} RON`;
    }
    return 'Preț nespecificat';
  }

  getScheduledDateTime(appointment) {
    if (appointment.scheduled_date) {
      const date = this.formatDate(appointment.scheduled_date);
      const time = appointment.scheduled_time || '';
      return time ? `${date} ${time}` : date;
    }
    return 'Data nespecificată';
  }
}

// CSS for additional styles
const appointmentStyles = `
  .detail-section {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .detail-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
  
  .detail-section h4 {
    margin: 0 0 10px 0;
    color: #374151;
    font-size: 1rem;
    font-weight: 600;
  }
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding: 5px 0;
  }
  
  .detail-row:last-child {
    margin-bottom: 0;
  }
  
  .error-message {
    text-align: center;
    padding: 40px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  .error-message h3 {
    color: #ef4444;
    margin-bottom: 10px;
  }
  
  .error-message p {
    color: #6b7280;
    margin-bottom: 20px;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #374151;
  }
  
  .form-input, .form-select, .form-textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.3s;
  }
  
  .form-input:focus, .form-select:focus, .form-textarea:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 10px;
    max-width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
  
  .modal-header {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }
  
  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal-close:hover {
    color: #374151;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .modal-footer {
    padding: 20px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  
  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s;
  }
  
  .btn-primary {
    background: #6366f1;
    color: white;
  }
  
  .btn-primary:hover {
    background: #5855eb;
  }
  
  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }
  
  .btn-secondary:hover {
    background: #e5e7eb;
  }
  
  .btn-danger {
    background: #ef4444;
    color: white;
  }
  
  .btn-danger:hover {
    background: #dc2626;
  }
  
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
  }
  
  .toast {
    background: white;
    border-radius: 6px;
    padding: 15px 20px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    animation: slideIn 0.3s ease;
  }
  
  .toast-success {
    border-left: 4px solid #10b981;
  }
  
  .toast-error {
    border-left: 4px solid #ef4444;
  }
  
  .toast-info {
    border-left: 4px solid #6366f1;
  }
  
  .toast-warning {
    border-left: 4px solid #f59e0b;
  }
  
  .toast-message {
    flex: 1;
    margin-right: 10px;
  }
  
  .toast-close {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .toast-close:hover {
    color: #374151;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .modal-content {
      max-width: 95%;
    }
  }
`;

// Inject styles
if (!document.getElementById('appointments-styles')) {
  const style = document.createElement('style');
  style.id = 'appointments-styles';
  style.textContent = appointmentStyles;
  document.head.appendChild(style);
} 