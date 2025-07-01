const Base = require('./_base');

class CustomerRepository extends Base {
  constructor() { super('users'); }

  list(branchId = null) {
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