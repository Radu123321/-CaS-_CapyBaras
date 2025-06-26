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
    this.viewDate = new Date();
    
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
      // Add cache-busting timestamp to prevent cache issues
      const timestamp = Date.now();
      
      // Load events, customers, services, locations in parallel
      const [eventsResponse, customersResponse, servicesResponse, locationsResponse] = await Promise.all([
        authManager.apiRequest(`/orders?include_recurring=true&_t=${timestamp}`),
        authManager.apiRequest(`/customers?_t=${timestamp}`),
        authManager.apiRequest(`/services?_t=${timestamp}`),
        authManager.apiRequest(`/locations?_t=${timestamp}`)
      ]);
      
      if (eventsResponse.success) {
        this.events = eventsResponse.data || [];
        console.log('Loaded events:', this.events.length, 'at', new Date().toLocaleTimeString());
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
      document.getElementById('recurringOptions').classList.toggle('visible', e.target.checked);
    });

    // Modal close events
    this.setupModalEvents();
  }

  setupModalEvents() {
    // Event modal close
    const eventModal = document.getElementById('eventModal');
    const appointmentModal = document.getElementById('appointmentModal');

    // Close on overlay click
    eventModal.addEventListener('click', (e) => {
      if (e.target === eventModal) {
        this.closeEventDetailsModal();
      }
    });

    appointmentModal.addEventListener('click', (e) => {
      if (e.target === appointmentModal) {
        this.closeAppointmentModal();
      }
    });

    // Close on X button click
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal.id === 'eventModal') {
          this.closeEventDetailsModal();
        } else if (modal.id === 'appointmentModal') {
          this.closeAppointmentModal();
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (eventModal.classList.contains('visible')) {
          this.closeEventDetailsModal();
        } else if (appointmentModal.classList.contains('visible')) {
          this.closeAppointmentModal();
        }
      }
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
    const monthView = document.getElementById('monthView');
    const weekView = document.getElementById('weekView');
    const dayView = document.getElementById('dayView');
    
    monthView.classList.toggle('visible', view === 'month');
    weekView.classList.toggle('visible', view === 'week');
    dayView.classList.toggle('visible', view === 'day');
    
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
    const monthGrid = document.getElementById('calendarGrid');
    if (!monthGrid) {
      console.error('Calendar grid element not found');
      return;
    }
    monthGrid.innerHTML = '';
    
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    
    // Get first day of month and adjust for Monday start
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - ((firstDay.getDay() + 6) % 7));
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      
      if (currentDate.getMonth() !== month) {
        dayElement.classList.add('other-month');
      }
      
      if (this.isToday(currentDate)) {
        dayElement.classList.add('today');
      }
      
      dayElement.innerHTML = `
        <div class="day-number">${currentDate.getDate()}</div>
        <div class="day-events"></div>
      `;
      
      // Add events for this day
      const dayEvents = this.getEventsForDate(currentDate);
      const eventsContainer = dayElement.querySelector('.day-events');
      
      dayEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = `calendar-event status-${(event.status || 'pending').toLowerCase()}`;
        eventElement.textContent = event.title || this.getServiceName(event);
        eventElement.onclick = () => this.showEventDetails(event);
        eventsContainer.appendChild(eventElement);
      });
      
      dayElement.onclick = () => this.selectDate(currentDate);
      monthGrid.appendChild(dayElement);
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
    if (!weekHeader || !weekBody) {
      console.error('Week view elements not found');
      return;
    }
    weekHeader.innerHTML = '';
    weekBody.innerHTML = '';
    
    // Get start of week (Monday)
    const startOfWeek = new Date(this.viewDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    // Create time slots
    const timeSlots = [];
    for (let hour = 8; hour < 20; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    // Create header
    weekHeader.innerHTML = '<div class="time-column">Ora</div>';
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayName = date.toLocaleDateString('ro-RO', { weekday: 'short' });
      const dayNumber = date.getDate();
      
      weekHeader.innerHTML += `
        <div class="day-column ${this.isToday(date) ? 'today' : ''}">
          <div class="day-name">${dayName}</div>
          <div class="day-number">${dayNumber}</div>
        </div>
      `;
    }
    
    // Create time rows
    timeSlots.forEach(time => {
      const row = document.createElement('div');
      row.className = 'week-row';
      row.innerHTML = `<div class="time-column">${time}</div>`;
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        
        const cell = document.createElement('div');
        cell.className = 'day-column time-slot';
        cell.onclick = () => this.selectTimeSlot(date, time);
        
        // Add events for this time slot
        const slotEvents = this.getEventsForTimeSlot(date, time);
        slotEvents.forEach(event => {
          const eventElement = document.createElement('div');
          eventElement.className = `calendar-event status-${(event.status || 'pending').toLowerCase()}`;
          eventElement.textContent = event.title || this.getServiceName(event);
          eventElement.onclick = (e) => {
            e.stopPropagation();
            this.showEventDetails(event);
          };
          cell.appendChild(eventElement);
        });
        
        row.appendChild(cell);
      }
      
      weekBody.appendChild(row);
    });
  }

  // ===== DAY VIEW =====
  
  renderDayView() {
    const dayBody = document.getElementById('dayBody');
    if (!dayBody) {
      console.error('Day view element not found');
      return;
    }
    dayBody.innerHTML = '';
    
    // Create day schedule container
    const scheduleContainer = document.createElement('div');
    scheduleContainer.className = 'day-schedule';
    
    // Get events for this day
    const dayEvents = this.getEventsForDate(this.viewDate);
    
    if (dayEvents.length === 0) {
      scheduleContainer.innerHTML = `
        <div class="no-events">
          <div class="no-events-icon">📅</div>
          <h3>Nu există programări pentru această zi</h3>
          <p>Fă click pe "Programare Nouă" pentru a adăuga o programare.</p>
          <button class="btn btn-primary" onclick="calendar.showNewAppointmentModal()">
            + Programare Nouă
          </button>
        </div>
      `;
    } else {
      // Create events list
      const eventsList = document.createElement('div');
      eventsList.className = 'day-events-list';
      
      // Sort events by time
      dayEvents.sort((a, b) => {
        const timeA = a.scheduled_time || '00:00';
        const timeB = b.scheduled_time || '00:00';
        return timeA.localeCompare(timeB);
      });
      
      dayEvents.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = `day-event-card status-${(event.status || 'pending').toLowerCase()}`;
        
        eventCard.innerHTML = `
          <div class="event-time">
            <div class="time-display">${event.scheduled_time || 'Oră nespecificată'}</div>
            <div class="status-indicator">
              <span class="status-badge status-${(event.status || 'pending').toLowerCase()}">
                ${this.getStatusLabel(event.status || 'pending')}
              </span>
            </div>
          </div>
          <div class="event-content">
            <div class="event-title">${event.title || this.getServiceName(event)}</div>
            <div class="event-details-preview">
              <div class="detail-item">
                <span class="detail-icon">👤</span>
                <span class="detail-text">${this.getCustomerName(event)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-icon">🏢</span>
                <span class="detail-text">${this.getLocationName(event)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-icon">💰</span>
                <span class="detail-text">${this.getTotalPrice(event)}</span>
              </div>
            </div>
          </div>
                     <div class="event-actions">
             <button class="btn-icon" title="Vezi detalii">
               👁️
             </button>
           </div>
        `;
        
        eventCard.addEventListener('click', () => this.showEventDetails(event));
        eventsList.appendChild(eventCard);
      });
      
      scheduleContainer.appendChild(eventsList);
    }
    
    dayBody.appendChild(scheduleContainer);
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

  getEventsForTimeSlot(date, timeSlot) {
    const events = this.getEventsForDate(date);
    const [hour, minute] = timeSlot.split(':').map(Number);
    
    return events.filter(event => {
      if (event.scheduled_time) {
        const [eventHour, eventMinute] = event.scheduled_time.split(':').map(Number);
        return eventHour === hour && Math.abs(eventMinute - minute) < 30;
      }
      return false;
    });
  }
  
  async showEventDetails(event) {
    this.selectedEvent = event;
    const modal = document.getElementById('eventModal');
    const deleteBtn = document.getElementById('deleteEventBtn');
    const editBtn = document.getElementById('editEventBtn');
    
    // Show/hide action buttons based on permissions
    const canEdit = this.canEditEvent(event);
    deleteBtn.classList.toggle('visible', canEdit);
    editBtn.classList.toggle('visible', canEdit);
    
    // Populate event details
    this.populateEventDetails(event);
    
    // Show modal
    modal.classList.add('visible');
  }
  
  closeEventDetailsModal() {
    const modal = document.getElementById('eventModal');
    modal.classList.remove('visible');
    this.selectedEvent = null;
  }
  
  async editEvent() {
    if (!this.selectedEvent) return;
    
    // Store the event being edited (don't lose reference)
    const eventToEdit = this.selectedEvent;
    
    document.getElementById('appointmentModalTitle').textContent = 'Editează Evenimentul';
    document.getElementById('appointmentTitle').value = eventToEdit.title || this.getServiceName(eventToEdit);
    
    if (eventToEdit.scheduled_date) {
      document.getElementById('appointmentDate').value = eventToEdit.scheduled_date;
    }
    
    if (eventToEdit.scheduled_time) {
      document.getElementById('appointmentTime').value = eventToEdit.scheduled_time;
    }
    
    document.getElementById('appointmentType').value = eventToEdit.customer_id ? 'meeting' : 'event';
    this.handleAppointmentTypeChange(eventToEdit.customer_id ? 'meeting' : 'event');
    
    if (eventToEdit.customer_id) {
      document.getElementById('appointmentCustomer').value = eventToEdit.customer_id;
      document.getElementById('appointmentService').value = eventToEdit.service_id;
      document.getElementById('appointmentLocation').value = eventToEdit.location_id;
    }
    
    document.getElementById('appointmentDescription').value = eventToEdit.description || eventToEdit.special_instructions || '';
    document.getElementById('appointmentDuration').value = eventToEdit.estimated_duration || 60;
    
    this.closeEventDetailsModal();
    // Keep the selected event reference for saving
    this.selectedEvent = eventToEdit;
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
        this.closeEventDetailsModal();
        
        // Add a small delay to ensure server has processed the deletion
        setTimeout(async () => {
          await this.loadInitialData();
          this.render();
        }, 500);
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
    this.resetAppointmentForm();
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
  }
  
  resetAppointmentForm() {
    document.getElementById('appointmentForm').reset();
    document.getElementById('customerGroup').classList.remove('visible');
    document.getElementById('serviceGroup').classList.remove('visible');
    document.getElementById('recurringOptions').classList.remove('visible');
    document.getElementById('appointmentRecurring').checked = false;
  }
  
  handleAppointmentTypeChange(type) {
    const customerGroup = document.getElementById('customerGroup');
    const serviceGroup = document.getElementById('serviceGroup');
    
    customerGroup.classList.toggle('visible', type === 'appointment');
    serviceGroup.classList.toggle('visible', type === 'appointment');
  }
  
  async saveAppointment() {
    const title = document.getElementById('appointmentTitle').value.trim();
    const type = document.getElementById('appointmentType').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    
    // Debug log to track edit vs create
    const isEditing = !!this.selectedEvent;
    console.log('saveAppointment called - isEditing:', isEditing, 'selectedEvent:', this.selectedEvent);
    
    if (!title) {
      this.showToast('Vă rugăm să introduceți titlul', 'error');
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
    
    try {
      this.showLoading();
      
      const formData = {
        title: title,
        type: type,
        scheduled_for: `${date}T${time}:00`,
        estimated_duration: parseInt(document.getElementById('appointmentDuration').value) || 60,
        special_instructions: document.getElementById('appointmentDescription').value,
        is_recurring: document.getElementById('appointmentRecurring').checked,
        recurring_type: document.getElementById('recurringType').value,
        recurring_end_date: document.getElementById('recurringEnd').value || null
      };
      
      // Add client-specific fields if it's a meeting
      if (type === 'meeting') {
        const customerId = document.getElementById('appointmentCustomer').value;
        const serviceId = parseInt(document.getElementById('appointmentService').value);
        const locationId = parseInt(document.getElementById('appointmentLocation').value);
        
        if (!customerId || !serviceId || !locationId) {
          this.showToast('Pentru întâlniri cu clienți, toate câmpurile sunt obligatorii', 'error');
          return;
        }
        
        // Get the selected service to extract base_price
        const selectedService = this.services.find(service => service.service_id === serviceId);
        if (!selectedService) {
          this.showToast('Serviciul selectat nu a fost găsit', 'error');
          return;
        }
        
        formData.customer_id = parseInt(customerId);
        formData.service_id = serviceId;
        formData.location_id = locationId;
        formData.unit_price = parseFloat(selectedService.base_price);
        formData.total_amount = parseFloat(selectedService.base_price);
      }
      
      // Remove empty values (but keep 0 values for price and duration)
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === null || (isNaN(formData[key]) && typeof formData[key] === 'number')) {
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
        const successMessage = isEditing ? 'Programarea a fost actualizată cu succes' : 'Programarea a fost creată cu succes';
        console.log('Success message:', successMessage);
        this.showToast(successMessage, 'success');
        this.closeAppointmentModal();
        
        // Add a small delay to ensure server has processed the operation
        setTimeout(async () => {
          await this.loadInitialData();
          this.render();
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
      'pending': '⏳ În așteptare',
      'confirmed': '✅ Confirmat',
      'in_progress': '🔄 În progres',
      'completed': '✅ Finalizat',
      'cancelled': '❌ Anulat'
    };
    return statuses[status] || `❓ ${status}`;
  }
  
  showDayEvents(date, events) {
    // Switch to day view for the selected date
    this.currentDate = new Date(date);
    this.switchView('day');
  }
  
  showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('visible');
  }
  
  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('visible');
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
  
  // Force reload data with cache clearing
  async forceReload() {
    try {
      this.showLoading();
      
      // Clear any cached data
      this.events = [];
      this.customers = [];
      this.services = [];
      this.locations = [];
      
      // Reload with fresh data
      await this.loadInitialData();
      this.render();
      
      console.log('Calendar data force reloaded');
    } catch (error) {
      console.error('Error force reloading calendar:', error);
    } finally {
      this.hideLoading();
    }
  }

  // Helper functions for data mapping
  getCustomerName(event) {
    if (event.customer_first_name && event.customer_last_name) {
      return `${event.customer_first_name} ${event.customer_last_name}`;
    } else if (event.customer_name) {
      return event.customer_name;
    } else if (event.customer_email) {
      return event.customer_email;
    }
    return event.customer_id ? `Client #${event.customer_id}` : 'Client necunoscut';
  }

  getServiceName(event) {
    return event.service_name || (event.service_id ? `Serviciu #${event.service_id}` : 'Serviciu nespecificat');
  }

  getLocationName(event) {
    return event.location_name || (event.location_id ? `Locație #${event.location_id}` : 'Locație nespecificată');
  }

  getTotalPrice(event) {
    if (event.total_amount) {
      return `${event.total_amount} RON`;
    } else if (event.base_price) {
      return `${event.base_price} RON`;
    }
    return 'Preț nespecificat';
  }

  getScheduledDateTime(event) {
    if (event.scheduled_date) {
      const date = this.formatDate(event.scheduled_date);
      const time = event.scheduled_time || '';
      return time ? `${date} ${time}` : date;
    }
    return 'Data nespecificată';
  }

  formatDateTime(date) {
    return this.formatDate(new Date(date));
  }

  selectTimeSlot(date, time) {
    this.currentDate = new Date(date);
    this.currentDate.setHours(parseInt(time.split(':')[0]));
    this.currentDate.setMinutes(parseInt(time.split(':')[1]));
    this.render();
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

  /* Day View Styles */
  .day-schedule {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
  }

  .no-events {
    text-align: center;
    padding: 80px 40px;
    color: #64748b;
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .no-events-icon {
    font-size: 5rem;
    margin-bottom: 24px;
    opacity: 0.8;
  }

  .no-events h3 {
    margin: 0 0 16px 0;
    color: #1e293b;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .no-events p {
    margin: 0 0 32px 0;
    font-size: 1.125rem;
    color: #64748b;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.6;
  }

  .day-events-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .day-event-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    border: 1px solid #f1f5f9;
    border-left: 4px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 24px;
    transition: all 0.3s ease;
    cursor: pointer;
    margin-bottom: 16px;
  }

  .day-event-card:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    transform: translateY(-3px);
    border-color: #e2e8f0;
  }

  .day-event-card.status-pending {
    border-left-color: #f59e0b;
  }

  .day-event-card.status-confirmed {
    border-left-color: #10b981;
  }

  .day-event-card.status-in_progress {
    border-left-color: #3b82f6;
  }

  .day-event-card.status-completed {
    border-left-color: #10b981;
  }

  .day-event-card.status-cancelled {
    border-left-color: #ef4444;
    opacity: 0.7;
  }

  .event-time {
    flex-shrink: 0;
    text-align: center;
    min-width: 140px;
    background: #f8fafc;
    border-radius: 10px;
    padding: 16px 12px;
    border: 1px solid #e2e8f0;
  }

  .time-display {
    font-size: 1.6rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 8px;
    letter-spacing: -0.02em;
  }

  .status-indicator .status-badge {
    font-size: 0.75rem;
    padding: 6px 10px;
    border-radius: 16px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .event-content {
    flex: 1;
    min-width: 0;
  }

  .event-title {
    font-size: 1.375rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 16px;
    line-height: 1.3;
  }

  .event-details-preview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    background: #f8fafc;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .event-details-preview .detail-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #475569;
    font-size: 0.9rem;
    font-weight: 500;
    padding: 4px 0;
  }

  .event-details-preview .detail-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .event-actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-icon {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.3rem;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
  }

  .btn-icon:hover {
    background-color: #e2e8f0;
    border-color: #cbd5e1;
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    .day-event-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 15px;
    }

    .event-time {
      width: 100%;
      text-align: left;
      min-width: auto;
    }

    .event-details-preview {
      flex-direction: column;
      gap: 8px;
    }
  }
`;

// Inject styles
if (!document.getElementById('calendar-toast-styles')) {
  const style = document.createElement('style');
  style.id = 'calendar-toast-styles';
  style.textContent = toastStyles;
  document.head.appendChild(style);
}

// Initialize calendar when DOM is loaded
let calendar;
document.addEventListener('DOMContentLoaded', () => {
  calendar = new Calendar();
});