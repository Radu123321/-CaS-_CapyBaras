const Base = require('./_base');
const pool = require('../core/psql');

class RecurrenceRepository extends Base {
  constructor() { super('recurring_orders'); }

  /** Returns recurrences that should fire (next_occurrence <= now and active) */
  due() {
    return this.list('active = true AND next_occurrence <= now()', []);
  }

  /** Set next occurrence timestamp */
  scheduleNext(id, nextTs) {
    return this.patch(id, 'next_occurrence = $2', [nextTs]);
  }
}

module.exports = new RecurrenceRepository(); 