// ==== SYSTEM SETTINGS PAGE ====

document.addEventListener('DOMContentLoaded', () => {
  if (!authManager.isAuthenticated() || authManager.currentUser.role !== 'ADMIN') {
    window.location.href = 'dashboard.html';
    return;
  }
  const content=document.getElementById('content');
  content.innerHTML='Pagina de setări va fi implementată.';
}); 