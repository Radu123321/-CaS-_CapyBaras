// ===== EQUIPMENT PAGE FUNCTIONALITY =====

class EquipmentManager {
  constructor() {
    this.equipment = [];
    this.filteredEquipment = [];
    this.locations = [];
    this.selectedEquipmentId = null;
    
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
      
      // Show equipment content
      this.showEquipment();
      
    } catch (error) {
      console.error('Equipment page initialization error:', error);
      this.showError('Nu s-a putut încărca pagina de echipamente. Vă rugăm să reîncărcați pagina.');
    }
  }

  // ===== LOADING AND ERROR STATES =====
  
  showLoading() {
    document.getElementById('loadingState').style.display = 'flex';
    document.getElementById('equipmentContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
  }
  
  showEquipment() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('equipmentContent').style.display = 'block';
    document.getElementById('errorState').style.display = 'none';
  }
  
  showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('equipmentContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'flex';
    document.getElementById('errorMessage').textContent = message;
  }

  // ===== DATA LOADING =====
  
  async loadInitialData() {
    // Load all required data in parallel
    await Promise.all([
      this.loadEquipment(),
      this.loadLocations()
    ]);
    
    // Populate filter dropdowns
    this.populateFilters();
    
    // Update dashboard stats
    this.updateDashboardStats();
    
    // Display equipment
    this.displayEquipment();
  }
  
  async loadEquipment() {
    try {
      const response = await authManager.apiRequest('/equipment');
      
      if (response.success) {
        this.equipment = response.data || [];
        this.filteredEquipment = [...this.equipment];
      } else {
        throw new Error(response.error || 'Failed to load equipment');
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
      this.equipment = [];
      this.filteredEquipment = [];
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

  // ===== DISPLAY METHODS =====
  
  populateFilters() {
    // Populate location filter
    const locationFilter = document.getElementById('locationFilter');
    locationFilter.innerHTML = '<option value="">Toate locațiile</option>';
    this.locations.forEach(location => {
      locationFilter.innerHTML += `<option value="${location.location_id}">${location.name}</option>`;
    });
    
    // Populate add equipment modal location dropdown
    const equipmentLocationSelect = document.getElementById('equipmentLocationId');
    equipmentLocationSelect.innerHTML = '<option value="">Selectează locația</option>';
    this.locations.forEach(location => {
      equipmentLocationSelect.innerHTML += `<option value="${location.location_id}">${location.name}</option>`;
    });
  }
  
  updateDashboardStats() {
    const total = this.equipment.length;
    const operative = this.equipment.filter(eq => eq.status === 'OPERATIVE').length;
    const maintenance = this.equipment.filter(eq => eq.status === 'MAINTENANCE').length;
    const outOfService = this.equipment.filter(eq => eq.status === 'OUT_OF_SERVICE').length;
    
    document.getElementById('totalEquipment').textContent = total;
    document.getElementById('operativeEquipment').textContent = operative;
    document.getElementById('maintenanceEquipment').textContent = maintenance;
    document.getElementById('outOfServiceEquipment').textContent = outOfService;
  }
  
  displayEquipment() {
    const grid = document.getElementById('equipmentGrid');
    
    if (this.filteredEquipment.length === 0) {
      grid.innerHTML = '<div class="no-data">Nu au fost găsite echipamente</div>';
      return;
    }
    
    grid.innerHTML = this.filteredEquipment.map(equipment => `
      <div class="equipment-card" data-status="${equipment.status.toLowerCase()}">
        <div class="equipment-header">
          <div class="equipment-icon">${this.getEquipmentIcon(equipment.type)}</div>
          <div class="equipment-status">
            <span class="status-badge status-${equipment.status.toLowerCase()}">${this.getStatusLabel(equipment.status)}</span>
          </div>
        </div>
        <div class="equipment-info">
          <h3 class="equipment-name">${equipment.name}</h3>
          <p class="equipment-type">${this.getTypeLabel(equipment.type)}</p>
          <p class="equipment-location">${this.getLocationName(equipment.location_id)}</p>
        </div>
        <div class="equipment-details">
          <div class="detail-item">
            <span class="detail-label">Model:</span>
            <span class="detail-value">${equipment.model || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Ultima mentenanță:</span>
            <span class="detail-value">${this.getLastMaintenanceText(equipment)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Utilizare:</span>
            <span class="detail-value">${equipment.usage_hours || 0}h</span>
          </div>
        </div>
        <div class="equipment-actions">
          <button class="btn btn-sm btn-primary" onclick="equipmentManager.viewEquipment(${equipment.equipment_id})">
            Vezi Detalii
          </button>
          <button class="btn btn-sm btn-secondary" onclick="equipmentManager.scheduleMaintenanceForEquipment(${equipment.equipment_id})">
            Mentenanță
          </button>
          ${equipment.status === 'OPERATIVE' ? 
            `<button class="btn btn-sm btn-warning" onclick="equipmentManager.markAsOutOfService(${equipment.equipment_id})">
              Marchează Defect
            </button>` : 
            equipment.status === 'OUT_OF_SERVICE' ?
            `<button class="btn btn-sm btn-success" onclick="equipmentManager.markAsOperative(${equipment.equipment_id})">
              Marchează Operațional
            </button>` : ''
          }
        </div>
      </div>
    `).join('');
  }

  // ===== HELPER METHODS =====
  
  getEquipmentIcon(type) {
    const icons = {
      'WASHING_MACHINE': '🌊',
      'DRYER': '🔥',
      'IRON': '👔',
      'VACUUM': '🌪️',
      'OTHER': '⚙️'
    };
    return icons[type] || '⚙️';
  }
  
  getTypeLabel(type) {
    const labels = {
      'WASHING_MACHINE': 'Mașină de spălat',
      'DRYER': 'Uscător',
      'IRON': 'Fier de călcat',
      'VACUUM': 'Aspirator',
      'OTHER': 'Altele'
    };
    return labels[type] || type;
  }
  
  getStatusLabel(status) {
    const labels = {
      'OPERATIVE': 'Operațional',
      'MAINTENANCE': 'În mentenanță',
      'OUT_OF_SERVICE': 'Defect'
    };
    return labels[status] || status;
  }
  
  getLocationName(locationId) {
    const location = this.locations.find(l => l.location_id === locationId);
    return location ? location.name : `Locație #${locationId}`;
  }
  
  getLastMaintenanceText(equipment) {
    if (!equipment.last_maintenance) {
      return 'Niciodată';
    }
    
    const lastMaintenance = new Date(equipment.last_maintenance);
    const now = new Date();
    const daysDiff = Math.floor((now - lastMaintenance) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 'Astăzi';
    if (daysDiff === 1) return 'Ieri';
    if (daysDiff < 30) return `Acum ${daysDiff} zile`;
    if (daysDiff < 365) return `Acum ${Math.floor(daysDiff / 30)} luni`;
    return `Acum ${Math.floor(daysDiff / 365)} ani`;
  }
  
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO') + ' ' + date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  }

  // ===== FILTERING =====
  
  applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const locationFilter = document.getElementById('locationFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const maintenanceFilter = document.getElementById('maintenanceFilter').value;
    
    this.filteredEquipment = this.equipment.filter(equipment => {
      // Status filter
      if (statusFilter && equipment.status !== statusFilter) return false;
      
      // Location filter
      if (locationFilter && equipment.location_id !== parseInt(locationFilter)) return false;
      
      // Type filter
      if (typeFilter && equipment.type !== typeFilter) return false;
      
      // Maintenance filter
      if (maintenanceFilter) {
        const lastMaintenance = equipment.last_maintenance ? new Date(equipment.last_maintenance) : null;
        const now = new Date();
        
        switch (maintenanceFilter) {
          case 'overdue':
            if (!lastMaintenance || (now - lastMaintenance) < (90 * 24 * 60 * 60 * 1000)) return false;
            break;
          case 'due_soon':
            if (!lastMaintenance || (now - lastMaintenance) < (60 * 24 * 60 * 60 * 1000) || (now - lastMaintenance) > (90 * 24 * 60 * 60 * 1000)) return false;
            break;
          case 'recent':
            if (!lastMaintenance || (now - lastMaintenance) > (30 * 24 * 60 * 60 * 1000)) return false;
            break;
        }
      }
      
      return true;
    });
    
    this.displayEquipment();
  }

  // ===== EQUIPMENT ACTIONS =====
  
  async viewEquipment(equipmentId) {
    try {
      const response = await authManager.apiRequest(`/equipment/${equipmentId}`);
      
      if (response.success) {
        this.showEquipmentDetails(response.data);
      } else {
        this.showToast('Eroare la încărcarea detaliilor echipamentului', 'error');
      }
    } catch (error) {
      console.error('Error viewing equipment:', error);
      this.showToast('Eroare la încărcarea detaliilor echipamentului', 'error');
    }
  }
  
  showEquipmentDetails(equipment) {
    const modal = document.getElementById('equipmentDetailsModal');
    const title = document.getElementById('equipmentDetailsTitle');
    const content = document.getElementById('equipmentDetailsContent');
    
    this.selectedEquipmentId = equipment.equipment_id;
    title.textContent = `${equipment.name}`;
    
    content.innerHTML = `
      <div class="equipment-details-full">
        <div class="details-grid">
          <div class="detail-item">
            <label>Nume:</label>
            <span>${equipment.name}</span>
          </div>
          <div class="detail-item">
            <label>Tip:</label>
            <span>${this.getTypeLabel(equipment.type)}</span>
          </div>
          <div class="detail-item">
            <label>Status:</label>
            <span class="status-badge status-${equipment.status.toLowerCase()}">${this.getStatusLabel(equipment.status)}</span>
          </div>
          <div class="detail-item">
            <label>Locație:</label>
            <span>${this.getLocationName(equipment.location_id)}</span>
          </div>
          <div class="detail-item">
            <label>Producător:</label>
            <span>${equipment.manufacturer || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <label>Model:</label>
            <span>${equipment.model || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <label>Număr de serie:</label>
            <span>${equipment.serial_number || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <label>Data achiziției:</label>
            <span>${equipment.purchase_date ? this.formatDate(equipment.purchase_date) : 'N/A'}</span>
          </div>
          <div class="detail-item">
            <label>Garanție până la:</label>
            <span>${equipment.warranty_expiry ? this.formatDate(equipment.warranty_expiry) : 'N/A'}</span>
          </div>
          <div class="detail-item">
            <label>Ore de utilizare:</label>
            <span>${equipment.usage_hours || 0}h</span>
          </div>
          <div class="detail-item">
            <label>Ultima mentenanță:</label>
            <span>${equipment.last_maintenance ? this.formatDate(equipment.last_maintenance) : 'Niciodată'}</span>
          </div>
          <div class="detail-item">
            <label>Ultima actualizare:</label>
            <span>${this.formatDate(equipment.updated_at)}</span>
          </div>
          ${equipment.notes ? `
          <div class="detail-item full-width">
            <label>Observații:</label>
            <span>${equipment.notes}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
  }

  // ===== MAINTENANCE MANAGEMENT =====
  
  scheduleMaintenanceForEquipment(equipmentId) {
    this.selectedEquipmentId = equipmentId;
    this.showScheduleMaintenanceModal();
  }
  
  showScheduleMaintenanceModal() {
    document.getElementById('scheduleMaintenanceModal').style.display = 'flex';
  }
  
  closeScheduleMaintenanceModal() {
    document.getElementById('scheduleMaintenanceModal').style.display = 'none';
    document.getElementById('scheduleMaintenanceForm').reset();
  }
  
  async scheduleMaintenance() {
    if (!this.selectedEquipmentId) {
      this.showToast('Nu a fost selectat niciun echipament', 'error');
      return;
    }
    
    const form = document.getElementById('scheduleMaintenanceForm');
    const formData = new FormData(form);
    
    const maintenanceData = {
      equipment_id: this.selectedEquipmentId,
      maintenance_type: document.getElementById('maintenanceType').value,
      scheduled_date: document.getElementById('scheduledDate').value,
      notes: document.getElementById('maintenanceNotes').value,
      estimated_duration: document.getElementById('estimatedDuration').value
    };
    
    try {
      const response = await authManager.apiRequest(`/equipment/${this.selectedEquipmentId}/maintenance`, {
        method: 'POST',
        body: JSON.stringify(maintenanceData)
      });
      
      if (response.success) {
        this.showToast('Mentenanța a fost programată cu succes', 'success');
        this.closeScheduleMaintenanceModal();
        await this.loadEquipment();
        this.displayEquipment();
      } else {
        this.showToast(response.error || 'Eroare la programarea mentenanței', 'error');
      }
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      this.showToast('Eroare la programarea mentenanței', 'error');
    }
  }

  // ===== STATUS MANAGEMENT =====
  
  async markAsOutOfService(equipmentId) {
    await this.updateEquipmentStatus(equipmentId, 'OUT_OF_SERVICE');
  }
  
  async markAsOperative(equipmentId) {
    await this.updateEquipmentStatus(equipmentId, 'OPERATIVE');
  }
  
  async updateEquipmentStatus(equipmentId, status) {
    try {
      const response = await authManager.apiRequest(`/equipment/${equipmentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      
      if (response.success) {
        this.showToast(`Status echipament actualizat la ${this.getStatusLabel(status)}`, 'success');
        await this.loadEquipment();
        this.updateDashboardStats();
        this.displayEquipment();
      } else {
        this.showToast(response.error || 'Eroare la actualizarea statusului', 'error');
      }
    } catch (error) {
      console.error('Error updating equipment status:', error);
      this.showToast('Eroare la actualizarea statusului', 'error');
    }
  }

  // ===== EQUIPMENT MANAGEMENT =====
  
  showAddEquipmentModal() {
    document.getElementById('addEquipmentModal').style.display = 'flex';
  }
  
  closeAddEquipmentModal() {
    document.getElementById('addEquipmentModal').style.display = 'none';
    document.getElementById('addEquipmentForm').reset();
  }
  
  async addEquipment() {
    const form = document.getElementById('addEquipmentForm');
    
    const equipmentData = {
      name: document.getElementById('equipmentName').value,
      type: document.getElementById('equipmentType').value,
      location_id: parseInt(document.getElementById('equipmentLocationId').value),
      manufacturer: document.getElementById('manufacturer').value,
      model: document.getElementById('model').value,
      serial_number: document.getElementById('serialNumber').value,
      purchase_date: document.getElementById('purchaseDate').value,
      warranty_expiry: document.getElementById('warrantyExpiry').value,
      notes: document.getElementById('equipmentNotes').value
    };
    
    try {
      const response = await authManager.apiRequest('/equipment', {
        method: 'POST',
        body: JSON.stringify(equipmentData)
      });
      
      if (response.success) {
        this.showToast('Echipamentul a fost adăugat cu succes', 'success');
        this.closeAddEquipmentModal();
        await this.loadEquipment();
        this.updateDashboardStats();
        this.displayEquipment();
      } else {
        this.showToast(response.error || 'Eroare la adăugarea echipamentului', 'error');
      }
    } catch (error) {
      console.error('Error adding equipment:', error);
      this.showToast('Eroare la adăugarea echipamentului', 'error');
    }
  }

  // ===== MODAL MANAGEMENT =====
  
  closeEquipmentDetailsModal() {
    document.getElementById('equipmentDetailsModal').style.display = 'none';
    this.selectedEquipmentId = null;
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
async function refreshEquipment() {
  await equipmentManager.loadEquipment();
  equipmentManager.updateDashboardStats();
  equipmentManager.applyFilters();
  equipmentManager.showToast('Echipamentele au fost reîmprospătate', 'success');
}

async function checkAllEquipmentStatus() {
  try {
    const response = await authManager.apiRequest('/equipment/check-status', {
      method: 'POST'
    });
    
    if (response.success) {
      equipmentManager.showToast('Verificarea statusului a fost completă', 'success');
      await equipmentManager.loadEquipment();
      equipmentManager.updateDashboardStats();
      equipmentManager.displayEquipment();
    } else {
      equipmentManager.showToast('Eroare la verificarea statusului', 'error');
    }
  } catch (error) {
    console.error('Error checking equipment status:', error);
    equipmentManager.showToast('Eroare la verificarea statusului', 'error');
  }
}

function showAddEquipmentModal() {
  equipmentManager.showAddEquipmentModal();
}

function closeAddEquipmentModal() {
  equipmentManager.closeAddEquipmentModal();
}

function closeEquipmentDetailsModal() {
  equipmentManager.closeEquipmentDetailsModal();
}

function closeScheduleMaintenanceModal() {
  equipmentManager.closeScheduleMaintenanceModal();
}

function showScheduleMaintenanceModal() {
  equipmentManager.showScheduleMaintenanceModal();
}

function applyFilters() {
  equipmentManager.applyFilters();
}

async function addEquipment() {
  await equipmentManager.addEquipment();
}

async function scheduleMaintenance() {
  await equipmentManager.scheduleMaintenance();
}

// Initialize equipment manager when page loads
let equipmentManager;
document.addEventListener('DOMContentLoaded', () => {
  equipmentManager = new EquipmentManager();
}); 