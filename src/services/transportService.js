const log = require('../core/logger');
const transportRepository = require('../repositories/transportRepository');

// Valid transport statuses from schema
const VALID_TRANSPORT_STATUSES = ['NOT_REQUIRED', 'SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

async function createTransport(transportData) {
  const { order_id } = transportData;
  
  log.debug(`TransportService: Creating transport for order ${order_id}`);
  
  if (!order_id) {
    throw new Error('order_id is required');
  }
  
  try {
    const result = await transportRepository.create({
      ...transportData,
      status: 'SCHEDULED'
    });
    
    if (result) {
      log.info(`TransportService: Created transport ${result.transport_id} for order ${order_id}`);
      return result;
    } else {
      throw new Error('Failed to create transport');
    }
  } catch (error) {
    log.error(`TransportService: Failed to create transport: ${error.message}`);
    
    // Handle foreign key constraint
    if (error.code === '23503' && error.constraint === 'transports_order_id_fkey') {
      throw new Error('Order not found');
    }
    
    // Handle unique constraint (one transport per order)
    if (error.code === '23505' && error.constraint === 'transports_order_id_key') {
      throw new Error('Transport already exists for this order');
    }
    
    throw error;
  }
}

async function getAllTransports(filters = {}) {
  log.debug(`TransportService: Getting transports with filters: ${JSON.stringify(filters)}`);
  
  try {
    const result = await transportRepository.findAll(filters);
    log.debug(`TransportService: Found ${result.length} transports`);
    return result;
  } catch (error) {
    log.error(`TransportService: Failed to get transports: ${error.message}`);
    throw error;
  }
}

async function getTransportById(transportId) {
  log.debug(`TransportService: Getting transport by ID ${transportId}`);
  
  try {
    const result = await transportRepository.findById(transportId);
    return result;
  } catch (error) {
    log.error(`TransportService: Failed to get transport ${transportId}: ${error.message}`);
    throw error;
  }
}

async function getTransportByOrderId(orderId) {
  log.debug(`TransportService: Getting transport by order ID ${orderId}`);
  
  try {
    const result = await transportRepository.findByOrderId(orderId);
    return result;
  } catch (error) {
    log.error(`TransportService: Failed to get transport for order ${orderId}: ${error.message}`);
    throw error;
  }
}

async function updateTransportStatus(transportId, newStatus, actualTime = null) {
  log.debug(`TransportService: Updating transport ${transportId} status to ${newStatus}`);
  
  if (!VALID_TRANSPORT_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid transport status. Must be one of: ${VALID_TRANSPORT_STATUSES.join(', ')}`);
  }
  
  try {
    const result = await transportRepository.updateStatus(transportId, newStatus, actualTime);
    
    if (result) {
      log.info(`TransportService: Updated transport ${transportId} status to ${newStatus}`);
      return result;
    } else {
      return null;
    }
  } catch (error) {
    log.error(`TransportService: Failed to update transport ${transportId} status: ${error.message}`);
    throw error;
  }
}

async function updateTransport(transportId, transportData) {
  log.debug(`TransportService: Updating transport ${transportId}`);
  
  try {
    const result = await transportRepository.update(transportId, transportData);
    
    if (result) {
      log.info(`TransportService: Updated transport ${transportId}`);
      return result;
    } else {
      return null;
    }
  } catch (error) {
    log.error(`TransportService: Failed to update transport ${transportId}: ${error.message}`);
    throw error;
  }
}

async function startTransport(transportId) {
  log.debug(`TransportService: Starting transport ${transportId}`);
  
  const now = new Date().toISOString();
  return await updateTransportStatus(transportId, 'IN_TRANSIT', now);
}

async function completeTransport(transportId) {
  log.debug(`TransportService: Completing transport ${transportId}`);
  
  const now = new Date().toISOString();
  return await updateTransportStatus(transportId, 'DELIVERED', now);
}

async function cancelTransport(transportId) {
  log.debug(`TransportService: Cancelling transport ${transportId}`);
  
  return await updateTransportStatus(transportId, 'CANCELLED');
}

// Get active transports for dashboard
async function getActiveTransports() {
  log.debug('TransportService: Getting active transports');
  
  try {
    const result = await transportRepository.findActive();
    log.debug(`TransportService: Found ${result.length} active transports`);
    return result;
  } catch (error) {
    log.error(`TransportService: Failed to get active transports: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createTransport,
  getAllTransports,
  getTransportById,
  getTransportByOrderId,
  updateTransportStatus,
  updateTransport,
  startTransport,
  completeTransport,
  cancelTransport,
  getActiveTransports,
  VALID_TRANSPORT_STATUSES
}; 