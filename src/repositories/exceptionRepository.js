const Base = require('./_base');

class ExceptionRepository extends Base {
  constructor() { super('audit_log'); }

  /** list recent rows optionally filtered by table and action */
  recent(limit = 100, tableName = null, action = null) {
    const params = [];
    let where = 'TRUE';
    if (tableName) { params.push(tableName); where += ` AND table_name = $${params.length}`; }
    if (action) { params.push(action); where += ` AND action = $${params.length}`; }
    return this.list(where + ` ORDER BY changed_at DESC LIMIT ${limit}`, params);
  }
}

module.exports = new ExceptionRepository(); 