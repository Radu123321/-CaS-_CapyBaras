const repo = require('../repositories/customerRepository');

module.exports = {
  // generic
  list: branchId => repo.list(branchId),
  get: id => repo.get(id),

  // controller-friendly aliases (v1 legacy names)
  getAllCustomers: filters => repo.list(filters?.location_id ?? null),
  getCustomerById: id => repo.get(id),
  getCustomerByCode: code => Promise.resolve(null), // code column not yet supported
  searchCustomers: (term, filters) => repo.list(null),
  createCustomer: data => Promise.reject(new Error('createCustomer not implemented')),
  updateCustomer: (id, data) => Promise.reject(new Error('updateCustomer not implemented')),
  deleteCustomer: id => Promise.reject(new Error('deleteCustomer not implemented')),
  updateLoyaltyPoints: () => Promise.resolve(),
  getVIPCustomers: () => repo.list(null),
  getTopCustomers: () => repo.list(null),
  getCustomerStats: () => Promise.resolve({ total: 0 })
}; 