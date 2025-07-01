const Base = require('./_base');

class CustomerRepository extends Base {
  constructor() { super('users'); }

  list(branchId = null) {
    const pool = require('../core/psql');
    // Add soft-delete column if it was not yet created (v3 migrated schema)
    // This keeps compatibility with earlier code that filters on `active`.
    pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE');

    const params = ['CUSTOMER'];
    let where = 'role = $1 AND active = true';
    if (branchId !== null) {
      params.push(branchId);
      where += ` AND branch_id = $${params.length}`;
    }
    return super.list(where, params);
  }

  /** Soft delete customer */
  remove(id){
    const pool=require('../core/psql');
    return pool.query('UPDATE users SET active=false, updated_at=now() WHERE id=$1', [id]);
  }
}

module.exports = new CustomerRepository(); 