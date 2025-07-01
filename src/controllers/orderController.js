const orderService = require('../services/orderService');
const log = require('../core/logger');

// POST /api/orders
async function createOrder(req, res) {
  log.info('POST /api/orders');
  
  try {
    const { 
      customer_id, 
      location_id, 
      branch_id,
      service_id,
      quantity,
      unit_price,
      assigned_employee_id,
      scheduled_for, 
      transport_request_id,
      notes
    } = req.body;
    
    const branchIdValue = parseInt(branch_id ?? location_id);
    if (!customer_id || !branchIdValue || !service_id || !unit_price) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'customer_id, location_id, service_id, and unit_price are required'
      }));
      return;
    }
    
    const orderData = {
      customer_id: parseInt(customer_id),
      branch_id: branchIdValue,
      location_id: location_id ? parseInt(location_id) : undefined,
      service_id: parseInt(service_id),
      quantity: quantity ? parseInt(quantity) : 1,
      unit_price: parseFloat(unit_price),
      assigned_employee_id: assigned_employee_id ? parseInt(assigned_employee_id) : null,
      scheduled_for: scheduled_for || null,
      transport_request_id: transport_request_id ? parseInt(transport_request_id) : null,
      notes: notes?.trim() || null
    };
    
    log.debug(`OrderController: Creating order for customer ${orderData.customer_id}`);
    
    // Map to expected keys for service
    const header = {
      ...orderData,
      branchId: branchIdValue
    };
    const order = await orderService.createOrder(header);
    
    res.writeHead(201, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Order created successfully',
      data: order
    }));
  } catch (error) {
    log.error(`OrderController: Create order failed: ${error.message}`);
    
    let statusCode = 500;
    let errorMessage = 'Failed to create order';
    
    if (error.message.includes('required') || 
        error.message.includes('not found') ||
        error.message.includes('must have')) {
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

// GET /api/orders
async function getAllOrders(req, res) {
  log.info('GET /api/orders');
  
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    const filters = {
      status: url.searchParams.get('status'),
      customer_id: url.searchParams.get('customer_id') ? parseInt(url.searchParams.get('customer_id')) : null,
      location_id: url.searchParams.get('location_id') ? parseInt(url.searchParams.get('location_id')) : null,
      service_id: url.searchParams.get('service_id') ? parseInt(url.searchParams.get('service_id')) : null,
      assigned_employee_id: url.searchParams.get('assigned_employee_id') ? parseInt(url.searchParams.get('assigned_employee_id')) : null,
      transport_request_id: url.searchParams.get('transport_request_id') ? parseInt(url.searchParams.get('transport_request_id')) : null,
      date_from: url.searchParams.get('date_from'),
      date_to: url.searchParams.get('date_to'),
      page: parseInt(url.searchParams.get('page')) || 1,
      limit: parseInt(url.searchParams.get('limit')) || 20
    };
    
    // Remove null values
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    log.debug(`OrderController: Getting orders with filters: ${JSON.stringify(filters)}`);
    
    const orders = await orderService.getAllOrders(filters);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: orders,
      count: orders.length
    }));
  } catch (error) {
    log.error(`OrderController: Get orders failed: ${error.message}`);
    
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Failed to get orders'
    }));
  }
}

// GET /api/orders/:id
async function getOrderById(req, res) {
  const orderId = extractIdFromUrl(req.url);
  log.info(`GET /api/orders/${orderId}`);
  
  if (!orderId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Invalid order ID'
    }));
    return;
  }
  
  try {
    log.debug(`OrderController: Getting order by ID ${orderId}`);
    
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'Order not found'
      }));
      return;
    }
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: order
    }));
  } catch (error) {
    log.error(`OrderController: Get order failed: ${error.message}`);
    
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Failed to get order'
    }));
  }
}

// GET /api/orders/customer/:customerId
async function getOrdersByCustomer(req, res) {
  const customerId = extractCustomerIdFromUrl(req.url);
  log.info(`GET /api/orders/customer/${customerId}`);
  
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
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filters = {
      status: url.searchParams.get('status'),
      page: parseInt(url.searchParams.get('page')) || 1,
      limit: parseInt(url.searchParams.get('limit')) || 20
    };
    
    // Remove null values
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    const orders = await orderService.getOrdersByCustomer(customerId, filters);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: orders,
      count: orders.length
    }));
  } catch (error) {
    log.error(`OrderController: Get orders by customer failed: ${error.message}`);
    
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Failed to get orders'
    }));
  }
}

// GET /api/orders/employee/:employeeId
async function getOrdersByEmployee(req, res) {
  const employeeId = extractEmployeeIdFromUrl(req.url);
  log.info(`GET /api/orders/employee/${employeeId}`);
  
  if (!employeeId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Invalid employee ID'
    }));
    return;
  }
  
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filters = {
      status: url.searchParams.get('status'),
      page: parseInt(url.searchParams.get('page')) || 1,
      limit: parseInt(url.searchParams.get('limit')) || 20
    };
    
    // Remove null values
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    const orders = await orderService.getOrdersByEmployee(employeeId, filters);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: orders,
      count: orders.length
    }));
  } catch (error) {
    log.error(`OrderController: Get orders by employee failed: ${error.message}`);
    
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Failed to get orders'
    }));
  }
}

// GET /api/orders/active
async function getActiveOrders(req, res) {
  log.info('GET /api/orders/active');
  
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const locationId = url.searchParams.get('location_id') ? parseInt(url.searchParams.get('location_id')) : null;
    
    const orders = await orderService.getActiveOrders(locationId);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: orders,
      count: orders.length
    }));
  } catch (error) {
    log.error(`OrderController: Get active orders failed: ${error.message}`);
    
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Failed to get active orders'
    }));
  }
}

// GET /api/orders/search
async function searchOrders(req, res) {
  log.info('GET /api/orders/search');
  
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
      status: url.searchParams.get('status'),
      location_id: url.searchParams.get('location_id') ? parseInt(url.searchParams.get('location_id')) : null,
      page: parseInt(url.searchParams.get('page')) || 1,
      limit: parseInt(url.searchParams.get('limit')) || 20
    };
    
    // Remove null values
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    const orders = await orderService.searchOrders(searchTerm, filters);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: orders,
      count: orders.length,
      searchTerm
    }));
  } catch (error) {
    log.error(`OrderController: Search orders failed: ${error.message}`);
    
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Failed to search orders'
    }));
  }
}

// PUT /api/orders/:id
async function updateOrder(req, res) {
  const orderId = extractIdFromUrl(req.url);
  log.info(`PUT /api/orders/${orderId}`);
  
  if (!orderId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Invalid order ID'
    }));
    return;
  }
  
  try {
    // Allow full editability (admin can change any column)
    const {
      customer_id,
      location_id,
      branch_id,
      service_id,
      status,
      quantity,
      unit_price,
      assigned_employee_id,
      scheduled_for,
      scheduled_start,
      scheduled_end,
      transport_request_id,
      notes
    } = req.body;

    const orderData = {};

    // Map/validate numeric & optional fields
    if (customer_id !== undefined) orderData.customer_id = parseInt(customer_id);
    // Accept both location_id and branch_id aliases
    if (location_id !== undefined) orderData.branch_id = parseInt(location_id);
    if (branch_id !== undefined)  orderData.branch_id = parseInt(branch_id);
    if (service_id !== undefined) orderData.service_id = parseInt(service_id);
    if (status !== undefined)     orderData.status = status;

    if (quantity !== undefined)   orderData.quantity = parseInt(quantity);
    if (unit_price !== undefined) orderData.unit_price = parseFloat(unit_price);
    if (assigned_employee_id !== undefined) {
      orderData.assigned_employee_id = assigned_employee_id ? parseInt(assigned_employee_id) : null;
    }

    // Scheduled time – front-end may send scheduled_for OR scheduled_start
    if (scheduled_for !== undefined)   orderData.scheduled_start = scheduled_for;
    if (scheduled_start !== undefined) orderData.scheduled_start = scheduled_start;
    if (scheduled_end !== undefined)   orderData.scheduled_end = scheduled_end;

    if (transport_request_id !== undefined) {
      orderData.transport_request_id = transport_request_id ? parseInt(transport_request_id) : null;
    }
    if (notes !== undefined)      orderData.notes = notes?.trim() || null;
    
    log.debug(`OrderController: Updating order ${orderId}`);
    
    const order = await orderService.updateOrder(orderId, orderData);
    
    if (!order) {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'Order not found'
      }));
      return;
    }
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Order updated successfully',
      data: order
    }));
  } catch (error) {
    log.error(`OrderController: Update order failed: ${error.message}`);
    
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Failed to update order'
    }));
  }
}

// PUT /api/orders/:id/status
async function updateOrderStatus(req, res) {
  const orderId = extractIdFromUrl(req.url);
  log.info(`PUT /api/orders/${orderId}/status`);
  
  if (!orderId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Invalid order ID'
    }));
    return;
  }
  
  try {
    const { status } = req.body;
    
    if (!status) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'Status is required'
      }));
      return;
    }
    
    log.debug(`OrderController: Updating order ${orderId} status to ${status}`);
    
    const order = await orderService.updateOrderStatus(orderId, status);
    
    if (!order) {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'Order not found'
      }));
      return;
    }
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Order status updated successfully',
      data: order
    }));
  } catch (error) {
    log.error(`OrderController: Update order status failed: ${error.message}`);
    
    let statusCode = 500;
    let errorMessage = 'Failed to update order status';
    
    if (error.message.includes('Invalid order status')) {
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

// PUT /api/orders/:id/assign
async function assignEmployee(req, res) {
  const orderId = extractIdFromUrl(req.url);
  log.info(`PUT /api/orders/${orderId}/assign`);
  
  if (!orderId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Invalid order ID'
    }));
    return;
  }
  
  try {
    const { employee_id } = req.body;
    
    if (!employee_id) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'employee_id is required'
      }));
      return;
    }
    
    const order = await orderService.assignEmployee(orderId, parseInt(employee_id));
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Employee assigned successfully',
      data: order
    }));
  } catch (error) {
    log.error(`OrderController: Assign employee failed: ${error.message}`);
    
    let statusCode = 500;
    let errorMessage = 'Failed to assign employee';
    
    if (error.message === 'Order not found') {
      statusCode = 404;
      errorMessage = 'Order not found';
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

// PUT /api/orders/:id/start
async function startOrder(req, res) {
  const orderId = extractIdFromUrl(req.url);
  log.info(`PUT /api/orders/${orderId}/start`);
  
  if (!orderId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Invalid order ID'
    }));
    return;
  }
  
  try {
    const order = await orderService.startOrder(orderId);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Order started successfully',
      data: order
    }));
  } catch (error) {
    log.error(`OrderController: Start order failed: ${error.message}`);
    
    let statusCode = 500;
    let errorMessage = 'Failed to start order';
    
    if (error.message.includes('not found') || error.message.includes('cannot be started')) {
      statusCode = 404;
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

// PUT /api/orders/:id/complete
async function completeOrder(req, res) {
  const orderId = extractIdFromUrl(req.url);
  log.info(`PUT /api/orders/${orderId}/complete`);
  
  if (!orderId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Invalid order ID'
    }));
    return;
  }
  
  try {
    const order = await orderService.completeOrder(orderId);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Order completed successfully',
      data: order
    }));
  } catch (error) {
    log.error(`OrderController: Complete order failed: ${error.message}`);
    
    let statusCode = 500;
    let errorMessage = 'Failed to complete order';
    
    if (error.message === 'Order not found') {
      statusCode = 404;
      errorMessage = 'Order not found';
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

// PUT/DELETE /api/orders/:id/cancel
async function cancelOrder(req, res) {
  const orderId = extractIdFromUrl(req.url);
  log.info(`${req.method} /api/orders/${orderId}/cancel`);
  
  if (!orderId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Invalid order ID'
    }));
    return;
  }
  
  try {
    const order = await orderService.cancelOrder(orderId);
    
    if (!order) {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'Order not found'
      }));
      return;
    }
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Order cancelled successfully'
    }));
  } catch (error) {
    log.error(`OrderController: Cancel order failed: ${error.message}`);
    
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Failed to cancel order'
    }));
  }
}

// GET /api/orders/availability
async function getOrderAvailability(req, res) {
  log.info('GET /api/orders/availability');
  
  try {
    const date = req.query.date;
    const locationId = req.query.location_id ? parseInt(req.query.location_id) : null;
    const serviceId = req.query.service_id ? parseInt(req.query.service_id) : null;
    
    if (!date) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'Date parameter is required'
      }));
      return;
    }
    
    // Parse the date to make sure it's valid
    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'Invalid date format'
      }));
      return;
    }
    
    const availability = await orderService.getOrderAvailability(date, locationId, serviceId);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: availability
    }));
  } catch (error) {
    log.error(`OrderController: Get order availability failed: ${error.message}`);
    
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Failed to get order availability'
    }));
  }
}

// GET /api/orders/stats
async function getOrderStats(req, res) {
  log.info('GET /api/orders/stats');
  
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filters = {
      location_id: url.searchParams.get('location_id') ? parseInt(url.searchParams.get('location_id')) : null,
      date_from: url.searchParams.get('date_from'),
      date_to: url.searchParams.get('date_to')
    };
    
    // Remove null values
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    const stats = await orderService.getOrderStats(filters);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: stats
    }));
  } catch (error) {
    log.error(`OrderController: Get order stats failed: ${error.message}`);
    
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      error: 'Failed to get order statistics'
    }));
  }
}

// Helper functions to extract IDs from URLs
function extractIdFromUrl(url) {
  const match = url.match(/\/api\/orders\/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function extractCustomerIdFromUrl(url) {
  const match = url.match(/\/api\/orders\/customer\/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function extractEmployeeIdFromUrl(url) {
  const match = url.match(/\/api\/orders\/employee\/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  getOrdersByEmployee,
  getActiveOrders,
  searchOrders,
  updateOrder,
  updateOrderStatus,
  assignEmployee,
  startOrder,
  completeOrder,
  cancelOrder,
  getOrderStats,
  getOrderAvailability
}; 