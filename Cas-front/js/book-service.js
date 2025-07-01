// ===== BOOKING WIZARD =====

class BookingWizard {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.selectedService = null;
    this.selectedDate = null;
    this.selectedTime = null;
    this.selectedLocation = null;
    this.services = [];
    this.locations = [];
    this.availableSlots = [];
    
    this.init();
  }

  // ===== INITIALIZATION =====
  
  async init() {
    try {
      this.showLoading();
      
      // Load initial data
      await this.loadServices();
      await this.loadLocations();
      
      // Setup date input
      this.setupDateInput();
      
      // Generate time slots
      this.generateTimeSlots();
      
      this.hideLoading();
    } catch (error) {
      console.error('Booking wizard initialization error:', error);
      this.showToast('Eroare la încărcarea datelor', 'error');
      this.hideLoading();
    }
  }
  
  async loadServices() {
    try {
      const response = await authManager.apiRequest('/services');
      
      if (response.success) {
        this.services = response.data || [];
        this.renderServices();
      } else {
        throw new Error('Nu s-au putut încărca serviciile');
      }
    } catch (error) {
      console.error('Error loading services:', error);
      this.showToast('Eroare la încărcarea serviciilor', 'error');
    }
  }
  
  async loadLocations() {
    try {
      const response = await authManager.apiRequest('/locations');
      
      if (response.success) {
        this.locations = (response.data || []).filter(l=>l.is_active!==false);
        this.renderLocations();
      } else {
        throw new Error('Nu s-au putut încărca locațiile');
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      this.showToast('Eroare la încărcarea locațiilor', 'error');
    }
  }

  // ===== RENDERING =====
  
  renderServices() {
    const grid = document.getElementById('serviceGrid');
    
    if (this.services.length === 0) {
      grid.innerHTML = '<p>Nu există servicii disponibile în momentul acesta.</p>';
      return;
    }
    
    grid.innerHTML = this.services.map(service => this.createServiceCard(service)).join('');
  }
  
  createServiceCard(service) {
    const serviceIcons = {
      'CARPET': '🧹',
      'CAR_WASH': '🚗',
      'GARMENT': '👔',
      'OTHER': '🧽'
    };
    
    const icon = serviceIcons[service.service_type] || '🧽';
    const sid = service.service_id ?? service.id;
    return `
      <div class="service-card" onclick="bookingWizard.selectService(${sid})" data-service-id="${sid}">
        <div class="service-icon">${icon}</div>
        <h3 class="service-name">${service.description || service.name}</h3>
        <p class="service-description">${this.getServiceTypeLabel(service.service_type)}</p>
        <p class="service-price">${service.base_price} RON</p>
      </div>
    `;
  }
  
  renderLocations() {
    const grid = document.getElementById('locationGrid');
    
    if (this.locations.length === 0) {
      grid.innerHTML = '<p>Nu există locații disponibile în momentul acesta.</p>';
      return;
    }
    
    grid.innerHTML = this.locations.map(location => this.createLocationCard(location)).join('');
  }
  
  createLocationCard(location) {
    const locId = location.location_id ?? location.id ?? location.branch_id;
    return `
      <div class="location-card" onclick="bookingWizard.selectLocation(${locId})" data-location-id="${locId}">
        <h3 class="location-name">${location.name}</h3>
        <p class="location-address">${location.address || location.city || ''}</p>
        <p class="location-distance">📍 Disponibil</p>
      </div>
    `;
  }
  
  setupDateInput() {
    const dateInput = document.getElementById('selectedDate');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Set minimum date to tomorrow
    dateInput.min = tomorrow.toISOString().split('T')[0];
    
    // Set maximum date to 3 months from now
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 3);
    dateInput.max = maxDate.toISOString().split('T')[0];
    
    // Listen for date changes
    dateInput.addEventListener('change', () => {
      this.selectedDate = dateInput.value;
      this.updateTimeSlots();
    });
  }
  
  generateTimeSlots() {
    const slotsContainer = document.getElementById('timeSlots');
    const timeSlots = [];
    
    // Generate slots from 8 AM to 6 PM
    for (let hour = 8; hour < 18; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    slotsContainer.innerHTML = timeSlots.map(time => `
      <div class="time-slot" onclick="bookingWizard.selectTime('${time}')" data-time="${time}">
        ${time}
      </div>
    `).join('');
  }
  
  async updateTimeSlots() {
    if (!this.selectedDate) return;
    
    try {
      // Get unavailable slots for the selected date
      const response = await authManager.apiRequest(`/orders/availability?date=${this.selectedDate}`);
      
      const unavailableSlots = response.success ? response.data.unavailable || [] : [];
      
      // Update time slot availability
      document.querySelectorAll('.time-slot').forEach(slot => {
        const time = slot.dataset.time;
        const isUnavailable = unavailableSlots.includes(time);
        
        slot.classList.toggle('unavailable', isUnavailable);
        slot.onclick = isUnavailable ? null : () => this.selectTime(time);
      });
      
    } catch (error) {
      console.error('Error updating time slots:', error);
    }
  }

  // ===== SELECTION METHODS =====
  
  selectService(serviceId) {
    this.selectedService = this.services.find(s => (s.service_id ?? s.id) == serviceId);
    
    // Update UI
    document.querySelectorAll('.service-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.serviceId == serviceId);
    });
    
    this.updateNavigationButtons();
  }
  
  selectTime(time) {
    // Check if slot is available
    const slot = document.querySelector(`[data-time="${time}"]`);
    if (slot && slot.classList.contains('unavailable')) {
      return;
    }
    
    this.selectedTime = time;
    
    // Update UI
    document.querySelectorAll('.time-slot').forEach(slot => {
      slot.classList.toggle('selected', slot.dataset.time === time);
    });
    
    this.updateNavigationButtons();
  }
  
  selectLocation(locationId) {
    this.selectedLocation = this.locations.find(l => (l.location_id ?? l.id ?? l.branch_id) == locationId);
    
    // Update UI
    document.querySelectorAll('.location-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.locationId == locationId);
    });
    
    this.updateNavigationButtons();
  }

  // ===== NAVIGATION =====
  
  nextStep() {
    if (!this.canProceedToNextStep()) {
      this.showValidationMessage();
      return;
    }
    
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateStepDisplay();
      
      if (this.currentStep === 4) {
        this.updateSummary();
      }
    }
  }
  
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepDisplay();
    }
  }
  
  canProceedToNextStep() {
    switch (this.currentStep) {
      case 1:
        return this.selectedService !== null;
      case 2:
        return this.selectedDate !== null && this.selectedTime !== null;
      case 3:
        return this.selectedLocation !== null;
      default:
        return true;
    }
  }
  
  showValidationMessage() {
    switch (this.currentStep) {
      case 1:
        this.showToast('Te rugăm să selectezi un serviciu', 'warning');
        break;
      case 2:
        if (!this.selectedDate) {
          this.showToast('Te rugăm să selectezi o dată', 'warning');
        } else if (!this.selectedTime) {
          this.showToast('Te rugăm să selectezi o oră', 'warning');
        }
        break;
      case 3:
        this.showToast('Te rugăm să selectezi o locație', 'warning');
        break;
    }
  }
  
  updateStepDisplay() {
    // Update step indicators
    for (let i = 1; i <= this.totalSteps; i++) {
      const step = document.getElementById(`step${i}`);
      const section = document.getElementById(`section${i}`);
      
      step.classList.toggle('active', i === this.currentStep);
      step.classList.toggle('completed', i < this.currentStep);
      section.classList.toggle('hidden', i !== this.currentStep);
    }
    
    // Update navigation buttons
    this.updateNavigationButtons();
  }
  
  updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    
    prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
    nextBtn.style.display = this.currentStep < this.totalSteps ? 'block' : 'none';
    confirmBtn.style.display = this.currentStep === this.totalSteps ? 'block' : 'none';
    
    // Enable/disable next button based on selection
    if (nextBtn.style.display !== 'none') {
      nextBtn.disabled = !this.canProceedToNextStep();
    }
  }
  
  updateSummary() {
    document.getElementById('summaryService').textContent = this.selectedService ? this.selectedService.description : '-';
    document.getElementById('summaryDate').textContent = this.selectedDate ? this.formatDate(this.selectedDate) : '-';
    document.getElementById('summaryTime').textContent = this.selectedTime || '-';
    document.getElementById('summaryLocation').textContent = this.selectedLocation ? this.selectedLocation.name : '-';
    document.getElementById('summaryPrice').textContent = this.selectedService ? `${this.selectedService.base_price} RON` : '-';
  }

  // ===== BOOKING CONFIRMATION =====
  
  async confirmBooking() {
    try {
      this.showLoading();
      
      // Validate required data
      if (!this.selectedService || !this.selectedDate || !this.selectedTime || !this.selectedLocation) {
        throw new Error('Date incomplete pentru programare');
      }
      
      // Get additional info
      const phone = document.getElementById('customerPhone').value;
      const specialRequests = document.getElementById('specialRequests').value;
      
      // Prepare booking data
      const locId = this.selectedLocation.branch_id ?? this.selectedLocation.location_id ?? this.selectedLocation.id;
      const svcId = this.selectedService.service_id ?? this.selectedService.id;
      const userId = authManager?.currentUser?.user_id ?? authManager?.currentUser?.id ?? null;
      const confirmBtn = document.getElementById('confirmBtn');
      if (confirmBtn) confirmBtn.disabled = true;

      const bookingData = {
        // snake_case fields – required by OrderController validation
        customer_id: userId,
        branch_id: locId,
        location_id: locId,
        service_id: svcId,
        unit_price: this.selectedService.base_price,
        quantity: 1,
        scheduled_for: `${this.selectedDate} ${this.selectedTime}`, // combine date & time for backend
        notes: specialRequests || `Programare pentru ${this.selectedService.description}`,
        customer_phone: phone || null,

        // camelCase duplicates – required deeper in OrderService / OrderRepository
        customerId: userId,
        branchId: locId,
        serviceId: svcId,
        unitPrice: this.selectedService.base_price,
        scheduledFor: `${this.selectedDate} ${this.selectedTime}`
      };
      
      // Submit booking
      const response = await authManager.apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
      
      if (response.success) {
        const bookingId = (response.data && (response.data.order_id || response.data.id)) || response.data;
        this.showSuccessMessage(bookingId ?? 'N/A');
        this.showToast('Programare creată cu succes', 'success');
      } else {
        throw new Error(response.message || 'Eroare la crearea programării');
      }
      
    } catch (error) {
      console.error('Error confirming booking:', error);
      this.showToast(error.message || 'Eroare la confirmarea programării', 'error');
    } finally {
      if (confirmBtn) confirmBtn.disabled = false;
      this.hideLoading();
    }
  }
  
  showSuccessMessage(orderId) {
    // Hide booking form
    document.querySelector('.booking-form').style.display = 'none';
    
    // Update booking ID
    document.getElementById('bookingIdDisplay').textContent = `ID Programare: #${orderId}`;
    
    // Show success message
    document.getElementById('successMessage').style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ===== UTILITY METHODS =====
  
  getServiceTypeLabel(type) {
    const types = {
      'CARPET': 'Curățenie Covoare',
      'CAR_WASH': 'Spălătorie Auto',
      'GARMENT': 'Curățenie Haine',
      'OTHER': 'Alte Servicii'
    };
    return types[type] || 'Serviciu';
  }
  
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
const bookingToastStyles = `
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
  }
  
  .toast {
    background: white;
    border-radius: 8px;
    padding: 15px 20px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    animation: slideInRight 0.3s ease;
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
    color: #374151;
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
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// Inject styles
if (!document.getElementById('booking-toast-styles')) {
  const style = document.createElement('style');
  style.id = 'booking-toast-styles';
  style.textContent = bookingToastStyles;
  document.head.appendChild(style);
} 