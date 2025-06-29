const repo = require('../repositories/shiftRepository');

module.exports = {
  list: filters => repo.list(filters),
  get: id => repo.get(id),
  start: id => repo.start(id),
  end: id => repo.end(id),
  active: branchId => repo.active(branchId)
}; 