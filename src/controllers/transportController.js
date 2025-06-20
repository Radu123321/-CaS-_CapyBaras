const transportService = require('../services/transportService');
const log = require('../core/logger');

async function createTransport(req, res) {
  try {
    const transportData = req.body;
    
    log.debug(`TransportController: Creating transport for order ${transportData.order_id}`);
    
    const transport = await transportService.createTransport(transportData);
    
    res.statusCode = 201;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: transport
    }));
  } catch (error) {
    log.error(`TransportController: Create transport failed: ${error.message}`);
    
    let statusCode = 500;
    if (error.message.includes('required') || 
        error.message.includes('not found') ||
        error.message.includes('already exists')) {
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

async function getAllTransports(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    const filters = {
      status: url.searchParams.get('status'),
      driver_name: url.searchParams.get('driver_name')
    };
    
    // Remove null values
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    log.debug(`TransportController: Getting transports with filters: ${JSON.stringify(filters)}`);
    
    const transports = await transportService.getAllTransports(filters);
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: transports
    }));
  } catch (error) {
    log.error(`TransportController: Get transports failed: ${error.message}`);
    
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

async function getTransportById(req, res) {
  try {
    const transportId = req.params.id;
    
    log.debug(`TransportController: Getting transport by ID ${transportId}`);
    
    const transport = await transportService.getTransportById(transportId);
    
    if (!transport) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'Transport not found'
      }));
      return;
    }
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: transport
    }));
  } catch (error) {
    log.error(`TransportController: Get transport failed: ${error.message}`);
    
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

async function getTransportByOrderId(req, res) {
  try {
    const orderId = req.params.orderId;
    
    log.debug(`TransportController: Getting transport by order ID ${orderId}`);
    
    const transport = await transportService.getTransportByOrderId(orderId);
    
    if (!transport) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'Transport not found for this order'
      }));
      return;
    }
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: transport
    }));
  } catch (error) {
    log.error(`TransportController: Get transport by order failed: ${error.message}`);
    
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

async function updateTransport(req, res) {
  try {
    const transportId = req.params.id;
    const transportData = req.body;
    
    log.debug(`TransportController: Updating transport ${transportId}`);
    
    const transport = await transportService.updateTransport(transportId, transportData);
    
    if (!transport) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'Transport not found'
      }));
      return;
    }
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: transport
    }));
  } catch (error) {
    log.error(`TransportController: Update transport failed: ${error.message}`);
    
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

async function updateTransportStatus(req, res) {
  try {
    const transportId = req.params.id;
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
    
    log.debug(`TransportController: Updating transport ${transportId} status to ${status}`);
    
    const transport = await transportService.updateTransportStatus(transportId, status);
    
    if (!transport) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'Transport not found'
      }));
      return;
    }
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: transport
    }));
  } catch (error) {
    log.error(`TransportController: Update transport status failed: ${error.message}`);
    
    let statusCode = 500;
    if (error.message.includes('Invalid transport status')) {
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

async function startTransport(req, res) {
  try {
    const transportId = req.params.id;
    
    log.debug(`TransportController: Starting transport ${transportId}`);
    
    const transport = await transportService.startTransport(transportId);
    
    if (!transport) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'Transport not found'
      }));
      return;
    }
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: transport,
      message: 'Transport started successfully'
    }));
  } catch (error) {
    log.error(`TransportController: Start transport failed: ${error.message}`);
    
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

async function completeTransport(req, res) {
  try {
    const transportId = req.params.id;
    
    log.debug(`TransportController: Completing transport ${transportId}`);
    
    const transport = await transportService.completeTransport(transportId);
    
    if (!transport) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'Transport not found'
      }));
      return;
    }
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: transport,
      message: 'Transport completed successfully'
    }));
  } catch (error) {
    log.error(`TransportController: Complete transport failed: ${error.message}`);
    
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

async function cancelTransport(req, res) {
  try {
    const transportId = req.params.id;
    
    log.debug(`TransportController: Cancelling transport ${transportId}`);
    
    const transport = await transportService.cancelTransport(transportId);
    
    if (!transport) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'Transport not found'
      }));
      return;
    }
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: transport,
      message: 'Transport cancelled successfully'
    }));
  } catch (error) {
    log.error(`TransportController: Cancel transport failed: ${error.message}`);
    
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

async function getActiveTransports(req, res) {
  try {
    log.debug('TransportController: Getting active transports');
    
    const transports = await transportService.getActiveTransports();
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: transports
    }));
  } catch (error) {
    log.error(`TransportController: Get active transports failed: ${error.message}`);
    
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

module.exports = {
  createTransport,
  getAllTransports,
  getTransportById,
  getTransportByOrderId,
  updateTransport,
  updateTransportStatus,
  startTransport,
  completeTransport,
  cancelTransport,
  getActiveTransports
}; 