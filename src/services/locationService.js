const repo = require('../repositories/branchRepository');

module.exports = {
  list: city => repo.list(city),
  get: id => repo.get(id),
  create: (data, userId) => repo.create(data, userId),
  update: (id, data) => repo.update(id, data),
  remove: id => repo.remove(id),
  // legacy aliases expected by controllers
  getAllLocations: activeOnly => repo.list(null),
  getLocationById: id => repo.get(id),
  createLocation: data => repo.create(data, null),
  updateLocation: (id, data) => repo.update(id, data),
  deleteLocation: id => repo.remove(id)
}; 