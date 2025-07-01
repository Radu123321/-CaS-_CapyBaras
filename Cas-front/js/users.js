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

// ==== MODAL HELPERS ====

function buildUserModal(mode='create', row={}){
  const idSuffix = mode==='create' ? 'create' : `edit-${row.id}`;
  const modalId = `userModal-${idSuffix}`;
  // Prevent duplicates
  if(document.getElementById(modalId)) return modalId;

  const isCreate = mode==='create';

  // inject extra CSS once
  if(!document.getElementById('userModalExtraCss')){
    const style=document.createElement('style');
    style.id='userModalExtraCss';
    style.textContent=`
      .user-modal .form-group{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
      .user-modal .form-control{width:100%;}
    `;
    document.head.appendChild(style);
  }

  const html = `
  <div id="${modalId}" class="modal-overlay">
    <div class="modal-content modal-small user-modal">
      <div class="modal-header">
        <h3>${isCreate? 'Adaugă Utilizator' : 'Editează Utilizator'}</h3>
        <button class="modal-close" onclick="closeUserModal('${modalId}')">&times;</button>
      </div>
      <div class="modal-body">
        ${isCreate? '<div class="form-group"><label class="form-label">Email</label><input type="email" id="uEmail" class="form-control" placeholder="utilizator@example.com" required></div>' : ''}
        ${isCreate? '<div class="form-group"><label class="form-label">Rol</label><select id="uRole" class="form-control"><option value="EMPLOYEE">EMPLOYEE</option><option value="MANAGER">MANAGER</option><option value="ADMIN">ADMIN</option><option value="CUSTOMER">CUSTOMER</option></select></div>' : ''}
        ${isCreate? '<div class="form-group"><label class="form-label">Filiala ID (opțional)</label><input type="number" id="uBranch" class="form-control" placeholder="1"></div>' : ''}
        <div class="form-group"><label class="form-label">Prenume</label><input type="text" id="uFirst" class="form-control" value="${row.first_name||''}" required></div>
        <div class="form-group"><label class="form-label">Nume</label><input type="text" id="uLast" class="form-control" value="${row.last_name||''}" required></div>
        <div class="form-group"><label class="form-label">Telefon</label><input type="text" id="uPhone" class="form-control" value="${row.phone||''}" ></div>
        ${isCreate? '<div class="form-group"><label class="form-label">Parolă temporară</label><input type="text" id="uPwd" class="form-control" value="changeme"></div>' : ''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeUserModal('${modalId}')">Anulează</button>
        <button class="btn btn-primary" onclick="submitUserModal('${modalId}','${mode}', ${row.id||null})">${isCreate?'Creează':'Salvează'}</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  return modalId;
}

function closeUserModal(id){
  const m=document.getElementById(id); if(m) m.remove();
}

async function submitUserModal(modalId, mode, userId){
  const getVal=id=>document.querySelector(`#${modalId} #${id}`)?.value.trim();
  const payload = {
    first_name: getVal('uFirst'),
    last_name: getVal('uLast'),
    phone: getVal('uPhone')
  };
  if(mode==='create'){
    payload.email = getVal('uEmail');
    payload.role = getVal('uRole')||'EMPLOYEE';
    const br=getVal('uBranch');
    if(br) payload.branch_id=parseInt(br);
    payload.password = getVal('uPwd')||'changeme';
  }

  // Basic validation
  if(!payload.first_name||!payload.last_name){alert('Completează prenume și nume');return;}

  try{
    const url = mode==='create'? '/users' : `/users/${userId}`;
    const method = mode==='create'? 'POST' : 'PUT';
    const resp = await authManager.apiRequest(url,{method,body:JSON.stringify(payload)});
    if(!resp.success){ alert(resp.error||'Eroare'); return; }
    closeUserModal(modalId);
    loadUsers();
  }catch(e){ console.error(e); alert('Eroare'); }
}

async function createUser(){
  const id=buildUserModal('create');
  // show by removing hidden default (modal overlay flex). CSS takes care.
  document.getElementById(id).style.display='flex';
  setTimeout(()=>document.getElementById(id)?.classList.add('visible'),10);
}

async function editUser(row){
  const id=buildUserModal('edit',row);
  document.getElementById(id).style.display='flex';
  setTimeout(()=>document.getElementById(id)?.classList.add('visible'),10);
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