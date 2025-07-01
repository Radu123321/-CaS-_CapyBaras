// ==== CUSTOMERS PAGE ====

// Legacy loader (CRUD-table) – kept for reference
async function legacyLoadCustomers(){
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

// ==== NEW RESPONSIVE LOGIC ====

let customersData=[];
let branchesData=[];
let filteredCustomers=[];

function showLoading(){
  document.getElementById('loadingState').style.display='flex';
  document.getElementById('customersContent').classList.remove('visible');
  document.getElementById('errorState').classList.add('hidden');
}

function showContent(){
  document.getElementById('loadingState').style.display='none';
  document.getElementById('customersContent').classList.add('visible');
}

function showError(msg){
  document.getElementById('loadingState').style.display='none';
  document.getElementById('customersContent').classList.remove('visible');
  document.getElementById('errorState').classList.remove('hidden');
  document.getElementById('errorMessage').textContent=msg||'Eroare';
}

async function loadBranches(){
  try{
    const resp=await authManager.apiRequest('/locations');
    branchesData=resp.success?(resp.data||[]):[];
    const sel=document.getElementById('branchFilter');
    if(sel){
      sel.innerHTML='<option value="">Toate filialele</option>';
      branchesData.forEach(b=>{
        const id=b.id||b.location_id;
        const nm=b.name||b.location_name||('Filiala #'+id);
        sel.innerHTML+=`<option value="${id}">${nm}</option>`;
      });
    }
  }catch(e){console.error(e);branchesData=[];}
}

async function loadCustomers(){
  showLoading();
  try{
    const resp=await authManager.apiRequest('/customers');
    if(!resp.success) throw new Error(resp.error||'Eroare');
    customersData=resp.data||[];
    applyFilters();
    showContent();
  }catch(e){console.error(e);showError(e.message||'Eroare');}
}

function getBranchName(id){
  const b=branchesData.find(x=>(x.id||x.location_id)==id);
  return b? (b.name||b.location_name||('Filiala #'+id)) : '';
}

function updateStats(){
  document.getElementById('customersTotalCount').textContent=customersData.length;

  // Hide branch filter if not applicable
  const hasBranch=customersData.some(c=>c.branch_id);
  const filterGroup=document.querySelector('.filter-group label[for="branchFilter"]')?.parentElement;
  if(filterGroup){filterGroup.style.display=hasBranch?'flex':'none';}
}

function applyFilters(){
  const branchSel=document.getElementById('branchFilter');
  const br=branchSel?branchSel.value:'';
  const q=document.getElementById('searchInput').value.toLowerCase().trim();
  filteredCustomers=customersData.filter(c=>{
    if(branchSel && br && String(c.branch_id||'')!==br) return false;
    if(q){
      const name=((c.first_name||'')+' '+(c.last_name||'')).toLowerCase();
      if(!(c.email.toLowerCase().includes(q) || name.includes(q))) return false;
    }
    return true;
  });
  renderCustomersTable();
  document.getElementById('customersCount').textContent=`${filteredCustomers.length} clienți`;
  updateStats();
}

function renderCustomersTable(){
  const tbody=document.getElementById('customersTableBody');
  if(!tbody) return;
  if(filteredCustomers.length===0){
    tbody.innerHTML='<tr><td colspan="7" class="no-data">Niciun client găsit</td></tr>';
    return;
  }
  tbody.innerHTML=filteredCustomers.map(c=>{
    const name=`${c.first_name||''} ${c.last_name||''}`.trim();
    const branch=getBranchName(c.branch_id);
    const created=(c.created_at||'').split('T')[0];
    return `<tr>
      <td>${c.id}</td>
      <td>${c.email}</td>
      <td>${name}</td>
      <td>${branch||'-'}</td>
      <td>${c.phone||''}</td>
      <td>${created}</td>
      <td class="actions-cell">
        <button class="btn-sm btn-secondary" onclick="editCustomer({id:${c.id},first_name:'${(c.first_name||'').replace(/'/g,"\'")}',last_name:'${(c.last_name||'').replace(/'/g,"\'")}',phone:'${(c.phone||'').replace(/'/g,"\'")}'})">Edit</button>
        <button class="btn-sm btn-danger" onclick="deleteCustomer({id:${c.id}})">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

function addPageEvents(){
  document.getElementById('branchFilter').addEventListener('change',applyFilters);
  document.getElementById('searchInput').addEventListener('input',applyFilters);
  document.getElementById('refreshCustomersBtn').addEventListener('click',loadCustomers);
  document.getElementById('createCustomerBtn').addEventListener('click',createCustomer);
  document.getElementById('reloadPageBtn').addEventListener('click',()=>location.reload());
}

// ==== MODAL HELPERS ====

function buildCustomerModal(mode='create', row={}){
  const idSuffix = mode==='create' ? 'create' : `edit-${row.id}`;
  const modalId = `customerModal-${idSuffix}`;
  if(document.getElementById(modalId)) return modalId;

  if(!document.getElementById('customerModalExtraCss')){
    const style=document.createElement('style');style.id='customerModalExtraCss';style.textContent=`
      .customer-modal .form-group{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
      .customer-modal .form-control{width:100%;}
    `;document.head.appendChild(style);
  }

  const isCreate = mode==='create';
  const html=`<div id="${modalId}" class="modal-overlay">
    <div class="modal-content modal-small customer-modal">
      <div class="modal-header">
        <h3>${isCreate?'Adaugă Client':'Editează Client'}</h3>
        <button class="modal-close" onclick="closeCustomerModal('${modalId}')">&times;</button>
      </div>
      <div class="modal-body">
        ${isCreate?'<div class="form-group"><label class="form-label">Email</label><input type="email" id="cEmail" class="form-control" placeholder="client@example.com" required></div>':''}
        <div class="form-group"><label class="form-label">Prenume</label><input type="text" id="cFirst" class="form-control" value="${row.first_name||''}" ${isCreate?'required':''}></div>
        <div class="form-group"><label class="form-label">Nume</label><input type="text" id="cLast" class="form-control" value="${row.last_name||''}" ${isCreate?'required':''}></div>
        <div class="form-group"><label class="form-label">Telefon</label><input type="text" id="cPhone" class="form-control" value="${row.phone||''}"></div>
        ${isCreate?'<div class="form-group"><label class="form-label">Parolă temporară</label><input type="text" id="cPwd" class="form-control" value="cust123"></div>':''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeCustomerModal('${modalId}')">Anulează</button>
        <button class="btn btn-primary" onclick="submitCustomerModal('${modalId}','${mode}',${row.id||null})">${isCreate?'Creează':'Salvează'}</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
  return modalId;
}

function closeCustomerModal(id){document.getElementById(id)?.remove();}

async function submitCustomerModal(modalId,mode,id){
  const getVal=idEl=>document.querySelector(`#${modalId} #${idEl}`)?.value.trim();
  const payload={
    first_name:getVal('cFirst'),
    last_name:getVal('cLast'),
    phone:getVal('cPhone')
  };
  if(mode==='create'){
    payload.email=getVal('cEmail');
    payload.password=getVal('cPwd')||'cust123';
  }
  try{
    const url=mode==='create'?'/customers':`/customers/${id}`;
    const method=mode==='create'?'POST':'PUT';
    const resp=await authManager.apiRequest(url,{method,body:JSON.stringify(payload)});
    if(!resp.success){alert(resp.error||'Eroare');return;}
    closeCustomerModal(modalId);loadCustomers();
  }catch(e){console.error(e);alert('Eroare');}
}

async function createCustomer(){
  const id=buildCustomerModal('create');document.getElementById(id).style.display='flex';setTimeout(()=>document.getElementById(id)?.classList.add('visible'),10);
}

async function editCustomer(row){
  const id=buildCustomerModal('edit',row);document.getElementById(id).style.display='flex';setTimeout(()=>document.getElementById(id)?.classList.add('visible'),10);
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
  if(!authManager.isAuthenticated()||authManager.currentUser.role!=='ADMIN'){
    window.location.href='dashboard.html';return;
  }
  addPageEvents();
  await Promise.all([loadBranches(), loadCustomers()]);
}); 