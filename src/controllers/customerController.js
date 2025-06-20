const log = require('../core/logger');
const customerService = require('../services/customerService');

// GET /api/customers
async function getAllCustomers(req, res) {
  log.info('GET /api/customers');
  
  try {
    const customers = await customerService.getAllCustomers();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(customers));
  } catch (error) {
    log.error(`Get customers error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to get customers' }));
  }
}

// GET /api/customers/:id
async function getCustomerById(req, res) {
  const customerId = extractIdFromUrl(req.url);
  log.info(`GET /api/customers/${customerId}`);
  
  if (!customerId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid customer ID' }));
    return;
  }
  
  try {
    const customer = await customerService.getCustomerById(customerId);
    
    if (customer) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(customer));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Customer not found' }));
    }
  } catch (error) {
    log.error(`Get customer by ID error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to get customer' }));
  }
}

// POST /api/customers
async function createCustomer(req, res) {
  log.info('POST /api/customers');
  
  try {
    const { user_id, address, phone } = req.body;
    
    if (!user_id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'user_id is required' }));
      return;
    }
    
    const customerData = { user_id, address, phone };
    const newCustomer = await customerService.createCustomer(customerData);
    
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(newCustomer));
  } catch (error) {
    log.error(`Create customer error: ${error.message}`);
    
    if (error.message === 'User not found') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'User not found' }));
    } else if (error.message === 'Customer already exists for this user') {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Customer already exists for this user' }));
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create customer' }));
    }
  }
}

// PUT /api/customers/:id
async function updateCustomer(req, res) {
  const customerId = extractIdFromUrl(req.url);
  log.info(`PUT /api/customers/${customerId}`);
  
  if (!customerId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid customer ID' }));
    return;
  }
  
  try {
    const { address, phone } = req.body;
    
    const customerData = { address, phone };
    const updatedCustomer = await customerService.updateCustomer(customerId, customerData);
    
    if (updatedCustomer) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(updatedCustomer));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Customer not found' }));
    }
  } catch (error) {
    log.error(`Update customer error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to update customer' }));
  }
}

// DELETE /api/customers/:id
async function deleteCustomer(req, res) {
  const customerId = extractIdFromUrl(req.url);
  log.info(`DELETE /api/customers/${customerId}`);
  
  if (!customerId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid customer ID' }));
    return;
  }
  
  try {
    const deleted = await customerService.deleteCustomer(customerId);
    
    if (deleted) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Customer deleted successfully' }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Customer not found' }));
    }
  } catch (error) {
    log.error(`Delete customer error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to delete customer' }));
  }
}

// Helper function to extract ID from URL like /api/customers/123
function extractIdFromUrl(url) {
  const match = url.match(/\/api\/customers\/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
}; 