const repo = require('../repositories/orderRepository');

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
  createOrder: (header, items = [], employees = []) => repo.create(header, items, employees),
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
  searchOrders: (term,f)=>ok([]),
  getOrdersByCustomer: (custId, filters) => repo.findByCustomerId ? repo.findByCustomerId(custId, filters) : ok([]),
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
  VALID_ORDER_STATUSES:['NEW','SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED']
}; 