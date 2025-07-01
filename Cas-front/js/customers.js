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
  if (!authManager.isAuthenticated() || authManager.currentUser.role !== 'ADMIN') {
    window.location.href = 'dashboard.html';
    return;
  }
  await loadCustomers();
}); 