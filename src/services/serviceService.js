const repo = require('../repositories/serviceRepository');

module.exports = {
  list: () => repo.list(),
  get: id => repo.get(id),
  create: data => repo.create(data),
  update: (id, data) => repo.update(id, data),
  remove: id => repo.remove(id)
}; 