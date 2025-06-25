// ===== CALENDAR FUNCTIONALITY =====

class Calendar {
  constructor() {
    this.currentDate = new Date();
    this.currentView = 'month';
    this.events = [];
    this.customers = [];
    this.services = [];
    this.locations = [];
    this.selectedEvent = null;
    
    this.monthNames = [
      'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
      'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
    ];
    
    this.dayNames = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
    this.dayNamesShort = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
    
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
      
      // Render initial view
      this.render();
      
      this.hideLoading();
    } catch (error) {
      console.error('Calendar initialization error:', error);
      this.showToast('Eroare la încărcarea calendarului', 'error');
      this.hideLoading();
    }
  }
  
  async loadInitialData() {
    try {
      // Load events, customers, services, locations in parallel
      const [eventsResponse, customersResponse, servicesResponse, locationsResponse] = await Promise.all([
        authManager.apiRequest('/orders?include_recurring=true'),
        authManager.apiRequest('/customers'),
        authManager.apiRequest('/services'),
        authManager.apiRequest('/locations')
      ]);
      
      if (eventsResponse.success) {
        this.events = eventsResponse.data || [];
      }
      
      if (customersResponse.success) {
        this.customers = customersResponse.data || [];
        this.populateCustomerSelect();
      }
      
      if (servicesResponse.success) {
        this.services = servicesResponse.data || [];
        this.populateServiceSelect();
      }
      
      if (locationsResponse.success) {
        this.locations = locationsResponse.data || [];
        this.populateLocationSelect();
      }
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }
  
  setupEventListeners() {
    // View toggle buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        this.switchView(view);
      });
    });
    
    // Appointment type change
    document.getElementById('appointmentType').addEventListener('change', (e) => {
      this.handleAppointmentTypeChange(e.target.value);
    });
    
    // Recurring checkbox
    document.getElementById('appointmentRecurring').addEventListener('change', (e) => {
      document.getElementById('recurringOptions').style.display = 
        e.target.checked ? 'block' : 'none';
    });
  }

  // ===== VIEW MANAGEMENT =====
  
  switchView(view) {
    this.currentView = view;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Show/hide views
    document.getElementById('monthView').style.display = view === 'month' ? 'block' : 'none';
    document.getElementById('weekView').style.display = view === 'week' ? 'block' : 'none';
    document.getElementById('dayView').style.display = view === 'day' ? 'block' : 'none';
    
    this.render();
  }
  
  render() {
    this.updateTitle();
    
    switch (this.currentView) {
      case 'month':
        this.renderMonthView();
        break;
      case 'week':
        this.renderWeekView();
        break;
      case 'day':
        this.renderDayView();
        break;
    }
  }
  
  updateTitle() {
    const title = document.getElementById('calendarTitle');
    const dayTitle = document.getElementById('dayTitle');
    
    switch (this.currentView) {
      case 'month':
        title.textContent = `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        break;
      case 'week':
        const weekStart = this.getWeekStart(this.currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        title.textContent = `${weekStart.getDate()} - ${weekEnd.getDate()} ${this.monthNames[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
        break;
      case 'day':
        title.textContent = this.formatDate(this.currentDate);
        if (dayTitle) {
          dayTitle.textContent = this.formatDayTitle(this.currentDate);
        }
        break;
    }
  }

  // ===== MONTH VIEW =====
  
  renderMonthView() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // Add day headers
    this.dayNamesShort.forEach(day => {
      const header = document.createElement('div');
      header.className = 'calendar-day-header';
      header.textContent = day;
      grid.appendChild(header);
    });
    
    // Get first day of month and calculate calendar grid
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    const startDate = this.getWeekStart(firstDay);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dayElement = this.createDayElement(date, firstDay.getMonth());
      grid.appendChild(dayElement);
    }
  }
  
  createDayElement(date, currentMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    // Add classes based on date
    if (date.getMonth() !== currentMonth) {
      dayElement.classList.add('other-month');
    }
    
    if (this.isToday(date)) {
      dayElement.classList.add('today');
    }
    
    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayElement.appendChild(dayNumber);
    
    // Events for this day
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    
    const dayEvents = this.getEventsForDate(date);
    const maxVisible = 3;
    
    dayEvents.slice(0, maxVisible).forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = `event-item ${event.type || 'appointment'}`;
      eventElement.textContent = event.title || event.service_name || 'Eveniment';
      eventElement.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showEventDetails(event);
      });
      eventsContainer.appendChild(eventElement);
    });
    
    if (dayEvents.length > maxVisible) {
      const moreElement = document.createElement('div');
      moreElement.className = 'more-events';
      moreElement.textContent = `+${dayEvents.length - maxVisible} mai multe`;
      moreElement.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showDayEvents(date, dayEvents);
      });
      eventsContainer.appendChild(moreElement);
    }
    
    dayElement.appendChild(eventsContainer);
    
    // Click handler for day
    dayElement.addEventListener('click', () => {
      this.selectDate(date);
    });
    
    return dayElement;
  }

  // ===== WEEK VIEW =====
  
  renderWeekView() {
    const weekHeader = document.getElementById('weekHeader');
    const weekBody = document.getElementById('weekBody');
    
    weekHeader.innerHTML = '';
    weekBody.innerHTML = '';
    
    // Generate week header
    const timeHeader = document.createElement('div');
    timeHeader.className = 'week-time-header';
    timeHeader.textContent = 'Ora';
    weekHeader.appendChild(timeHeader);
    
    const weekStart = this.getWeekStart(this.currentDate);
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      
      const dayHeader = document.createElement('div');
      dayHeader.className = 'week-day-header';
      dayHeader.textContent = `${this.dayNamesShort[date.getDay()]} ${date.getDate()}`;
      
      if (this.isToday(date)) {
        dayHeader.style.background = '#eff6ff';
        dayHeader.style.color = '#1d4ed8';
      }
      
      weekHeader.appendChild(dayHeader);
    }
    
    // Generate time slots (8 AM to 8 PM)
    for (let hour = 8; hour < 20; hour++) {
      // Time label
      const timeSlot = document.createElement('div');
      timeSlot.className = 'week-time-slot';
      timeSlot.textContent = `${hour}:00`;
      weekBody.appendChild(timeSlot);
      
      // Day slots for this hour
      for (let day = 0; day < 7; day++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + day);
        date.setHours(hour, 0, 0, 0);
        
        const daySlot = document.createElement('div');
        daySlot.className = 'week-day-slot';
        daySlot.addEventListener('click', () => {
          this.selectDateTime(date);
        });
        
        // Add events for this hour
        const hourEvents = this.getEventsForHour(date);
        hourEvents.forEach(event => {
          const eventElement = document.createElement('div');
          eventElement.className = 'week-event';
          eventElement.textContent = event.title || event.service_name || 'Eveniment';
          eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showEventDetails(event);
          });
          daySlot.appendChild(eventElement);
        });
        
        weekBody.appendChild(daySlot);
      }
    }
  }

  // ===== DAY VIEW =====
  
  renderDayView() {
    const dayBody = document.getElementById('dayBody');
    dayBody.innerHTML = '';
    
    // Generate time slots (8 AM to 8 PM)
    for (let hour = 8; hour < 20; hour++) {
      // Time label
      const timeSlot = document.createElement('div');
      timeSlot.className = 'day-time-slot';
      timeSlot.textContent = `${hour}:00`;
      dayBody.appendChild(timeSlot);
      
      // Content slot
      const contentSlot = document.createElement('div');
      contentSlot.className = 'day-content-slot';
      
      const dateTime = new Date(this.currentDate);
      dateTime.setHours(hour, 0, 0, 0);
      
      contentSlot.addEventListener('click', () => {
        this.selectDateTime(dateTime);
      });
      
      // Add events for this hour
      const hourEvents = this.getEventsForHour(dateTime);
      hourEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'week-event';
        eventElement.textContent = event.title || event.service_name || 'Eveniment';
        eventElement.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showEventDetails(event);
        });
        contentSlot.appendChild(eventElement);
      });
      
      dayBody.appendChild(contentSlot);
    }
  }

  // ===== EVENT MANAGEMENT =====
  
  getEventsForDate(date) {
    const dateStr = this.formatDateString(date);
    return this.events.filter(event => {
      const eventDate = new Date(event.scheduled_date || event.created_at);
      return this.formatDateString(eventDate) === dateStr;
    });
  }
  
  getEventsForHour(dateTime) {
    const events = this.getEventsForDate(dateTime);
    const hour = dateTime.getHours();
    
    return events.filter(event => {
      if (event.scheduled_time) {
        const eventHour = parseInt(event.scheduled_time.split(':')[0]);
        return eventHour === hour;
      }
      return false;
    });
  }
  
  async showEventDetails(event) {
    this.selectedEvent = event;
    
    const modal = document.getElementById('eventModal');
    const title = document.getElementById('eventModalTitle');
    const body = document.getElementById('eventModalBody');
    const editBtn = document.getElementById('editEventBtn');
    const deleteBtn = document.getElementById('deleteEventBtn');
    
    title.textContent = event.title || event.service_name || 'Detalii Eveniment';
    
    // Populate event details
    body.innerHTML = `
      <div class="event-details">
        <div class="detail-row">
          <strong>Tip:</strong> ${this.getEventTypeLabel(event.type || 'order')}
        </div>
        <div class="detail-row">
          <strong>Data:</strong> ${this.formatDate(new Date(event.scheduled_date || event.created_at))}
        </div>
        ${event.scheduled_time ? `
          <div class="detail-row">
            <strong>Ora:</strong> ${event.scheduled_time}
          </div>
        ` : ''}
        ${event.customer_name ? `
          <div class="detail-row">
            <strong>Client:</strong> ${event.customer_name}
          </div>
        ` : ''}
        ${event.service_name ? `
          <div class="detail-row">
            <strong>Serviciu:</strong> ${event.service_name}
          </div>
        ` : ''}
        ${event.location_name ? `
          <div class="detail-row">
            <strong>Locație:</strong> ${event.location_name}
          </div>
        ` : ''}
        ${event.description ? `
          <div class="detail-row">
            <strong>Descriere:</strong> ${event.description}
          </div>
        ` : ''}
        <div class="detail-row">
          <strong>Status:</strong> 
          <span class="status-badge status-${(event.status || 'pending').toLowerCase()}">
            ${this.getStatusLabel(event.status || 'pending')}
          </span>
        </div>
        ${event.total_price ? `
          <div class="detail-row">
            <strong>Preț:</strong> ${event.total_price} RON
          </div>
        ` : ''}
      </div>
    `;
    
    // Show/hide action buttons based on user role and event ownership
    const user = authManager.currentUser;
    const canEdit = user.role === 'ADMIN' || user.role === 'MANAGER' || 
                   (user.role === 'EMPLOYEE' && event.assigned_employee_id === user.id);
    
    editBtn.style.display = canEdit ? 'inline-block' : 'none';
    deleteBtn.style.display = canEdit ? 'inline-block' : 'none';
    
    modal.style.display = 'flex';
  }
  
  closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
    this.selectedEvent = null;
  }
  
  async editEvent() {
    if (!this.selectedEvent) return;
    
    // Pre-populate form with event data
    document.getElementById('appointmentTitle').value = this.selectedEvent.title || this.selectedEvent.service_name || '';
    document.getElementById('appointmentType').value = this.selectedEvent.type || 'appointment';
    
    const eventDate = new Date(this.selectedEvent.scheduled_date || this.selectedEvent.created_at);
    document.getElementById('appointmentDate').value = this.formatDateString(eventDate);
    document.getElementById('appointmentTime').value = this.selectedEvent.scheduled_time || '09:00';
    document.getElementById('appointmentDescription').value = this.selectedEvent.description || '';
    
    if (this.selectedEvent.customer_id) {
      document.getElementById('appointmentCustomer').value = this.selectedEvent.customer_id;
    }
    if (this.selectedEvent.service_id) {
      document.getElementById('appointmentService').value = this.selectedEvent.service_id;
    }
    if (this.selectedEvent.location_id) {
      document.getElementById('appointmentLocation').value = this.selectedEvent.location_id;
    }
    
    // Change modal title and show appointment modal
    document.getElementById('appointmentModalTitle').textContent = 'Editează Programarea';
    this.closeEventModal();
    this.showAppointmentModal();
  }
  
  async deleteEvent() {
    if (!this.selectedEvent) return;
    
    if (!confirm('Ești sigur că vrei să ștergi această programare?')) {
      return;
    }
    
    try {
      this.showLoading();
      
      const response = await authManager.apiRequest(`/orders/${this.selectedEvent.order_id}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        this.showToast('Programarea a fost ștearsă cu succes', 'success');
        this.closeEventModal();
        await this.loadInitialData();
        this.render();
      } else {
        this.showToast('Eroare la ștergerea programării', 'error');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      this.showToast('Eroare la ștergerea programării', 'error');
    } finally {
      this.hideLoading();
    }
  }

  // ===== APPOINTMENT MODAL =====
  
  showNewAppointmentModal() {
    document.getElementById('appointmentModalTitle').textContent = 'Programare Nouă';
    this.resetAppointmentForm();
    document.getElementById('appointmentModal').style.display = 'flex';
    
    // Set default date and time
    const now = new Date();
    document.getElementById('appointmentDate').value = this.formatDateString(now);
    document.getElementById('appointmentTime').value = '09:00';
  }
  
  showAppointmentModal() {
    document.getElementById('appointmentModal').style.display = 'flex';
  }
  
  closeAppointmentModal() {
    document.getElementById('appointmentModal').style.display = 'none';
    this.resetAppointmentForm();
  }
  
  resetAppointmentForm() {
    document.getElementById('appointmentForm').reset();
    document.getElementById('customerGroup').style.display = 'none';
    document.getElementById('serviceGroup').style.display = 'none';
    document.getElementById('recurringOptions').style.display = 'none';
    document.getElementById('appointmentRecurring').checked = false;
  }
  
  handleAppointmentTypeChange(type) {
    const customerGroup = document.getElementById('customerGroup');
    const serviceGroup = document.getElementById('serviceGroup');
    
    if (type === 'appointment') {
      customerGroup.style.display = 'block';
      serviceGroup.style.display = 'block';
    } else {
      customerGroup.style.display = 'none';
      serviceGroup.style.display = 'none';
    }
  }
  
  async saveAppointment() {
    const form = document.getElementById('appointmentForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    try {
      this.showLoading();
      
      const formData = {
        title: document.getElementById('appointmentTitle').value,
        type: document.getElementById('appointmentType').value,
        scheduled_date: document.getElementById('appointmentDate').value,
        scheduled_time: document.getElementById('appointmentTime').value,
        duration: parseInt(document.getElementById('appointmentDuration').value),
        customer_id: document.getElementById('appointmentCustomer').value || null,
        service_id: document.getElementById('appointmentService').value || null,
        location_id: document.getElementById('appointmentLocation').value || null,
        description: document.getElementById('appointmentDescription').value,
        is_recurring: document.getElementById('appointmentRecurring').checked,
        recurring_type: document.getElementById('recurringType').value,
        recurring_end_date: document.getElementById('recurringEnd').value || null
      };
      
      // Remove empty values
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === null) {
          delete formData[key];
        }
      });
      
      let response;
      if (this.selectedEvent) {
        // Update existing appointment
        response = await authManager.apiRequest(`/orders/${this.selectedEvent.order_id}`, {
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
          this.selectedEvent ? 'Programarea a fost actualizată cu succes' : 'Programarea a fost creată cu succes',
          'success'
        );
        this.closeAppointmentModal();
        await this.loadInitialData();
        this.render();
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

  // ===== NAVIGATION =====
  
  previousPeriod() {
    switch (this.currentView) {
      case 'month':
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        break;
      case 'week':
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        break;
      case 'day':
        this.currentDate.setDate(this.currentDate.getDate() - 1);
        break;
    }
    this.render();
  }
  
  nextPeriod() {
    switch (this.currentView) {
      case 'month':
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        break;
      case 'week':
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        break;
      case 'day':
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        break;
    }
    this.render();
  }
  
  goToToday() {
    this.currentDate = new Date();
    this.render();
  }
  
  selectDate(date) {
    this.currentDate = new Date(date);
    if (this.currentView === 'month') {
      this.switchView('day');
    } else {
      this.render();
    }
  }
  
  selectDateTime(dateTime) {
    this.currentDate = new Date(dateTime);
    
    // Pre-fill appointment form with selected date/time
    document.getElementById('appointmentDate').value = this.formatDateString(dateTime);
    document.getElementById('appointmentTime').value = `${dateTime.getHours().toString().padStart(2, '0')}:00`;
    
    this.showNewAppointmentModal();
  }

  // ===== DATA POPULATION =====
  
  populateCustomerSelect() {
    const select = document.getElementById('appointmentCustomer');
    select.innerHTML = '<option value="">Selectează clientul</option>';
    
    this.customers.forEach(customer => {
      const option = document.createElement('option');
      option.value = customer.customer_id;
      option.textContent = `${customer.first_name} ${customer.last_name}`;
      select.appendChild(option);
    });
  }
  
  populateServiceSelect() {
    const select = document.getElementById('appointmentService');
    select.innerHTML = '<option value="">Selectează serviciul</option>';
    
    this.services.forEach(service => {
      const option = document.createElement('option');
      option.value = service.service_id;
      option.textContent = `${service.description} - ${service.base_price} RON`;
      select.appendChild(option);
    });
  }
  
  populateLocationSelect() {
    const select = document.getElementById('appointmentLocation');
    select.innerHTML = '<option value="">Selectează locația</option>';
    
    this.locations.forEach(location => {
      const option = document.createElement('option');
      option.value = location.location_id;
      option.textContent = location.name;
      select.appendChild(option);
    });
  }

  // ===== UTILITY FUNCTIONS =====
  
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }
  
  isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  formatDate(date) {
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  formatDayTitle(date) {
    return date.toLocaleDateString('ro-RO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  formatDateString(date) {
    return date.toISOString().split('T')[0];
  }
  
  getEventTypeLabel(type) {
    const types = {
      'appointment': 'Programare Client',
      'maintenance': 'Mentenanță',
      'meeting': 'Întâlnire',
      'training': 'Training',
      'order': 'Comandă',
      'other': 'Altele'
    };
    return types[type] || 'Eveniment';
  }
  
  getStatusLabel(status) {
    const statuses = {
      'pending': 'În așteptare',
      'confirmed': 'Confirmat',
      'in_progress': 'În progres',
      'completed': 'Finalizat',
      'cancelled': 'Anulat'
    };
    return statuses[status] || status;
  }
  
  showDayEvents(date, events) {
    // Switch to day view for the selected date
    this.currentDate = new Date(date);
    this.switchView('day');
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
}

// CSS for toast notifications
const toastStyles = `
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
  }
  
  .toast {
    background: white;
    border-radius: 5px;
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
  
  .event-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .detail-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .status-badge {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .status-pending {
    background: #fef3c7;
    color: #92400e;
  }
  
  .status-confirmed {
    background: #d1fae5;
    color: #065f46;
  }
  
  .status-in_progress {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .status-completed {
    background: #d1fae5;
    color: #065f46;
  }
  
  .status-cancelled {
    background: #fee2e2;
    color: #991b1b;
  }
`;

// Inject styles
if (!document.getElementById('calendar-toast-styles')) {
  const style = document.createElement('style');
  style.id = 'calendar-toast-styles';
  style.textContent = toastStyles;
  document.head.appendChild(style);
} 