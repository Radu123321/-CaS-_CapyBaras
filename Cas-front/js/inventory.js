// ==== INVENTORY PAGE ====

document.addEventListener('DOMContentLoaded', async () => {
  if (!authManager.isAuthenticated() || !['ADMIN','MANAGER'].includes(authManager.currentUser.role)) {
    window.location.href = 'dashboard.html';
    return;
  }
  const content=document.getElementById('content');
  try{
    const resp=await authManager.apiRequest('/inventory');
    if(resp.success){
      renderCrudTable(content, resp.data.rows || resp.data || [], {
        onAdd: ()=>alert('TODO: adaugă stoc'),
        onEdit: r=>alert('TODO: edit stock '+r.id),
        onDelete: r=>alert('TODO: delete stock '+r.id)
      });
    } else {
      content.textContent = resp.error;
    }
  }catch(e){console.error(e);content.textContent='Eroare la inventar';}
}); 