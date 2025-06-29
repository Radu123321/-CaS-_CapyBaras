const repo = require('../repositories/employeeRepository');

module.exports = {
  list: branchId => repo.list(branchId),
  get: id => repo.getFull(id),
  create: data => repo.create(data)
}; 