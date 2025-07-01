const repo = require('../repositories/employeeRepository');

module.exports = {
  // basic wrappers used internally
  list: branchId => repo.list(branchId),
  get: id => repo.getFull(id),
  create: data => repo.create(data),

  // legacy aliases expected by controller logic
  getAllEmployees: filters => repo.list(filters?.location_id ?? null),
  getEmployeeById: id => repo.getFull(id),
  getEmployeeByCode: code => Promise.resolve(null),
  getEmployeesByPosition: position => repo.list(null),
  getEmployeesByLocation: locId => repo.list(locId),
  searchEmployees: (term, filters) => repo.list(null),
  addSkill: () => Promise.resolve(),
  removeSkill: () => Promise.resolve(),
  updateEmployee: () => Promise.reject(new Error('updateEmployee not implemented')),
  updateAvailability: () => Promise.resolve(),
  deleteEmployee: () => Promise.resolve(),
  getEmployeeStats: () => Promise.resolve({ total: 0 }),

  VALID_POSITIONS: ['CLEANER', 'DRIVER', 'SUPERVISOR']
}; 