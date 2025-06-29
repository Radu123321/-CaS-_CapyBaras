document.getElementById('retryBtn').addEventListener('click', attemptReconnect);

async function attemptReconnect(){
  const apiBase = 'http://localhost:8000';
  try{
    const resp = await fetch(apiBase + '/health',{method:'GET',mode:'cors'});
    if(resp.ok){
      const last = sessionStorage.getItem('cas_last_page') || 'index.html';
      window.location.href = last;
      return;
    }
  }catch(e){
    // still offline
  }
  alert('Server încă indisponibil. Încearcă din nou.');
} 