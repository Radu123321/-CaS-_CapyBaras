const repo = require('../repositories/exceptionRepository');

module.exports = {
  recent: (limit, table, action) => repo.recent(limit, table, action)
}; 