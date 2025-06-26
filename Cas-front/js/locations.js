// ===== LOCATIONS PAGE FUNCTIONALITY =====

class LocationsManager {
  constructor() {
    this.locations = [];
    this.selectedLocationId = null;
    
    this.init();
    this.setupEventListeners();
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
      
      // Load locations
      await this.loadLocations();
      
      // Show locations content
      this.showLocations();
      
    } catch (error) {
      console.error('Locations page initialization error:', error);
      this.showError('Nu s-a putut încărca pagina de locații. Vă rugăm să reîncărcați pagina.');
    }
  }

  setupEventListeners() {
    // Header buttons
    document.getElementById('addLocationBtn').addEventListener('click', () => this.showAddLocationModal());
    document.getElementById('refreshBtn').addEventListener('click', () => this.refreshLocations());
    document.getElementById('reloadBtn').addEventListener('click', () => location.reload());

    // Add location modal
    document.getElementById('closeAddModalBtn').addEventListener('click', () => this.closeAddLocationModal());
    document.getElementById('cancelAddBtn').addEventListener('click', () => this.closeAddLocationModal());
    document.getElementById('submitAddBtn').addEventListener('click', () => this.addLocation());

    // Location details modal
    document.getElementById('closeDetailsBtn').addEventListener('click', () => this.closeLocationDetailsModal());
    document.getElementById('closeDetailsFooterBtn').addEventListener('click', () => this.closeLocationDetailsModal());
    document.getElementById('editLocationBtn').addEventListener('click', () => this.editLocation());
  }

  // ===== LOADING AND ERROR STATES =====
  
  showLoading() {
    document.getElementById('loadingState').classList.add('visible');
    document.getElementById('locationsContent').classList.remove('visible');
    document.getElementById('errorState').classList.remove('visible');
  }
  
  showLocations() {
    document.getElementById('loadingState').classList.remove('visible');
    document.getElementById('locationsContent').classList.add('visible');
    document.getElementById('errorState').classList.remove('visible');
  }
  
  showError(message) {
    document.getElementById('loadingState').classList.remove('visible');
    document.getElementById('locationsContent').classList.remove('visible');
    document.getElementById('errorState').classList.add('visible');
    document.getElementById('errorMessage').textContent = message;
  }

  // ===== MODAL MANAGEMENT =====

  showAddLocationModal() {
    const modal = document.getElementById('addLocationModal');
    modal.classList.add('visible');
  }

  closeAddLocationModal() {
    const modal = document.getElementById('addLocationModal');
    modal.classList.remove('visible');
    document.getElementById('addLocationForm').reset();
  }

  showLocationDetailsModal() {
    const modal = document.getElementById('locationDetailsModal');
    modal.classList.add('visible');
  }

  closeLocationDetailsModal() {
    const modal = document.getElementById('locationDetailsModal');
    modal.classList.remove('visible');
    this.selectedLocationId = null;
  }

  // ===== DATA LOADING =====
  
  async loadLocations() {
    try {
      const response = await authManager.apiRequest('/locations');
      
      if (response.success) {
        this.locations = response.data || [];
        this.displayLocations();
      } else {
        throw new Error(response.error || 'Failed to load locations');
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      this.locations = [];
      this.displayLocations();
    }
  }

  // ===== DISPLAY METHODS =====
  
  displayLocations() {
    const grid = document.getElementById('locationsGrid');
    
    if (this.locations.length === 0) {
      grid.innerHTML = '<div class="no-data">Nu au fost găsite locații</div>';
      return;
    }
    
    grid.innerHTML = this.locations.map(location => `
      <div class="location-card">
        <div class="location-header">
          <div class="location-icon">🏢</div>
          <div class="location-status">
            <span class="status-badge status-active">Activă</span>
          </div>
        </div>
        <div class="location-info">
          <h3 class="location-name">${location.name}</h3>
          <p class="location-address">${location.address}</p>
          <p class="location-city">${location.city}</p>
        </div>
        <div class="location-details">
          ${location.phone ? `
          <div class="detail-item">
            <span class="detail-label">📞</span>
            <span class="detail-value">${location.phone}</span>
          </div>
          ` : ''}
          ${location.email ? `
          <div class="detail-item">
            <span class="detail-label">📧</span>
            <span class="detail-value">${location.email}</span>
          </div>
          ` : ''}
          <div class="detail-item">
            <span class="detail-label">📅</span>
            <span class="detail-value">Adăugată ${this.formatDate(location.created_at)}</span>
          </div>
        </div>
        <div class="location-actions">
          <button class="btn btn-sm btn-primary" data-location-id="${location.location_id}" data-action="view">
            Vezi Detalii
          </button>
          <button class="btn btn-sm btn-secondary" data-location-id="${location.location_id}" data-action="edit">
            Editează
          </button>
        </div>
      </div>
    `).join('');

    // Add event listeners for location actions
    grid.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        const locationId = parseInt(e.target.dataset.locationId);
        const action = e.target.dataset.action;
        
        if (action === 'view') {
          this.viewLocation(locationId);
        } else if (action === 'edit') {
          this.editLocationModal(locationId);
        }
      });
    });
  }

  // ===== HELPER METHODS =====
  
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO');
  }

  // ===== LOCATION ACTIONS =====
  
  async viewLocation(locationId) {
    try {
      const response = await authManager.apiRequest(`/locations/${locationId}`);
      
      if (response.success) {
        this.showLocationDetails(response.data);
      } else {
        this.showToast('Eroare la încărcarea detaliilor locației', 'error');
      }
    } catch (error) {
      console.error('Error viewing location:', error);
      this.showToast('Eroare la încărcarea detaliilor locației', 'error');
    }
  }
  
  showLocationDetails(location) {
    const modal = document.getElementById('locationDetailsModal');
    const title = document.getElementById('locationDetailsTitle');
    const content = document.getElementById('locationDetailsContent');
    
    this.selectedLocationId = location.location_id;
    title.textContent = location.name;
    
    content.innerHTML = `
      <div class="location-details-full">
        <div class="details-grid">
          <div class="detail-item">
            <label>Nume:</label>
            <span>${location.name}</span>
          </div>
          <div class="detail-item">
            <label>Adresă:</label>
            <span>${location.address}</span>
          </div>
          <div class="detail-item">
            <label>Oraș:</label>
            <span>${location.city}</span>
          </div>
          <div class="detail-item">
            <label>Telefon:</label>
            <span>${location.phone || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <label>Email:</label>
            <span>${location.email || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <label>Data creării:</label>
            <span>${this.formatDate(location.created_at)}</span>
          </div>
          <div class="detail-item">
            <label>Ultima actualizare:</label>
            <span>${this.formatDate(location.updated_at)}</span>
          </div>
          ${location.notes ? `
          <div class="detail-item full-width">
            <label>Observații:</label>
            <span>${location.notes}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `;
    
    this.showLocationDetailsModal();
  }

  // ===== LOCATION CRUD OPERATIONS =====

  async addLocation() {
    const form = document.getElementById('addLocationForm');
    const formData = new FormData(form);
    const locationData = Object.fromEntries(formData);

    try {
      const response = await authManager.apiRequest('/locations', {
        method: 'POST',
        body: JSON.stringify(locationData)
      });

      if (response.success) {
        this.showToast('Locația a fost adăugată cu succes', 'success');
        this.closeAddLocationModal();
        await this.loadLocations();
      } else {
        this.showToast(response.error || 'Eroare la adăugarea locației', 'error');
      }
    } catch (error) {
      console.error('Error adding location:', error);
      this.showToast('Eroare la adăugarea locației', 'error');
    }
  }

  async editLocationModal(locationId) {
    try {
      const response = await authManager.apiRequest(`/locations/${locationId}`);
      
      if (response.success) {
        // Populate edit form
        const location = response.data;
        this.selectedLocationId = locationId;
        
        // Show edit modal
        this.showLocationDetailsModal();
      } else {
        this.showToast('Eroare la încărcarea detaliilor locației', 'error');
      }
    } catch (error) {
      console.error('Error loading location details:', error);
      this.showToast('Eroare la încărcarea detaliilor locației', 'error');
    }
  }

  async editLocation() {
    if (!this.selectedLocationId) {
      this.showToast('Nu a fost selectată nicio locație', 'error');
      return;
    }

    const form = document.getElementById('editLocationForm');
    const formData = new FormData(form);
    const locationData = Object.fromEntries(formData);

    try {
      const response = await authManager.apiRequest(`/locations/${this.selectedLocationId}`, {
        method: 'PUT',
        body: JSON.stringify(locationData)
      });

      if (response.success) {
        this.showToast('Locația a fost actualizată cu succes', 'success');
        this.closeLocationDetailsModal();
        await this.loadLocations();
      } else {
        this.showToast(response.error || 'Eroare la actualizarea locației', 'error');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      this.showToast('Eroare la actualizarea locației', 'error');
    }
  }

  async refreshLocations() {
    try {
      await this.loadLocations();
      this.showToast('Lista de locații a fost actualizată', 'success');
    } catch (error) {
      console.error('Error refreshing locations:', error);
      this.showToast('Eroare la reîmprospătarea listei de locații', 'error');
    }
  }

  // ===== TOAST NOTIFICATIONS =====

  showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, duration);
  }
}

// Global functions for HTML onclick handlers
async function refreshLocations() {
  await locationsManager.loadLocations();
  locationsManager.showToast('Locațiile au fost reîmprospătate', 'success');
}

function showAddLocationModal() {
  locationsManager.showAddLocationModal();
}

function closeAddLocationModal() {
  locationsManager.closeAddLocationModal();
}

function closeLocationDetailsModal() {
  locationsManager.closeLocationDetailsModal();
}

async function addLocation() {
  await locationsManager.addLocation();
}

function editLocation() {
  locationsManager.editLocation();
}

// Initialize locations manager when page loads
let locationsManager;
document.addEventListener('DOMContentLoaded', () => {
  locationsManager = new LocationsManager();
}); 