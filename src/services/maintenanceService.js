const repo = require('../repositories/maintenanceRepository');

module.exports = {
  list: filters => repo.list(filters),
  complete: id => repo.complete(id),
  cancel: id => repo.cancel(id),
  upcoming: (days, branchId) => repo.upcoming(days, branchId)
}; 