// ==== GENERIC CRUD TABLE UTILS ====

/**
 * Render a table with CRUD action buttons.
 * @param {HTMLElement} container where to render
 * @param {Array} data array of objects
 * @param {Object} options { onAdd(), onEdit(row), onDelete(row) }
 */
function renderCrudTable(container, data=[], options={}){
  if(!Array.isArray(data)||!container) return;
  const keys = data.length? Object.keys(data[0]).filter(k=>!k.toLowerCase().endsWith('pwd_hash') && !k.toLowerCase().includes('hash')) : [];
  let html = '<button class="btn btn-primary" id="addBtn">Adaugă nou</button>';
  html += '<table class="admin-table"><thead><tr>';
  keys.forEach(k=>{html+=`<th>${k}</th>`});
  html+='<th>Acțiuni</th></tr></thead><tbody>';
  data.forEach((row,i)=>{
    html+='<tr>';
    keys.forEach(k=>{html+=`<td>${row[k]??''}</td>`});
    html+=`<td class="admin-actions">
      <button class="btn btn-sm btn-secondary" data-edit="${i}">Edit</button>
      <button class="btn btn-sm btn-danger" data-del="${i}">Delete</button>
    </td></tr>`;
  });
  html+='</tbody></table>';
  container.innerHTML=html;

  // attach events
  container.querySelector('#addBtn')?.addEventListener('click',()=>options.onAdd && options.onAdd());
  container.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const idx=parseInt(btn.dataset.edit); options.onEdit && options.onEdit(data[idx]);
    });
  });
  container.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const idx=parseInt(btn.dataset.del); if(confirm('Confirmă ștergerea?')) options.onDelete && options.onDelete(data[idx]);
    });
  });
} 