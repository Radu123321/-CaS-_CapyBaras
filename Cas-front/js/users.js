// ==== USERS MANAGEMENT PAGE ====

// Legacy CRUD-table loader (unused after redesign) – kept for reference
async function legacyLoadUsers(){
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
        ${isCreate? (()=>{
          const opts = branchesData.map(b=>{
            const id=b.id||b.location_id; const n=b.name||b.location_name||('Filiala #'+id);
            return `<option value="${id}">${n}</option>`;}).join('');
          return `<div class=\"form-group\"><label class=\"form-label\">Filială</label><select id=\"uBranchSel\" class=\"form-control\"><option value=\"\">(fără)</option>${opts}</select></div>`;
        })() : ''}
        <div class="form-group"><label class="form-label">Prenume</label><input type="text" id="uFirst" class="form-control" placeholder="Prenume" value="${row.first_name||''}" required></div>
        <div class="form-group"><label class="form-label">Nume</label><input type="text" id="uLast" class="form-control" placeholder="Nume" value="${row.last_name||''}" required></div>
        <div class="form-group"><label class="form-label">Telefon</label><input type="text" id="uPhone" class="form-control" placeholder="07xx xxx xxx" value="${row.phone||''}" ></div>
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
    const br=getVal('uBranchSel');
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

// ==== NEW USERS PAGE LOGIC (dashboard-style) ====

let usersData=[];
let branchesData=[];
let filteredUsers=[];

function injectRoleBadgesCss(){
  if(document.getElementById('userRoleBadgesCss')) return;
  const style=document.createElement('style');
  style.id='userRoleBadgesCss';
  style.textContent=`
    .status-admin{background:#2563eb;color:#fff;padding:2px 6px;border-radius:12px;font-size:12px;}
    .status-manager{background:#10b981;color:#fff;padding:2px 6px;border-radius:12px;font-size:12px;}
    .status-employee{background:#f59e0b;color:#fff;padding:2px 6px;border-radius:12px;font-size:12px;}
    .status-customer{background:#6b7280;color:#fff;padding:2px 6px;border-radius:12px;font-size:12px;}
  `;
  document.head.appendChild(style);
}

function showLoading(){
  document.getElementById('loadingState').style.display='flex';
  document.getElementById('usersContent').classList.remove('visible');
  document.getElementById('errorState').classList.add('hidden');
}

function showContent(){
  document.getElementById('loadingState').style.display='none';
  document.getElementById('usersContent').classList.add('visible');
}

function showError(msg){
  document.getElementById('loadingState').style.display='none';
  document.getElementById('usersContent').classList.remove('visible');
  document.getElementById('errorState').classList.remove('hidden');
  document.getElementById('errorMessage').textContent=msg||'Eroare';
}

async function loadBranches(){
  try{
    const resp=await authManager.apiRequest('/locations');
    branchesData=resp.success? (resp.data||[]) : [];
    populateBranchFilter();
  }catch(e){console.error(e);branchesData=[];}
}

function populateBranchFilter(){
  const sel=document.getElementById('branchFilter');
  if(!sel) return;
  sel.innerHTML='<option value="">Toate filialele</option>';
  branchesData.forEach(b=>{
    const id=b.id||b.location_id;
    const name=b.name||b.location_name||('Filiala #'+id);
    sel.innerHTML+=`<option value="${id}">${name}</option>`;
  });
}

async function loadUsers(){
  showLoading();
  try{
    const resp=await authManager.apiRequest('/users');
    if(!resp.success) throw new Error(resp.error||'Eroare');
    usersData=resp.data||[];
    applyUsersFilters();
    showContent();
  }catch(e){
    console.error(e);
    showError(e.message||'Eroare');
  }
}

function getBranchName(id){
  const b=branchesData.find(x=>(x.id||x.location_id)==id);
  return b? (b.name||b.location_name||('Filiala #'+id)) : '';
}

function updateStats(){
  const c={ADMIN:0,MANAGER:0,EMPLOYEE:0,CUSTOMER:0};
  usersData.forEach(u=>{if(c[u.role]!=null) c[u.role]++;});
  document.getElementById('adminsCount').textContent=c.ADMIN;
  document.getElementById('managersCount').textContent=c.MANAGER;
  document.getElementById('employeesCount').textContent=c.EMPLOYEE;
  document.getElementById('customersCount').textContent=c.CUSTOMER;
}

function applyUsersFilters(){
  const role=document.getElementById('roleFilter').value;
  const br=document.getElementById('branchFilter').value;
  const q=document.getElementById('searchInput').value.trim().toLowerCase();
  filteredUsers=usersData.filter(u=>{
    if(role && u.role!==role) return false;
    if(br && String(u.branch_id||'')!==br) return false;
    if(q){
      const name=((u.first_name||'')+' '+(u.last_name||'')).toLowerCase();
      if(!(u.email.toLowerCase().includes(q) || name.includes(q))) return false;
    }
    return true;
  });
  renderUsersTable();
  document.getElementById('usersCount').textContent=`${filteredUsers.length} utilizatori`;
  updateStats();
}

function renderUsersTable(){
  const tbody=document.getElementById('usersTableBody');
  if(!tbody) return;
  if(filteredUsers.length===0){
    tbody.innerHTML='<tr><td colspan="8" class="no-data">Niciun utilizator găsit</td></tr>';
    return;
  }
  tbody.innerHTML=filteredUsers.map(u=>{
    const name=`${u.first_name||''} ${u.last_name||''}`.trim();
    const roleBadge=`<span class="status-badge status-${u.role.toLowerCase()}">${u.role}</span>`;
    const branch=getBranchName(u.branch_id);
    const created=(u.created_at||'').split('T')[0];
    return `<tr>
      <td>${u.id}</td>
      <td>${u.email}</td>
      <td>${name}</td>
      <td>${roleBadge}</td>
      <td>${branch||'-'}</td>
      <td>${u.phone||''}</td>
      <td>${created}</td>
      <td class="actions-cell">
         <button class="btn-sm btn-secondary" onclick="editUser({id:${u.id},first_name:'${(u.first_name||'').replace(/'/g,"\'")}',last_name:'${(u.last_name||'').replace(/'/g,"\'")}',phone:'${(u.phone||'').replace(/'/g,"\'")}'})">Edit</button>
         <button class="btn-sm btn-danger" onclick="deleteUser({id:${u.id}})">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

function addEventListeners(){
  document.getElementById('roleFilter').addEventListener('change',applyUsersFilters);
  document.getElementById('branchFilter').addEventListener('change',applyUsersFilters);
  document.getElementById('searchInput').addEventListener('input',applyUsersFilters);
  document.getElementById('refreshUsersBtn').addEventListener('click',loadUsers);
  document.getElementById('createUserBtn').addEventListener('click',createUser);
  document.getElementById('reloadPageBtn').addEventListener('click',()=>location.reload());
}

document.addEventListener('DOMContentLoaded',async()=>{
  if(!authManager.isAuthenticated()||authManager.currentUser.role!=='ADMIN'){
    window.location.href='dashboard.html';return;
  }
  injectRoleBadgesCss();
  addEventListeners();
  await Promise.all([loadBranches(), loadUsers()]);
}); 