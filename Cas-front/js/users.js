// ==== USERS MANAGEMENT PAGE ====

document.addEventListener('DOMContentLoaded', async () => {
  if (!authManager.isAuthenticated() || authManager.currentUser.role !== 'ADMIN') {
    window.location.href = 'dashboard.html';
    return;
  }

  const content = document.getElementById('content');

  try {
    const resp = await authManager.apiRequest('/users');
    if (resp.success) {
      renderCrudTable(content, resp.data || [], {
        onAdd: ()=>alert('TODO: creare utilizator'),
        onEdit: (row)=>alert('TODO: edit user '+row.id),
        onDelete: (row)=>alert('TODO: delete user '+row.id)
      });
    } else {
      content.textContent = resp.error || 'Eroare la încărcare';
    }
  } catch (e) {
    console.error(e);
    content.textContent = 'Eroare la încărcarea utilizatorilor';
  }
}); 