const customerRepository = require('../repositories/customerRepository');
const log = require('../core/logger');

async function createCustomer(customerData) {
  log.debug(`CustomerService: Creating customer for user ${customerData.user_id}`);
  
  try {
    // Validate required fields
    if (!customerData.user_id) {
      throw new Error('user_id is required');
    }
    
    // Check if customer already exists for this user
    const existingCustomer = await customerRepository.findByUserId(customerData.user_id);
    
    if (existingCustomer) {
      throw new Error('Customer already exists for this user');
    }
    
    // Generate customer code if not provided
    if (!customerData.customer_code) {
      customerData.customer_code = `CUS${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
    }
    
    // Set defaults
    const customerDefaults = {
      preferred_contact_method: 'EMAIL',
      loyalty_points: 0,
      total_orders: 0,
      total_spent: 0.00,
      is_vip: false,
      ...customerData
    };
    
    const result = await customerRepository.create(customerDefaults);
    
    if (result) {
      log.info(`CustomerService: Created customer ${result.customer_id} for user ${customerData.user_id}`);
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

async function getAllCustomers(filters = {}) {
  log.debug('CustomerService: Getting all customers');
  
  try {
    const result = await customerRepository.findAll(filters);
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

async function getCustomerByCode(customerCode) {
  log.debug(`CustomerService: Getting customer by code ${customerCode}`);
  
  try {
    return await customerRepository.findByCode(customerCode);
  } catch (error) {
    log.error(`CustomerService: Failed to get customer by code ${customerCode}: ${error.message}`);
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

async function updateLoyaltyPoints(customerId, points, operation = 'add') {
  log.debug(`CustomerService: ${operation} ${points} loyalty points for customer ${customerId}`);
  
  try {
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    let newPoints;
    if (operation === 'add') {
      newPoints = customer.loyalty_points + points;
    } else if (operation === 'subtract') {
      newPoints = Math.max(0, customer.loyalty_points - points);
    } else {
      newPoints = points; // set
    }
    
    const result = await customerRepository.updateLoyaltyPoints(customerId, newPoints);
    
    if (result) {
      log.info(`CustomerService: Updated loyalty points for customer ${customerId} to ${newPoints}`);
      return result;
    } else {
      throw new Error('Failed to update loyalty points');
    }
  } catch (error) {
    log.error(`CustomerService: Failed to update loyalty points for customer ${customerId}: ${error.message}`);
    throw error;
  }
}

async function updateCustomerStats(customerId, orderValue) {
  log.debug(`CustomerService: Updating stats for customer ${customerId} with order value ${orderValue}`);
  
  try {
    const result = await customerRepository.updateStats(customerId, orderValue);
    
    if (result) {
      log.info(`CustomerService: Updated stats for customer ${customerId}`);
      return result;
    } else {
      throw new Error('Failed to update customer stats');
    }
  } catch (error) {
    log.error(`CustomerService: Failed to update stats for customer ${customerId}: ${error.message}`);
    throw error;
  }
}

async function getVIPCustomers() {
  log.debug('CustomerService: Getting VIP customers');
  
  try {
    return await customerRepository.getVIPCustomers();
  } catch (error) {
    log.error(`CustomerService: Failed to get VIP customers: ${error.message}`);
    throw error;
  }
}

async function getTopCustomers(limit = 10) {
  log.debug(`CustomerService: Getting top ${limit} customers`);
  
  try {
    return await customerRepository.getTopCustomers(limit);
  } catch (error) {
    log.error(`CustomerService: Failed to get top customers: ${error.message}`);
    throw error;
  }
}

async function searchCustomers(searchTerm, filters = {}) {
  log.debug(`CustomerService: Searching customers with term: ${searchTerm}`);
  
  try {
    return await customerRepository.search(searchTerm, filters);
  } catch (error) {
    log.error(`CustomerService: Failed to search customers: ${error.message}`);
    throw error;
  }
}

async function getCustomerStats(customerId) {
  log.debug(`CustomerService: Getting stats for customer ${customerId}`);
  
  try {
    return await customerRepository.getStats(customerId);
  } catch (error) {
    log.error(`CustomerService: Failed to get customer stats: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerByUserId,
  getCustomerByCode,
  updateCustomer,
  deleteCustomer,
  updateLoyaltyPoints,
  updateCustomerStats,
  getVIPCustomers,
  getTopCustomers,
  searchCustomers,
  getCustomerStats
}; 