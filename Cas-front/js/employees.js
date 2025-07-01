// ==== EMPLOYEES MANAGEMENT PAGE ====

document.addEventListener('DOMContentLoaded', async () => {
  if (!authManager.isAuthenticated() || !['ADMIN','MANAGER'].includes(authManager.currentUser.role)) {
    window.location.href = 'dashboard.html';
    return;
  }

  const content = document.getElementById('content');
  try {
    const branchFilter = authManager.currentUser.role === 'MANAGER' ? `?branch_id=${authManager.currentUser.branchId}` : '';
    const resp = await authManager.apiRequest(`/employees${branchFilter}`);
    if (resp.success) {
      renderCrudTable(content, resp.data || [], {
        onAdd: ()=>alert('TODO: adaugă angajat'),
        onEdit: row=>alert('TODO: edit employee '+row.id),
        onDelete: row=>alert('TODO: delete employee '+row.id)
      });
    } else {
      content.textContent = resp.error || 'Eroare la încărcare';
    }
  } catch(err) {
    console.error(err);
    content.textContent = 'Eroare la încărcarea angajaților';
  }
}); 