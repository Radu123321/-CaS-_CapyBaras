const customerRepository = require('../repositories/customerRepository');
const log = require('../core/logger');

async function createCustomer(customerData) {
  const { user_id, address, phone } = customerData;
  
  log.debug(`CustomerService: Creating customer for user ${user_id}`);
  
  if (!user_id || !address || !phone) {
    throw new Error('user_id, address, and phone are required');
  }
  
  try {
    // Check if customer already exists for this user
    const existingCustomer = await customerRepository.findByUserId(user_id);
    
    if (existingCustomer) {
      throw new Error('Customer already exists for this user');
    }
    
    const result = await customerRepository.create(customerData);
    
    if (result) {
      log.info(`CustomerService: Created customer ${result.customer_id} for user ${user_id}`);
      return result;
    } else {
      throw new Error('Failed to create customer');
    }
  } catch (error) {
    log.error(`CustomerService: Failed to create customer: ${error.message}`);
    
    // Handle foreign key constraint
    if (error.code === '23503' && error.constraint === 'customers_user_id_fkey') {
      throw new Error('User not found');
    }
    
    throw error;
  }
}

async function getAllCustomers() {
  log.debug('CustomerService: Getting all customers');
  
  try {
    const result = await customerRepository.findAll();
    log.debug(`CustomerService: Found ${result.length} customers`);
    return result;
  } catch (error) {
    log.error(`CustomerService: Failed to get customers: ${error.message}`);
    throw error;
  }
}

async function getCustomerById(customerId) {
  log.debug(`CustomerService: Getting customer by ID ${customerId}`);
  
  try {
    return await customerRepository.findById(customerId);
  } catch (error) {
    log.error(`CustomerService: Failed to get customer ${customerId}: ${error.message}`);
    throw error;
  }
}

async function getCustomerByUserId(userId) {
  log.debug(`CustomerService: Getting customer by user ID ${userId}`);
  
  try {
    return await customerRepository.findByUserId(userId);
  } catch (error) {
    log.error(`CustomerService: Failed to get customer by user ID ${userId}: ${error.message}`);
    throw error;
  }
}

async function updateCustomer(customerId, customerData) {
  log.debug(`CustomerService: Updating customer ${customerId}`);
  
  try {
    const result = await customerRepository.update(customerId, customerData);
    
    if (result) {
      log.info(`CustomerService: Updated customer ${customerId}`);
      return result;
    } else {
      return null;
    }
  } catch (error) {
    log.error(`CustomerService: Failed to update customer ${customerId}: ${error.message}`);
    throw error;
  }
}

async function deleteCustomer(customerId) {
  log.debug(`CustomerService: Deleting customer ${customerId}`);
  
  try {
    const result = await customerRepository.delete(customerId);
    
    if (result) {
      log.info(`CustomerService: Deleted customer ${customerId}`);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    log.error(`CustomerService: Failed to delete customer ${customerId}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerByUserId,
  updateCustomer,
  deleteCustomer
}; 