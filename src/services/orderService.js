const repo = require('../repositories/orderRepository');
const serviceRepo = require('../repositories/serviceRepository');
const inventoryService = require('./inventoryService');

function ok(v){return Promise.resolve(v);} // helper for stub returns

/**
 * OrderService – thin wrapper around OrderRepository (v3).
 *   create(header, items?, employees?)
 *   list(filters)
 *   get(id)
 *   updateStatus(id, status)
 *   remove(id)
 */
module.exports = {
  createOrder: async (header, items = [], employees = []) => {
    // Determine branch/location
    const branchId = header.branchId || header.location_id || header.locationId;
    if(!branchId) return Promise.reject(new Error('branchId/location_id required'));
    // Retrieve service requirements
    const reqs = await serviceRepo.getRequirements(header.service_id || header.serviceId);
    // Build usage list (negative qtyDelta)
    const usage = reqs.map(r=>({
      branchId,
      itemCode: r.resource_code,
      qtyDelta: - (r.qty_needed * (header.quantity || 1)),
      reason: 'ORDER',
      userId: header.customer_id || null
    }));
    // Reserve resources (one by one so trigger validates)
    try {
      for(const u of usage){
        await inventoryService.addTransaction(u);
      }
    } catch(err){
      throw new Error('Insufficient inventory');
    }
    // Try to create order in repo
    try {
      const id = await repo.create(header, items, employees);
      return id;
    } catch(e) {
      // rollback reservation
      for(const u of usage){
        try{ await inventoryService.addTransaction({...u, qtyDelta: -u.qtyDelta, reason:'ROLLBACK'});}catch(_){/* ignore */}
      }
      throw e;
    }
  },
  list: filters => repo.list(filters),
  getOrderById: id => repo.get(id),
  updateOrderStatus: (id, status) => repo.updateStatus(id, status),
  deleteOrder: id => repo.delete(id),
  // aliases for compatibility
  create: (h,i,e) => repo.create(h,i,e),
  get: id => repo.get(id),
  updateStatus: (id,s) => repo.updateStatus(id,s),
  remove: id => repo.delete(id),
  // stubs for advanced legacy paths (returning neutral data)
  searchOrders: async (term, filters={}) => {
    if (!term) return repo.list(filters);
    const all = await repo.list(filters);
    term = term.toLowerCase();
    return all.filter(o=> o.id.toString()===term || (o.customer_email||'').toLowerCase().includes(term));
  },
  getOrdersByCustomer: (custId, filters) => repo.findByCustomerId ? repo.findByCustomerId(custId, filters) : repo.list({customer_id:custId,...filters}),
  getOrdersByEmployee: (empId, filters) => repo.findByEmployeeId ? repo.findByEmployeeId(empId, filters) : ok([]),
  getActiveOrders: locId => repo.list({status:'IN_PROGRESS', branchId:locId}),
  assignEmployee: (orderId, empId) => repo.assignEmployee(orderId, empId),
  startOrder: id => repo.updateStatus(id, 'IN_PROGRESS'),
  completeOrder: id => repo.updateStatus(id, 'COMPLETED'),
  cancelOrder: id => repo.updateStatus(id, 'CANCELLED'),
  updateOrder: (id, data) => repo.update(id, data),
  getOrderAvailability: (d,l,s)=>repo.getAvailability?repo.getAvailability(d,l,s):ok([]),
  getOrderStats: f=>repo.getStats?repo.getStats(f):ok({}),
  getOrdersWithTransport: ()=>ok([]),
  getOrdersWithRecurrence: ()=>ok([]),
  VALID_ORDER_STATUSES:['NEW','SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED','REFUNDED'],
  getAllOrders: (filters={}) => repo.list(filters)
}; 