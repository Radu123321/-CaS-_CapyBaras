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
        this.locations = (response.data || []).map(loc=>({
          id: loc.location_id || loc.id || loc.id_branch || loc.id, // fallback
          location_id: loc.id || loc.location_id || loc.id_branch || loc.id,
          name: loc.name,
          address: loc.address,
          city: loc.city,
          phone: loc.phone,
          email: loc.email,
          created_at: loc.created_at,
          updated_at: loc.updated_at,
          is_active: loc.is_active !== false // default true if missing
        }));
        this.updateDashboardStats();
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
    
    const isAdmin = authManager.currentUser?.role === 'ADMIN';
    
    grid.innerHTML = this.locations.map(location => `
      <div class="location-card">
        <div class="location-header">
          <div class="location-icon">🏢</div>
          <div class="location-status">
            <span class="status-badge ${location.is_active ? 'status-active' : 'status-inactive'}">
              ${location.is_active ? 'Activă' : 'Inactivă'}
            </span>
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
          <button class="btn btn-sm btn-primary" onclick="locationsManager.viewLocation(${location.id})">
            Vezi Detalii
          </button>
          ${isAdmin ? `
          <button class="btn btn-sm btn-secondary" onclick="locationsManager.editLocationModal(${location.id})">
            Editează
          </button>
          <button class="btn btn-sm btn-warning" onclick="locationsManager.toggleActive(${location.id})">
            ${location.is_active ? 'Dezactivează' : 'Activează'}
          </button>
          <button class="btn btn-sm btn-danger" onclick="locationsManager.deleteLocation(${location.id})">Șterge</button>` : ''}
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
    
    this.selectedLocationId = location.location_id || location.id;
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
    this.showEditLocationModal(locationId);
  }
  
  showEditLocationModal(locationId){
    const loc = this.locations.find(l=>l.location_id===locationId);
    if(!loc)return;
    this.selectedLocationId = locationId;
    document.getElementById('editLocationName').value = loc.name;
    document.getElementById('editLocationAddress').value = loc.address;
    document.getElementById('editLocationCity').value = loc.city;
    document.getElementById('editLocationPhone').value = loc.phone||'';
    document.getElementById('editLocationEmail').value = loc.email||'';
    document.getElementById('editLocationNotes').value = loc.notes||'';
    document.getElementById('editLocationModal').style.display='flex';
  }

  closeEditLocationModal(){
    document.getElementById('editLocationModal').style.display='none';
    this.selectedLocationId=null;
  }

  async editLocation(){
    if(!this.selectedLocationId){return;}
    const locationData={
      name:document.getElementById('editLocationName').value,
      address:document.getElementById('editLocationAddress').value,
      city:document.getElementById('editLocationCity').value,
      phone:document.getElementById('editLocationPhone').value,
      email:document.getElementById('editLocationEmail').value,
      notes:document.getElementById('editLocationNotes').value
    };
    try{
      const response=await authManager.apiRequest(`/locations/${this.selectedLocationId}`,{
        method:'PUT',
        body:JSON.stringify(locationData)
      });
      if(response.success){
        this.showToast('Locația a fost actualizată', 'success');
        this.closeEditLocationModal();
        await this.loadLocations();
      }else{
        this.showToast(response.error||'Eroare la actualizare', 'error');
      }
    }catch(err){
      console.error('editLocation error',err);
      this.showToast('Eroare la actualizare', 'error');
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

  updateDashboardStats() {
    const total = this.locations.length;
    const active = this.locations.filter(l=>l.is_active).length;
    document.getElementById('totalLocations').textContent = `${active}/${total}`;
  }

  async toggleActive(locationId){
    try{
      const loc = this.locations.find(l=>l.location_id===locationId);
      if(!loc){return;}
      const newStatus = !loc.is_active;
      const response = await authManager.apiRequest(`/locations/${locationId}`,{
        method:'PUT',
        body: JSON.stringify({
          is_active: newStatus
        })
      });
      if(response.success){
        this.showToast(`Locația a fost ${newStatus?'activată':'dezactivată'}`, 'success');
        await this.loadLocations();
        this.updateDashboardStats();
      }else{
        this.showToast(response.error||'Eroare la actualizare status', 'error');
      }
    }catch(err){
      console.error('toggleActive error',err);
      this.showToast('Eroare la actualizare status', 'error');
    }
  }

  async deleteLocation(locationId){
    if(!confirm('Ești sigur că vrei să ștergi locația?')) return;
    try{
      const response = await authManager.apiRequest(`/locations/${locationId}`,{method:'DELETE'});
      if(response.success){
        const msg = response.message || 'Locația a fost ștearsă';
        this.showToast(msg, 'success');
        await this.loadLocations();
        this.updateDashboardStats();
      }else{
        this.showToast(response.error||'Eroare la ștergere', 'error');
      }
    }catch(err){
      console.error('deleteLocation error',err);
      this.showToast('Eroare la ștergere', 'error');
    }
  }
}

// Global functions for HTML onclick handlers
async function refreshLocations() {
  await locationsManager.loadLocations();
  locationsManager.updateDashboardStats();
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