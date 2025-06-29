const repo = require('../repositories/weatherRepository');

module.exports = {
  latestAll: () => repo.latestAll(),
  latestByBranch: id => repo.latestByBranch(id),
  history: (id, days) => repo.history(id, days)
}; 