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
  createCustomer: async data => {
    const crypto = require('crypto');
    const userRepo = require('../repositories/userRepository');
    const hash = p => crypto.createHash('sha256').update(p).digest('hex');
    if (!data.email || !data.password) throw new Error('email and password required');
    const id = await userRepo.create({
      email: data.email.toLowerCase(),
      pwdHash: hash(data.password),
      role: 'CUSTOMER',
      branchId: data.branch_id || null,
      firstName: data.first_name || null,
      lastName: data.last_name || null,
      phone: data.phone || null
    });
    return userRepo.get(id);
  },
  updateCustomer: async (id, data) => {
    const userRepo = require('../repositories/userRepository');
    const existing = await userRepo.get(id);
    if (!existing || existing.role !== 'CUSTOMER') return null;
    const updated = await userRepo.update(id, {
      email: data.email || existing.email,
      role: 'CUSTOMER',
      branchId: data.branch_id !== undefined ? data.branch_id : existing.branch_id,
      firstName: data.first_name !== undefined ? data.first_name : existing.first_name,
      lastName: data.last_name !== undefined ? data.last_name : existing.last_name,
      phone: data.phone !== undefined ? data.phone : existing.phone
    });
    return updated;
  },
  deleteCustomer: async id => {
    const userRepo = require('../repositories/userRepository');
    const existing = await userRepo.get(id);
    if (!existing || existing.role !== 'CUSTOMER') return false;
    await userRepo.remove(id);
    return true;
  },
  updateLoyaltyPoints: () => Promise.resolve(),
  getVIPCustomers: () => repo.list(null),
  getTopCustomers: () => repo.list(null),
  getCustomerStats: () => Promise.resolve({ total: 0 })
}; 