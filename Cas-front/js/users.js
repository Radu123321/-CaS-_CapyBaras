// ==== USERS MANAGEMENT PAGE ====

async function loadUsers(){
  const content=document.getElementById('content');
  const resp=await authManager.apiRequest('/users');
  if(resp.success){
    renderCrudTable(content, resp.data||[], {
      onAdd: createUser,
      onEdit: editUser,
      onDelete: deleteUser
    });
  } else content.textContent=resp.error||'Eroare';
}

async function createUser(){
  const email=prompt('Email utilizator');
  if(!email) return;
  const role=prompt('Rol (ADMIN,MANAGER,EMPLOYEE,CUSTOMER)','EMPLOYEE');
  const branchId=prompt('Filiala ID (opțional)','');
  const first=prompt('Prenume','');
  const last=prompt('Nume','');
  const phone=prompt('Telefon','');
  const pwd=prompt('Parolă temporară','changeme');
  try{
    const resp=await authManager.apiRequest('/users',{method:'POST',body:JSON.stringify({email,role,branch_id:branchId||null,first_name:first,last_name:last,phone,password:pwd})});
    if(!resp.success) return alert(resp.error||'Eroare');
    loadUsers();
  }catch(e){console.error(e);alert('Eroare');}
}

async function editUser(row){
  const first=prompt('Prenume',row.first_name||'');
  const last=prompt('Nume',row.last_name||'');
  const phone=prompt('Telefon',row.phone||'');
  try{
    const resp=await authManager.apiRequest(`/users/${row.id}`,{method:'PUT',body:JSON.stringify({first_name:first,last_name:last,phone})});
    if(!resp.success) return alert(resp.error||'Eroare');
    loadUsers();
  }catch(e){console.error(e);alert('Eroare');}
}

async function deleteUser(row){
  if(!confirm('Confirmă ștergerea utilizatorului?')) return;
  try{
    const resp=await authManager.apiRequest(`/users/${row.id}`,{method:'DELETE'});
    if(!resp.success) return alert(resp.error||'Eroare');
    loadUsers();
  }catch(e){console.error(e);alert('Eroare');}
}

document.addEventListener('DOMContentLoaded',async()=>{
  if(!authManager.isAuthenticated()||authManager.currentUser.role!=='ADMIN'){
    window.location.href='dashboard.html';return;
  }
  await loadUsers();
}); 