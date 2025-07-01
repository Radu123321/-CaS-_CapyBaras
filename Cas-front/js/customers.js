// ==== CUSTOMERS PAGE ====

document.addEventListener('DOMContentLoaded', async () => {
  if (!authManager.isAuthenticated() || authManager.currentUser.role !== 'ADMIN') {
    window.location.href = 'dashboard.html';
    return;
  }
  const content = document.getElementById('content');
  try {
    const resp = await authManager.apiRequest('/customers');
    if(resp.success){
      renderCrudTable(content, resp.data||[], {
        onAdd: ()=>alert('TODO: adaugă client'),
        onEdit: r=>alert('TODO: edit customer '+r.id),
        onDelete: r=>alert('TODO: delete customer '+r.id)
      });
    } else {
      content.textContent = resp.error;
    }
  } catch(e){
    console.error(e); content.textContent='Eroare la încărcare';
  }
}); 