// ==== REPORTS PAGE ====

document.addEventListener('DOMContentLoaded', async () => {
  if (!authManager.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }
  const content=document.getElementById('content');
  try{
    const resp=await authManager.apiRequest('/stats/dashboard');
    content.innerHTML=resp.success? `<pre>${JSON.stringify(resp.data, null, 2)}</pre>`:resp.error;
  }catch(e){console.error(e);content.textContent='Eroare la rapoarte';}
}); 