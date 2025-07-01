// ==== CUSTOMERS PAGE ====

async function loadCustomers(){
  const content=document.getElementById('content');
  const resp=await authManager.apiRequest('/customers');
  if(resp.success){
    renderCrudTable(content, resp.data||[], {
      onAdd: createCustomer,
      onEdit: editCustomer,
      onDelete: deleteCustomer
    });
  } else content.textContent=resp.error||'Eroare';
}

async function createCustomer(){
  const email=prompt('Email client'); if(!email) return;
  const first=prompt('Prenume',''); const last=prompt('Nume',''); const phone=prompt('Telefon','');
  const pwd=prompt('Parolă','cust123');
  try{
    const resp=await authManager.apiRequest('/customers',{method:'POST',body:JSON.stringify({email,first_name:first,last_name:last,phone,password:pwd})});
    if(!resp.success) return alert(resp.error||'Eroare');
    loadCustomers();
  }catch(e){console.error(e);alert('Eroare');}
}

async function editCustomer(row){
  const phone=prompt('Telefon',row.phone||'');
  try{
    const resp=await authManager.apiRequest(`/customers/${row.id}`,{method:'PUT',body:JSON.stringify({phone})});
    if(!resp.success) return alert(resp.error||'Eroare');
    loadCustomers();
  }catch(e){console.error(e);alert('Eroare');}
}

async function deleteCustomer(row){
  if(!confirm('Confirmă ștergerea clientului?')) return;
  try{
    const resp=await authManager.apiRequest(`/customers/${row.id}`,{method:'DELETE'});
    if(!resp.success) return alert(resp.error||'Eroare');
    loadCustomers();
  }catch(e){console.error(e);alert('Eroare');}
}

document.addEventListener('DOMContentLoaded',async()=>{
  if (!authManager.isAuthenticated() || authManager.currentUser.role !== 'ADMIN') {
    window.location.href = 'dashboard.html';
    return;
  }
  await loadCustomers();
}); 