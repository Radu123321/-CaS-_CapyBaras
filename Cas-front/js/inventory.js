// ==== INVENTORY PAGE ====

async function loadInventory(){
  const content=document.getElementById('content');
  const resp=await authManager.apiRequest('/inventory');
  if(resp.success){
    const rows = resp.data.rows||resp.data||[];
    renderCrudTable(content, rows, {
      onAdd: restockItem,
      onEdit: editStock,
      onDelete: deleteStock // not supported, will alert
    });
  } else content.textContent=resp.error||'Eroare';
}

async function restockItem(){
  const locationId=prompt('Branch ID'); if(!locationId) return;
  const resourceId=prompt('Item code (SOAP etc)'); if(!resourceId) return;
  const qty=prompt('Cantitate de adăugat','100');
  const body={ resources:[{ resource_id:resourceId, quantity:parseFloat(qty) }] };
  try{
    const resp=await authManager.apiRequest(`/inventory/location/${locationId}/restock`,{method:'POST',body:JSON.stringify(body)});
    if(!resp.success) return alert(resp.error||'Eroare');
    loadInventory();
  }catch(e){console.error(e);alert('Eroare');}
}

async function editStock(row){
  const qty=prompt('Nouă cantitate',row.qty_on_hand||'');
  if(qty===null) return;
  try{
    const resp=await authManager.apiRequest(`/inventory/location/${row.branch_id}/resource/${row.item_code}`,{method:'PUT',body:JSON.stringify({quantity:parseFloat(qty)})});
    if(!resp.success) return alert(resp.error||'Eroare');
    loadInventory();
  }catch(e){console.error(e);alert('Eroare');}
}

function deleteStock(){alert('Ştergerea stocului nu este suportată');}

document.addEventListener('DOMContentLoaded',async()=>{
  if (!authManager.isAuthenticated() || !['ADMIN','MANAGER'].includes(authManager.currentUser.role)) {
    window.location.href = 'dashboard.html';
    return;
  }
  await loadInventory();
}); 