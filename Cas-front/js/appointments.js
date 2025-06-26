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
    console.log('🚀 Appointments: Starting initialization');
    
    // Check authentication
    if (!authManager.requireAuth()) {
      console.log('❌ Appointments: Authentication check failed');
      return;
    }
    console.log('✅ Appointments: Authentication check passed');

    try {
      // Show loading state
      console.log('⏳ Appointments: Showing loading state');
      this.showLoading();
      
      // Load initial data
      console.log('📊 Appointments: Loading initial data');
      await this.loadInitialData();
      console.log('✅ Appointments: Initial data loaded successfully');
      
      // Setup event listeners
      console.log('🎯 Appointments: Setting up event listeners');
      this.setupEventListeners();
      console.log('✅ Appointments: Event listeners set up successfully');
      
      // Show appointments content
      console.log('📋 Appointments: Showing appointments content');
      this.loadAppointments();
      console.log('🎉 Appointments: Initialization completed successfully');
      
    } catch (error) {
      console.error('❌ Appointments: Initialization error:', error);
      this.showError('Nu s-a putut încărca pagina de programări. Vă rugăm să reîncărcați pagina.');
    }
  }
  
  async loadInitialData() {
    try {
      // Load customers
      const customersResponse = await authManager.apiRequest('/customers');
      if (customersResponse.success) {
        this.customers = customersResponse.data;
        this.populateCustomerSelect();
      }

      // Load services
      const servicesResponse = await authManager.apiRequest('/services');
      if (servicesResponse.success) {
        this.services = servicesResponse.data;
        this.populateServiceSelect();
      }

      // Load locations
      const locationsResponse = await authManager.apiRequest('/locations');
      if (locationsResponse.success) {
        this.locations = locationsResponse.data;
        this.populateLocationSelect();
      }

      // Load employees
      const employeesResponse = await authManager.apiRequest('/employees');
      if (employeesResponse.success) {
        this.employees = employeesResponse.data;
        this.populateEmployeeSelect();
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      throw error;
    }
  }
  
  setupEventListeners() {
    // Recurring checkbox
    document.getElementById('appointmentRecurring').addEventListener('change', (e) => {
      document.getElementById('recurringOptions').classList.toggle('visible', e.target.checked);
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
      
      const queryParams = new URLSearchParams({
        page: this.currentPage,
        per_page: this.itemsPerPage,
        ...this.filters
      });
      
      const response = await authManager.apiRequest(`/appointments?${queryParams}`);
      
      if (response.success) {
        this.appointments = response.data.appointments;
        this.totalItems = response.data.total;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        
        this.renderAppointments();
        this.renderPagination();
        this.updateStats();
      } else {
        this.showError('Nu s-au putut încărca programările.');
      }
      
    } catch (error) {
      console.error('Error loading appointments:', error);
      this.showError('A apărut o eroare la încărcarea programărilor.');
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
      grid.classList.remove('visible');
      emptyState.classList.add('visible');
      return;
    }
    
    grid.classList.add('visible');
    emptyState.classList.remove('visible');
    
    grid.innerHTML = this.appointments.map(appointment => this.createAppointmentCard(appointment)).join('');
  }
  
  createAppointmentCard(appointment) {
    return `
      <div class="appointment-card" onclick="appointments.viewAppointment('${appointment.id}')">
        <div class="appointment-header">
          <h3 class="appointment-title">${appointment.title || this.getServiceName(appointment)}</h3>
          <span class="appointment-status status-${(appointment.status || 'pending').toLowerCase()}">
            ${this.getStatusLabel(appointment.status || 'pending')}
          </span>
        </div>
        <div class="appointment-info">
          <div class="info-row">
            <span>📅 Data:</span>
            <span>${appointment.scheduled_date ? this.formatDate(appointment.scheduled_date) : 'Data nespecificată'}</span>
          </div>
          <div class="info-row">
            <span>⏰ Ora:</span>
            <span>${appointment.scheduled_time || 'Oră nespecificată'}</span>
          </div>
          <div class="info-row">
            <span>👤 Client:</span>
            <span>${this.getCustomerName(appointment)}</span>
          </div>
          <div class="info-row">
            <span>📍 Locație:</span>
            <span>${this.getLocationName(appointment)}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    if (this.totalPages <= 1) {
      pagination.classList.remove('visible');
      return;
    }

    pagination.classList.add('visible');
    
    let html = '';
    
    // Previous button
    html += `
      <button class="pagination-btn" 
              onclick="appointments.goToPage(${this.currentPage - 1})"
              ${this.currentPage === 1 ? 'disabled' : ''}>
        ◀
      </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= this.totalPages; i++) {
      html += `
        <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}"
                onclick="appointments.goToPage(${i})">
          ${i}
        </button>
      `;
    }
    
    // Next button
    html += `
      <button class="pagination-btn"
              onclick="appointments.goToPage(${this.currentPage + 1})"
              ${this.currentPage === this.totalPages ? 'disabled' : ''}>
        ▶
      </button>
    `;
    
    pagination.innerHTML = html;
  }

  // ===== APPOINTMENT ACTIONS =====
  
  async viewAppointment(appointmentId) {
    const appointment = this.appointments.find(a => a.id === appointmentId);
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
            <strong>📍 Locație:</strong> ${this.getLocationName(appointment)}
          </div>
          ${appointment.employee_id ? `
            <div class="detail-row">
              <strong>👷 Angajat:</strong> ${this.getEmployeeName(appointment)}
            </div>
          ` : ''}
        </div>
        
        ${appointment.description ? `
          <div class="detail-section">
            <h4>Descriere</h4>
            <div class="detail-row">
              ${appointment.description}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    // Show/hide action buttons based on status
    editBtn.classList.toggle('visible', ['pending', 'confirmed'].includes(appointment.status));
    cancelBtn.classList.toggle('visible', ['pending', 'confirmed'].includes(appointment.status));
    
    // Show modal
    modal.classList.add('visible');
  }
  
  closeDetailsModal() {
    const modal = document.getElementById('appointmentDetailsModal');
    modal.classList.remove('visible');
    this.selectedAppointment = null;
  }
  
  async editAppointment(appointmentId) {
    let appointment;
    
    if (appointmentId) {
      appointment = this.appointments.find(a => a.id === appointmentId);
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
    document.getElementById('appointmentEmployee').value = appointment.employee_id || '';
    document.getElementById('appointmentDescription').value = appointment.description || '';
    
    // Set modal title
    document.getElementById('appointmentModalTitle').textContent = 'Editează Programarea';
    
    // Close details modal if open
    this.closeDetailsModal();
    
    // Show appointment modal
    this.showAppointmentModal();
  }
  
  async cancelAppointment() {
    if (!this.selectedAppointment) return;
    
    if (!confirm('Sigur doriți să anulați această programare?')) return;
    
    try {
      this.showLoading();
      
      const response = await authManager.apiRequest(`/appointments/${this.selectedAppointment.id}/cancel`, {
        method: 'POST'
      });
      
      if (response.success) {
        this.showSuccess('Programarea a fost anulată cu succes.');
        this.closeDetailsModal();
        this.loadAppointments();
      } else {
        this.showError('Nu s-a putut anula programarea.');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      this.showError('A apărut o eroare la anularea programării.');
    } finally {
      this.hideLoading();
    }
  }

  // ===== APPOINTMENT MODAL =====
  
  showNewAppointmentModal() {
    this.resetAppointmentForm();
    document.getElementById('appointmentModalTitle').textContent = 'Programare Nouă';
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
    modal.classList.add('visible');
  }
  
  closeAppointmentModal() {
    const modal = document.getElementById('appointmentModal');
    modal.classList.remove('visible');
    this.resetAppointmentForm();
    this.selectedAppointment = null;
  }
  
  resetAppointmentForm() {
    document.getElementById('appointmentForm').reset();
    document.getElementById('recurringOptions').classList.remove('visible');
    document.getElementById('appointmentRecurring').checked = false;
  }
  
  async saveAppointment() {
    const form = document.getElementById('appointmentForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    const appointmentData = {
      title: document.getElementById('appointmentTitle').value,
      scheduled_date: document.getElementById('appointmentDate').value,
      scheduled_time: document.getElementById('appointmentTime').value,
      customer_id: document.getElementById('appointmentCustomer').value,
      service_id: document.getElementById('appointmentService').value,
      location_id: document.getElementById('appointmentLocation').value,
      employee_id: document.getElementById('appointmentEmployee').value || null,
      description: document.getElementById('appointmentDescription').value,
      recurring: document.getElementById('appointmentRecurring').checked,
      recurring_frequency: document.getElementById('recurringFrequency').value,
      recurring_count: parseInt(document.getElementById('recurringCount').value, 10)
    };
    
    try {
      this.showLoading();
      
      const endpoint = this.selectedAppointment ? 
        `/appointments/${this.selectedAppointment.id}` : 
        '/appointments';
      
      const method = this.selectedAppointment ? 'PUT' : 'POST';
      
      const response = await authManager.apiRequest(endpoint, {
        method,
        body: JSON.stringify(appointmentData)
      });
      
      if (response.success) {
        this.showSuccess(
          this.selectedAppointment ? 
          'Programarea a fost actualizată cu succes.' : 
          'Programarea a fost creată cu succes.'
        );
        this.closeAppointmentModal();
        this.loadAppointments();
      } else {
        this.showError('Nu s-a putut salva programarea.');
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      this.showError('A apărut o eroare la salvarea programării.');
    } finally {
      this.hideLoading();
    }
  }

  // ===== FILTERS =====
  
  applyFilters() {
    this.filters = {
      status: document.getElementById('statusFilter').value,
      date_from: document.getElementById('dateFromFilter').value,
      date_to: document.getElementById('dateToFilter').value,
      customer_id: document.getElementById('customerFilter').value,
      service_id: document.getElementById('serviceFilter').value,
      location_id: document.getElementById('locationFilter').value
    };
    
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
  
  populateCustomerSelect() {
    const customerSelects = ['customerFilter', 'appointmentCustomer'];
    customerSelects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (!select) return;

      select.innerHTML = '<option value="">Selectează clientul</option>';
      this.customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} (${customer.email})`;
        select.appendChild(option);
      });
    });
  }
  
  populateServiceSelect() {
    const serviceSelects = ['serviceFilter', 'appointmentService'];
    serviceSelects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (!select) return;

      select.innerHTML = '<option value="">Selectează serviciul</option>';
      this.services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = service.name;
        select.appendChild(option);
      });
    });
  }
  
  populateLocationSelect() {
    const locationSelects = ['locationFilter', 'appointmentLocation'];
    locationSelects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (!select) return;

      select.innerHTML = '<option value="">Selectează locația</option>';
      this.locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.id;
        option.textContent = location.name;
        select.appendChild(option);
      });
    });
  }

  populateEmployeeSelect() {
    const select = document.getElementById('appointmentEmployee');
    if (!select) return;

    select.innerHTML = '<option value="">Selectează angajatul</option>';
    this.employees.forEach(employee => {
      const option = document.createElement('option');
      option.value = employee.id;
      option.textContent = employee.name;
      select.appendChild(option);
    });
  }

  // ===== HELPER FUNCTIONS =====
  
  getCustomerName(appointment) {
    const customer = this.customers.find(c => c.id === appointment.customer_id);
    return customer ? customer.name : 'Client necunoscut';
  }

  getServiceName(appointment) {
    const service = this.services.find(s => s.id === appointment.service_id);
    return service ? service.name : 'Serviciu necunoscut';
  }

  getLocationName(appointment) {
    const location = this.locations.find(l => l.id === appointment.location_id);
    return location ? location.name : 'Locație necunoscută';
  }

  getEmployeeName(appointment) {
    const employee = this.employees.find(e => e.id === appointment.employee_id);
    return employee ? employee.name : 'Angajat necunoscut';
  }

  getStatusLabel(status) {
    const labels = {
      pending: 'În Așteptare',
      confirmed: 'Confirmat',
      cancelled: 'Anulat'
    };
    return labels[status] || status;
  }
  
  formatDate(date) {
    return new Date(date).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ===== UI FEEDBACK =====
  
  showLoading() {
    document.getElementById('loadingOverlay').classList.add('visible');
  }
  
  hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('visible');
  }
  
  showSuccess(message) {
    this.showToast(message, 'success');
  }
  
  showError(message) {
    this.showToast(message, 'error');
  }
  
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 5000);
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