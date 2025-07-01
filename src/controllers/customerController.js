const log = require('../core/logger');
const customerService = require('../services/customerService');
const authService = require('../services/authService');

// GET /api/customers
async function getAllCustomers(req, res) {
  log.info('GET /api/customers');
  
  try {
    // Parse query parameters for filtering
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filters = {
      location_id: url.searchParams.get('location_id'),
      is_vip: url.searchParams.get('is_vip') === 'true',
      company_name: url.searchParams.get('company_name'),
      page: parseInt(url.searchParams.get('page')) || 1,
      limit: parseInt(url.searchParams.get('limit')) || 20
    };
    
    // Remove null/undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });
    
    const customers = await customerService.getAllCustomers(filters);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: customers,
      count: customers.length
    }));
  } catch (error) {
    log.error(`Get customers error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to get customers' 
    }));
  }
}

// GET /api/customers/:id
async function getCustomerById(req, res) {
  const customerId = extractIdFromUrl(req.url);
  log.info(`GET /api/customers/${customerId}`);
  
  if (!customerId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid customer ID' 
    }));
    return;
  }
  
  try {
    const customer = await customerService.getCustomerById(customerId);
    
    if (customer) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        data: customer
      }));
    } else {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Customer not found' 
      }));
    }
  } catch (error) {
    log.error(`Get customer by ID error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to get customer' 
    }));
  }
}

// GET /api/customers/code/:code
async function getCustomerByCode(req, res) {
  const customerCode = extractCodeFromUrl(req.url);
  log.info(`GET /api/customers/code/${customerCode}`);
  
  if (!customerCode) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid customer code' 
    }));
    return;
  }
  
  try {
    const customer = await customerService.getCustomerByCode(customerCode);
    
    if (customer) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        data: customer
      }));
    } else {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Customer not found' 
      }));
    }
  } catch (error) {
    log.error(`Get customer by code error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to get customer' 
    }));
  }
}

// GET /api/customers/search
async function searchCustomers(req, res) {
  log.info('GET /api/customers/search');
  
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const searchTerm = url.searchParams.get('q');
    
    if (!searchTerm) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Search term is required' 
      }));
      return;
    }
    
    const filters = {
      location_id: url.searchParams.get('location_id'),
      is_vip: url.searchParams.get('is_vip') === 'true',
      page: parseInt(url.searchParams.get('page')) || 1,
      limit: parseInt(url.searchParams.get('limit')) || 20
    };
    
    // Remove null/undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });
    
    const customers = await customerService.searchCustomers(searchTerm, filters);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: customers,
      count: customers.length,
      searchTerm
    }));
  } catch (error) {
    log.error(`Search customers error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to search customers' 
    }));
  }
}

// POST /api/customers
async function createCustomer(req, res) {
  log.info('POST /api/customers');
  
  try {
    const { 
      user_id, 
      customer_code, 
      company_name, 
      billing_address, 
      preferred_location_id, 
      preferred_contact_method,
      email,
      password,
      first_name,
      last_name,
      phone,
      branch_id
    } = req.body;

    // New simplified flow: if email+password provided, create standalone customer user
    if(email && password){
      const newCustomer = await customerService.createCustomer({
        email,
        password,
        branch_id,
        first_name,
        last_name,
        phone
      });
      res.writeHead(201, { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
      return res.end(JSON.stringify({success:true,data:newCustomer}));
    }

    if (!user_id) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'user_id or email/password is required' 
      }));
      return;
    }
    
    const customerData = { 
      user_id, 
      customer_code: customer_code?.trim() || null,
      company_name: company_name?.trim() || null,
      billing_address: billing_address?.trim() || null,
      preferred_location_id: preferred_location_id || null,
      preferred_contact_method: preferred_contact_method || 'EMAIL'
    };
    
    const newCustomer = await customerService.createCustomer(customerData);
    
    res.writeHead(201, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Customer created successfully',
      data: newCustomer
    }));
  } catch (error) {
    log.error(`Create customer error: ${error.message}`);
    
    let statusCode = 500;
    let errorMessage = 'Failed to create customer';
    
    if (error.message === 'User not found') {
      statusCode = 404;
      errorMessage = 'User not found';
    } else if (error.message === 'Customer already exists for this user') {
      statusCode = 409;
      errorMessage = 'Customer already exists for this user';
    } else if (error.message.includes('required')) {
      statusCode = 400;
      errorMessage = error.message;
    }
    
    res.writeHead(statusCode, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }));
  }
}

// PUT /api/customers/:id
async function updateCustomer(req, res) {
  const customerId = extractIdFromUrl(req.url);
  log.info(`PUT /api/customers/${customerId}`);
  
  if (!customerId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid customer ID' 
    }));
    return;
  }
  
  try {
    const { 
      company_name, 
      billing_address, 
      preferred_location_id, 
      preferred_contact_method,
      phone,
      first_name,
      last_name
    } = req.body;
    
    const customerData = { 
      company_name: company_name?.trim() || null,
      billing_address: billing_address?.trim() || null,
      preferred_location_id: preferred_location_id || null,
      preferred_contact_method: preferred_contact_method || null,
      phone: phone || null,
      first_name: first_name || null,
      last_name: last_name || null
    };
    
    // Remove null/undefined values
    Object.keys(customerData).forEach(key => {
      if (customerData[key] === null || customerData[key] === undefined) {
        delete customerData[key];
      }
    });
    
    const updatedCustomer = await customerService.updateCustomer(customerId, customerData);
    
    if (updatedCustomer) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        message: 'Customer updated successfully',
        data: updatedCustomer
      }));
    } else {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Customer not found' 
      }));
    }
  } catch (error) {
    log.error(`Update customer error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to update customer' 
    }));
  }
}

// DELETE /api/customers/:id
async function deleteCustomer(req, res) {
  const customerId = extractIdFromUrl(req.url);
  log.info(`DELETE /api/customers/${customerId}`);
  
  if (!customerId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid customer ID' 
    }));
    return;
  }
  
  try {
    const deleted = await customerService.deleteCustomer(customerId);
    
    if (deleted) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true,
        message: 'Customer deleted successfully' 
      }));
    } else {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Customer not found' 
      }));
    }
  } catch (error) {
    log.error(`Delete customer error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to delete customer' 
    }));
  }
}

// PUT /api/customers/:id/loyalty
async function updateLoyaltyPoints(req, res) {
  const customerId = extractIdFromUrl(req.url);
  log.info(`PUT /api/customers/${customerId}/loyalty`);
  
  if (!customerId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid customer ID' 
    }));
    return;
  }
  
  try {
    const { points, operation = 'add' } = req.body;
    
    if (points === undefined || points === null) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Points value is required' 
      }));
      return;
    }
    
    if (!['add', 'subtract', 'set'].includes(operation)) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Operation must be add, subtract, or set' 
      }));
      return;
    }
    
    const updatedCustomer = await customerService.updateLoyaltyPoints(customerId, points, operation);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Loyalty points updated successfully',
      data: updatedCustomer
    }));
  } catch (error) {
    log.error(`Update loyalty points error: ${error.message}`);
    
    let statusCode = 500;
    let errorMessage = 'Failed to update loyalty points';
    
    if (error.message === 'Customer not found') {
      statusCode = 404;
      errorMessage = 'Customer not found';
    }
    
    res.writeHead(statusCode, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }));
  }
}

// GET /api/customers/vip
async function getVIPCustomers(req, res) {
  log.info('GET /api/customers/vip');
  
  try {
    const vipCustomers = await customerService.getVIPCustomers();
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: vipCustomers,
      count: vipCustomers.length
    }));
  } catch (error) {
    log.error(`Get VIP customers error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to get VIP customers' 
    }));
  }
}

// GET /api/customers/top
async function getTopCustomers(req, res) {
  log.info('GET /api/customers/top');
  
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    
    const topCustomers = await customerService.getTopCustomers(limit);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: topCustomers,
      count: topCustomers.length
    }));
  } catch (error) {
    log.error(`Get top customers error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to get top customers' 
    }));
  }
}

// GET /api/customers/:id/stats
async function getCustomerStats(req, res) {
  const customerId = extractIdFromUrl(req.url);
  log.info(`GET /api/customers/${customerId}/stats`);
  
  if (!customerId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid customer ID' 
    }));
    return;
  }
  
  try {
    const stats = await customerService.getCustomerStats(customerId);
    
    if (stats) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        data: stats
      }));
    } else {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Customer not found' 
      }));
    }
  } catch (error) {
    log.error(`Get customer stats error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to get customer stats' 
    }));
  }
}

// Helper function to extract ID from URL like /api/customers/123
function extractIdFromUrl(url) {
  const match = url.match(/\/api\/customers\/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Helper function to extract code from URL like /api/customers/code/CUS123
function extractCodeFromUrl(url) {
  const match = url.match(/\/api\/customers\/code\/([A-Za-z0-9]+)/);
  return match ? match[1] : null;
}

module.exports = {
  getAllCustomers,
  getCustomerById,
  getCustomerByCode,
  searchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateLoyaltyPoints,
  getVIPCustomers,
  getTopCustomers,
  getCustomerStats
}; 