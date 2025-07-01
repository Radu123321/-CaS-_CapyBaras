// ==== EMPLOYEES MANAGEMENT PAGE ====

async function loadEmployees(){
  const content=document.getElementById('content');
  const branchFilter = authManager.currentUser.role === 'MANAGER' ? `?branch_id=${authManager.currentUser.branchId}` : '';
  const resp = await authManager.apiRequest(`/employees${branchFilter}`);
  if(resp.success){
    renderCrudTable(content, resp.data||[], {
      onAdd: createEmployee,
      onEdit: editEmployee,
      onDelete: deleteEmployee
    });
  } else content.textContent = resp.error||'Eroare';
}

async function createEmployee(){
  const email=prompt('Email angajat'); if(!email) return;
  const branchId=prompt('Filiala ID', authManager.currentUser.branchId||'1');
  const first=prompt('Prenume',''); const last=prompt('Nume',''); const phone=prompt('Telefon','');
  const pwd=prompt('Parolă inițială','emp123');
  const role='EMPLOYEE';
  try{
    const resp=await authManager.apiRequest('/employees',{method:'POST',body:JSON.stringify({email,branch_id:branchId,first_name:first,last_name:last,phone,password:pwd})});
    if(!resp.success) return alert(resp.error||'Eroare');
    loadEmployees();
  }catch(e){console.error(e);alert('Eroare');}
}

async function editEmployee(row){
  const phone=prompt('Telefon',row.phone||'');
  const staff_role=prompt('Rol staff (WASHER/DRIVER)',row.staff_role||'');
  const hourly_rate=prompt('Tarif orar',row.hourly_rate||'');
  try{
    const resp=await authManager.apiRequest(`/employees/${row.id}`,{method:'PUT',body:JSON.stringify({phone,staff_role,hourly_rate})});
    if(!resp.success) return alert(resp.error||'Eroare');
    loadEmployees();
  }catch(e){console.error(e);alert('Eroare');}
}

async function deleteEmployee(row){
  if(!confirm('Confirmă ștergerea?')) return;
  try{
    const resp=await authManager.apiRequest(`/employees/${row.id}`,{method:'DELETE'});
    if(!resp.success) return alert(resp.error||'Eroare');
    loadEmployees();
  }catch(e){console.error(e);alert('Eroare');}
}

document.addEventListener('DOMContentLoaded',async()=>{
  if (!authManager.isAuthenticated() || !['ADMIN','MANAGER'].includes(authManager.currentUser.role)) {
    window.location.href = 'dashboard.html';
    return;
  }
  await loadEmployees();
}); 