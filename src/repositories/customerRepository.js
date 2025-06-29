const Base = require('./_base');

class CustomerRepository extends Base {
  constructor() { super('users'); }

  list(branchId = null) {
    const params = ['CUSTOMER'];
    let where = 'role = $1';
    if (branchId !== null) {
      params.push(branchId);
      where += ` AND branch_id = $${params.length}`;
    }
    return super.list(where, params);
  }
}

module.exports = new CustomerRepository(); 