const repo = require('../repositories/recurrenceRepository');

module.exports = {
  list: filters => repo.list(filters),
  due: () => repo.due(),
  scheduleNext: (id, ts) => repo.scheduleNext(id, ts)
}; 