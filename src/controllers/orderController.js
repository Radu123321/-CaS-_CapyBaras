const orderService = require('../services/orderService');
const log = require('../core/logger');

async function createOrder(req, res) {
  try {
    const orderData = req.body;
    
    log.debug(`OrderController: Creating order for customer ${orderData.customer_id}`);
    
    const order = await orderService.createOrder(orderData);
    
    res.statusCode = 201;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: order
    }));
  } catch (error) {
    log.error(`OrderController: Create order failed: ${error.message}`);
    
    let statusCode = 500;
    if (error.message.includes('required') || 
        error.message.includes('not found') ||
        error.message.includes('must have')) {
      statusCode = 400;
    }
    
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

async function getAllOrders(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    const filters = {
      status: url.searchParams.get('status'),
      customer_id: url.searchParams.get('customer_id'),
      location_id: url.searchParams.get('location_id'),
      include_items: url.searchParams.get('include_items') === 'true'
    };
    
    // Remove null values
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    log.debug(`OrderController: Getting orders with filters: ${JSON.stringify(filters)}`);
    
    const orders = await orderService.getAllOrders(filters);
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: orders
    }));
  } catch (error) {
    log.error(`OrderController: Get orders failed: ${error.message}`);
    
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

async function getOrderById(req, res) {
  try {
    const orderId = req.params.id;
    
    log.debug(`OrderController: Getting order by ID ${orderId}`);
    
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'Order not found'
      }));
      return;
    }
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: order
    }));
  } catch (error) {
    log.error(`OrderController: Get order failed: ${error.message}`);
    
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

async function updateOrder(req, res) {
  try {
    const orderId = req.params.id;
    const orderData = req.body;
    
    log.debug(`OrderController: Updating order ${orderId}`);
    
    const order = await orderService.updateOrder(orderId, orderData);
    
    if (!order) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'Order not found'
      }));
      return;
    }
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: order
    }));
  } catch (error) {
    log.error(`OrderController: Update order failed: ${error.message}`);
    
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

async function updateOrderStatus(req, res) {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    
    if (!status) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'Status is required'
      }));
      return;
    }
    
    log.debug(`OrderController: Updating order ${orderId} status to ${status}`);
    
    const order = await orderService.updateOrderStatus(orderId, status);
    
    if (!order) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'Order not found'
      }));
      return;
    }
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: order
    }));
  } catch (error) {
    log.error(`OrderController: Update order status failed: ${error.message}`);
    
    let statusCode = 500;
    if (error.message.includes('Invalid order status')) {
      statusCode = 400;
    }
    
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

async function cancelOrder(req, res) {
  try {
    const orderId = req.params.id;
    
    log.debug(`OrderController: Cancelling order ${orderId}`);
    
    const order = await orderService.cancelOrder(orderId);
    
    if (!order) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'Order not found'
      }));
      return;
    }
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    }));
  } catch (error) {
    log.error(`OrderController: Cancel order failed: ${error.message}`);
    
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  cancelOrder
}; 