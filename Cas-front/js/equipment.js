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
        // Normalize records from API for easier use in UI
        this.equipment = (response.data || []).map(row => ({
          id: row.id,
          name: row.name,
          status: row.status,
          type: row.type_code,
          branch_id: row.branch_id,
          branch_name: row.branch_name,
          model: row.model,
          usage_hours: (row.usage_counter !== null && row.usage_counter !== undefined) ? Number(row.usage_counter) : 0,
          usage_unit: row.usage_unit_code || 'h',
          last_maintenance: row.last_completed_maintenance,
          next_maintenance: row.next_scheduled_maintenance,
          notes: row.notes,
          updated_at: row.updated_at
        }));
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
    // Populate location filter (branches)
    const locationFilter = document.getElementById('locationFilter');
    locationFilter.innerHTML = '<option value="">Toate locațiile</option>';
    this.locations.forEach(location => {
      locationFilter.innerHTML += `<option value="${location.id}">${location.name}</option>`;
    });
    
    // Populate add equipment modal location dropdown
    const equipmentLocationSelect = document.getElementById('equipmentLocationId');
    if (equipmentLocationSelect) {
      equipmentLocationSelect.innerHTML = '<option value="">Selectează locația</option>';
      this.locations.forEach(location => {
        equipmentLocationSelect.innerHTML += `<option value="${location.id}">${location.name}</option>`;
      });
    }
  }
  
  updateDashboardStats() {
    const total = this.equipment.length;
    const operative = this.equipment.filter(eq => eq.status === 'OPERATIONAL').length;
    const maintenance = this.equipment.filter(eq => eq.status === 'MAINTENANCE').length;
    const broken = this.equipment.filter(eq => eq.status === 'BROKEN').length;
    
    document.getElementById('totalEquipment').textContent = total;
    document.getElementById('operativeEquipment').textContent = operative;
    document.getElementById('maintenanceEquipment').textContent = maintenance;
    document.getElementById('outOfServiceEquipment').textContent = broken;
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
          <p class="equipment-location">${this.getLocationName(equipment.branch_id)}</p>
        </div>
        <div class="equipment-details">
          ${equipment.model ? `
          <div class="detail-item">
            <span class="detail-label">Model:</span>
            <span class="detail-value">${equipment.model}</span>
          </div>` : ''}
          <div class="detail-item">
            <span class="detail-label">Ultima mentenanță:</span>
            <span class="detail-value">${this.getLastMaintenanceText(equipment)}</span>
          </div>
          ${equipment.usage_hours > 0 ? `
          <div class="detail-item">
            <span class="detail-label">Utilizare:</span>
            <span class="detail-value">${this.formatUsage(equipment.usage_hours, equipment.usage_unit)}</span>
          </div>` : ''}
        </div>
        <div class="equipment-actions">
          <button class="btn btn-sm btn-primary" onclick="equipmentManager.viewEquipment(${equipment.id})">
            Vezi Detalii
          </button>
          <button class="btn btn-sm btn-secondary" onclick="equipmentManager.scheduleMaintenanceForEquipment(${equipment.id})">
            Mentenanță
          </button>
          <button class="btn btn-sm btn-warning" onclick="equipmentManager.showStatusModal(${equipment.id})">Status</button>
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
      'PRESSURE': 'Aparat presiune',
      'OTHER': 'Altele'
    };
    return labels[type] || type;
  }
  
  getStatusOptions() {
    return {
      'OPERATIONAL': 'Operațional',
      'MAINTENANCE': 'În mentenanță',
      'BROKEN': 'Defect',
      'RETIRED': 'Retras'
    };
  }
  
  getStatusLabel(status) {
    const STATUS_LABELS = this.getStatusOptions();
    return STATUS_LABELS[status] || status;
  }
  
  getLocationName(branchId) {
    const location = this.locations.find(l => l.id === branchId || l.location_id === branchId);
    return location ? location.name : `Locație #${branchId}`;
  }
  
  getLastMaintenanceText(equipment) {
    // If echipament este în mentenanță acum și nu există mentenanță finalizată
    if (!equipment.last_maintenance && equipment.status === 'MAINTENANCE') {
      return 'În curs';
    }

    if (equipment.last_maintenance) {
      const lastMaintenance = new Date(equipment.last_maintenance);
      const now = new Date();
      const daysDiff = Math.floor((now - lastMaintenance) / (1000 * 60 * 60 * 24));
      if (daysDiff === 0) return 'Astăzi';
      if (daysDiff === 1) return 'Ieri';
      if (daysDiff < 30) return `Acum ${daysDiff} zile`;
      if (daysDiff < 365) return `Acum ${Math.floor(daysDiff / 30)} luni`;
      return `Acum ${Math.floor(daysDiff / 365)} ani`;
    }
    if (equipment.next_maintenance) {
      const nextM = new Date(equipment.next_maintenance);
      return `Programată ${nextM.toLocaleDateString('ro-RO')} ${nextM.toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})}`;
    }
    return 'Niciodată';
  }
  
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO') + ' ' + date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  }

  // Format usage hours with 2 decimals and unit (defaults to h)
  formatUsage(value, unit = 'h') {
    const num = parseFloat(value);
    if (!isFinite(num)) return `0${unit}`;
    return `${num.toFixed(2)}${unit}`;
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
      
      // Location filter (branch)
      if (locationFilter && equipment.branch_id !== parseInt(locationFilter)) return false;
      
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
        // Normalize backend record same as list
        const data = response.data;
        const equipment = {
          id: data.id,
          name: data.name,
          status: data.status,
          type: data.type_code,
          branch_id: data.branch_id,
          branch_name: data.branch_name,
          model: data.model,
          usage_hours: (data.usage_counter !== null && data.usage_counter !== undefined) ? Number(data.usage_counter) : 0,
          usage_unit: data.usage_unit_code || 'h',
          last_maintenance: data.last_completed_maintenance,
          next_maintenance: data.next_scheduled_maintenance,
          manufacturer: data.manufacturer,
          serial_number: data.serial_no,
          purchase_date: data.purchase_date,
          warranty_expiry: data.warranty_until,
          updated_at: data.updated_at,
          notes: data.notes
        };
        this.showEquipmentDetails(equipment);
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
    
    this.selectedEquipmentId = equipment.id;
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
            <span>${this.getLocationName(equipment.branch_id)}</span>
          </div>
          <div class="detail-item">
            <label>Producător:</label>
            <span>${equipment.manufacturer || 'N/A'}</span>
          </div>
          ${equipment.model ? `
          <div class="detail-item">
            <label>Model:</label>
            <span>${equipment.model}</span>
          </div>` : ''}
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
          ${equipment.usage_hours > 0 ? `
          <div class="detail-item">
            <label>Ore de utilizare:</label>
            <span>${this.formatUsage(equipment.usage_hours, equipment.usage_unit)}</span>
          </div>` : ''}
          <div class="detail-item">
            <label>Ultima mentenanță:</label>
            <span>${equipment.last_maintenance ? this.formatDate(equipment.last_maintenance) : 'Niciodată'}</span>
          </div>
          ${equipment.next_maintenance ? `
          <div class="detail-item">
            <label>Mentenanță programată:</label>
            <span>${this.formatDate(equipment.next_maintenance)}</span>
          </div>` : ''}
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
    modal.classList.add('visible');
  }

  // ===== MAINTENANCE MANAGEMENT =====
  
  scheduleMaintenanceForEquipment(equipmentId) {
    this.selectedEquipmentId = equipmentId;
    this.showScheduleMaintenanceModal();
  }
  
  showScheduleMaintenanceModal() {
    const modal = document.getElementById('scheduleMaintenanceModal');
    modal.style.display = 'flex';
    modal.classList.add('visible');
    
    // Set default date to today
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDateTime = tomorrow.toISOString().slice(0, 16);
    document.getElementById('scheduledDate').value = defaultDateTime;
  }
  
  closeScheduleMaintenanceModal() {
    const modal = document.getElementById('scheduleMaintenanceModal');
    modal.style.display = 'none';
    modal.classList.remove('visible');
    document.getElementById('scheduleMaintenanceForm').reset();
  }
  
  async scheduleMaintenance() {
    if (!this.selectedEquipmentId) {
      this.showToast('Nu a fost selectat niciun echipament', 'error');
      return;
    }
    
    const form = document.getElementById('scheduleMaintenanceForm');
    
    // Validate required fields
    const maintenanceType = document.getElementById('maintenanceType').value;
    const scheduledDate = document.getElementById('scheduledDate').value;
    
    if (!maintenanceType) {
      this.showToast('Vă rugăm să selectați tipul de mentenanță', 'error');
      return;
    }
    
    if (!scheduledDate) {
      this.showToast('Vă rugăm să selectați data programată', 'error');
      return;
    }
    
    const maintenanceData = {
      started_at: scheduledDate,
      description: document.getElementById('maintenanceNotes').value,
      unplanned: maintenanceType === 'EMERGENCY'
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
  
  showStatusModal(equipmentId) {
    const eq = this.equipment.find(e => e.id === equipmentId);
    if (!eq) return;
    const statusOptions = this.getStatusOptions();
    const modal = `
      <div id="eqStatusModal" class="modal-overlay">
        <div class="modal-content modal-small">
          <div class="modal-header">
            <h3>Schimbă status – ${eq.name}</h3>
            <button class="modal-close" onclick="document.getElementById('eqStatusModal').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Status nou</label>
              <select id="eqNewStatus" class="form-control">
                ${Object.keys(statusOptions).map(s => `<option value="${s}" ${s === eq.status ? 'selected' : ''}>${statusOptions[s]}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Notițe</label>
              <textarea id="eqNotes" class="form-control" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('eqStatusModal').remove()">Anulează</button>
            <button class="btn btn-primary" onclick="equipmentManager.confirmStatusChange(${equipmentId})">Actualizează</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
    setTimeout(() => document.getElementById('eqStatusModal').classList.add('visible'), 10);
  }
  
  async confirmStatusChange(id) {
    const newStatus = document.getElementById('eqNewStatus').value;
    await this.updateEquipmentStatus(id, newStatus);
    document.getElementById('eqStatusModal')?.remove();
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
    const modal = document.getElementById('addEquipmentModal');
    modal.style.display = 'flex';
    modal.classList.add('visible');
  }
  
  closeAddEquipmentModal() {
    const modal = document.getElementById('addEquipmentModal');
    modal.style.display = 'none';
    modal.classList.remove('visible');
    document.getElementById('addEquipmentForm').reset();
  }
  
  async addEquipment() {
    const form = document.getElementById('addEquipmentForm');
    
    // Validate required fields
    const name = document.getElementById('equipmentName').value.trim();
    const type = document.getElementById('equipmentType').value;
    const locationId = document.getElementById('equipmentLocationId').value;
    
    if (!name) {
      this.showToast('Vă rugăm să introduceți numele echipamentului', 'error');
      return;
    }
    
    if (!type) {
      this.showToast('Vă rugăm să selectați tipul echipamentului', 'error');
      return;
    }
    
    if (!locationId) {
      this.showToast('Vă rugăm să selectați locația', 'error');
      return;
    }
    
    const equipmentData = {
      name: name,
      type: type,
      branch_id: parseInt(locationId),
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
    const modal = document.getElementById('equipmentDetailsModal');
    modal.style.display = 'none';
    modal.classList.remove('visible');
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