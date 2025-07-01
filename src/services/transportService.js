const repo = require('../repositories/transportRepository');

module.exports = {
  list: filters => repo.list(filters),
  getAllTransports: filters => repo.list(filters || {}),
  getTransportById: id => repo.get(id),
  getTransportByOrderId: orderId => repo.list({ orderId }).then(r=>r[0]||null),
  getActiveTransports: () => repo.list({ status: 'ON_ROUTE' }),
  createTransport: data => {
    const cols = [];
    const vals = [];
    if (data.order_id) { cols.push('order_id'); vals.push(data.order_id); }
    if (data.type) { cols.push('type'); vals.push(data.type); }
    if (data.driver_id) { cols.push('driver_id'); vals.push(data.driver_id); }
    if (data.vehicle) { cols.push('vehicle'); vals.push(data.vehicle); }
    if (data.status) { cols.push('status'); vals.push(data.status); }
    if (data.eta) { cols.push('eta'); vals.push(data.eta); }
    const colStr = cols.join(',');
    return repo.insert(colStr, vals);
  },
  updateTransport: (id, data={}) => {
    const allowed = ['type','driver_id','vehicle','status','eta'];
    const set = [];
    const vals = [];
    const push = (col,val)=>{vals.push(val); set.push(`${col}=$${vals.length+1}`);} // +1 for id
    Object.entries(data).forEach(([k,v])=>{ if (allowed.includes(k) && v!==undefined) push(k,v); });
    if (!set.length) return repo.get(id);
    return repo.patch(id, set.join(', '), vals);
  },
  updateTransportStatus: (id, status) => repo.updateStatus(id, status),
  startTransport: id => repo.updateStatus(id, 'ON_ROUTE'),
  completeTransport: id => repo.updateStatus(id, 'DONE'),
  cancelTransport: id => repo.updateStatus(id, 'CANCELLED'),
  updateStatus: (id, status) => repo.updateStatus(id, status),
  closeForOrder: orderId => repo.closeForOrder(orderId)
}; 