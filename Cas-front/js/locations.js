// ===== LOCATIONS PAGE FUNCTIONALITY =====

class LocationsManager {
  constructor() {
    this.locations = [];
    this.selectedLocationId = null;
    
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
      
      // Load locations
      await this.loadLocations();
      
      // Show locations content
      this.showLocations();
      
    } catch (error) {
      console.error('Locations page initialization error:', error);
      this.showError('Nu s-a putut încărca pagina de locații. Vă rugăm să reîncărcați pagina.');
    }
  }

  // ===== LOADING AND ERROR STATES =====
  
  showLoading() {
    document.getElementById('loadingState').style.display = 'flex';
    document.getElementById('locationsContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
  }
  
  showLocations() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('locationsContent').style.display = 'block';
    document.getElementById('errorState').style.display = 'none';
  }
  
  showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('locationsContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'flex';
    document.getElementById('errorMessage').textContent = message;
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
          <button class="btn btn-sm btn-primary" onclick="locationsManager.viewLocation(${location.location_id})">
            Vezi Detalii
          </button>
          <button class="btn btn-sm btn-secondary" onclick="locationsManager.editLocationModal(${location.location_id})">
            Editează
          </button>
        </div>
      </div>
    `).join('');
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
    
    modal.style.display = 'flex';
  }

  // ===== LOCATION MANAGEMENT =====
  
  showAddLocationModal() {
    document.getElementById('addLocationModal').style.display = 'flex';
  }
  
  closeAddLocationModal() {
    document.getElementById('addLocationModal').style.display = 'none';
    document.getElementById('addLocationForm').reset();
  }
  
  async addLocation() {
    const locationData = {
      name: document.getElementById('locationName').value,
      address: document.getElementById('locationAddress').value,
      city: document.getElementById('locationCity').value,
      phone: document.getElementById('locationPhone').value,
      email: document.getElementById('locationEmail').value,
      notes: document.getElementById('locationNotes').value
    };
    
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

  // ===== MODAL MANAGEMENT =====
  
  closeLocationDetailsModal() {
    document.getElementById('locationDetailsModal').style.display = 'none';
    this.selectedLocationId = null;
  }
  
  editLocationModal(locationId) {
    this.showToast('Funcționalitatea de editare va fi implementată', 'info');
  }
  
  editLocation() {
    this.showToast('Funcționalitatea de editare va fi implementată', 'info');
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