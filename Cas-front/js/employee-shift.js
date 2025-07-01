// ==== EMPLOYEE SHIFT MANAGEMENT ====

const shiftPage = {
  currentShift: null,

  async init() {
    // redirect if not authenticated or not employee
    if (!authManager.isAuthenticated()) {
      window.location.href = 'login.html';
      return;
    }
    if (authManager.currentUser?.role !== 'EMPLOYEE') {
      window.location.href = 'dashboard.html';
      return;
    }

    this.infoEl = document.getElementById('shiftInfo');
    this.startBtn = document.getElementById('startBtn');
    this.endBtn = document.getElementById('endBtn');

    this.startBtn.onclick = () => this.startShift();
    this.endBtn.onclick = () => this.endShift();

    await this.refresh();
  },

  async refresh() {
    try {
      this.toggleLoading(true);
      const empId = authManager.currentUser.id;
      // get active shift for this employee (server route exists)
      const resp = await authManager.apiRequest(`/shifts/employee/${empId}`);
      if (resp.success) {
        const today = new Date().toISOString().slice(0,10);
        this.currentShift = (resp.data || []).find(s => s.start_ts?.startsWith(today) && !s.end_ts);
      }
      this.render();
    } catch(err) {
      console.error('shift load', err);
      this.infoEl.textContent = 'Eroare la încărcare';
    } finally {
      this.toggleLoading(false);
    }
  },

  render() {
    if (this.currentShift) {
      this.infoEl.innerHTML = `Tură activă începută la <strong>${new Date(this.currentShift.start_ts).toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})}</strong>`;
      this.startBtn.classList.add('hidden');
      this.endBtn.classList.remove('hidden');
    } else {
      this.infoEl.textContent = 'Nu ai nicio tură pornită astăzi';
      this.startBtn.classList.remove('hidden');
      this.endBtn.classList.add('hidden');
    }
  },

  async startShift() {
    try {
      this.toggleLoading(true);
      const body = { branchId: authManager.currentUser.branchId, start_ts: new Date().toISOString() };
      // Create shift row then start it
      const createRes = await authManager.apiRequest('/shifts', { method:'POST', body: JSON.stringify(body) });
      if (!createRes.success) throw new Error(createRes.error);
      const shiftId = createRes.data.id;
      const startRes = await authManager.apiRequest(`/shifts/${shiftId}/start`, { method:'PUT' });
      if (!startRes.success) throw new Error(startRes.error);
      this.currentShift = startRes.data;
      this.render();
      alert('Tură pornită');
    } catch(e) {
      alert('Eroare: '+e.message);
    } finally { this.toggleLoading(false);}  
  },

  async endShift() {
    if (!this.currentShift) return;
    if (!confirm('Sigur închizi tura?')) return;
    try {
      this.toggleLoading(true);
      const res = await authManager.apiRequest(`/shifts/${this.currentShift.id}/end`, { method:'PUT' });
      if (!res.success) throw new Error(res.error);
      this.currentShift = null;
      this.render();
      alert('Tură încheiată');
    } catch(e) {
      alert('Eroare: '+e.message);
    } finally { this.toggleLoading(false);}  
  },

  toggleLoading(state){
    document.getElementById('loadingOverlay').classList.toggle('hidden', !state);
  }
};

document.addEventListener('DOMContentLoaded', () => shiftPage.init()); 