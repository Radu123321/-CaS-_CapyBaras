const orderRepository = require('../repositories/orderRepository');
const transportRepository = require('../repositories/transportRepository');
const log = require('../core/logger');

// Valid order statuses
const VALID_ORDER_STATUSES = ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

async function createOrder(orderData) {
  const { 
    customer_id, 
    location_id, 
    scheduled_for, 
    recurrence_rule, 
    transport_needed = false, 
    notes,
    order_items = [] // Array of {service_id, quantity, price}
  } = orderData;
  
  log.debug(`OrderService: Creating order for customer ${customer_id}`);
  
  if (!customer_id || !location_id || !order_items.length) {
    throw new Error('customer_id, location_id, and order_items are required');
  }
  
  try {
    // Create the main order using repository
    const order = await orderRepository.create({
      customer_id,
      location_id,
      scheduled_for,
      recurrence_rule,
      transport_needed,
      notes
    });
    
    if (!order) {
      throw new Error('Failed to create order');
    }
    
    const orderId = order.order_id;
    
    // Insert order items using repository
    const orderItemsInserted = [];
    for (const item of order_items) {
      const { service_id, quantity, price } = item;
      
      if (!service_id || !quantity || !price) {
        throw new Error('Each order item must have service_id, quantity, and price');
      }
      
      const itemResult = await orderRepository.createOrderItem({
        order_id: orderId,
        service_id,
        quantity,
        price
      });
      
      if (itemResult) {
        orderItemsInserted.push(itemResult);
      }
    }
    
    // If transport is needed, create transport record
    if (transport_needed) {
      await transportRepository.create({
        order_id: orderId,
        status: 'NOT_REQUIRED'
      });
      log.debug(`OrderService: Created transport record for order ${orderId}`);
    }
    
    log.info(`OrderService: Created order ${orderId} with ${orderItemsInserted.length} items`);
    
    return {
      ...order,
      order_items: orderItemsInserted
    };
  } catch (error) {
    log.error(`OrderService: Failed to create order: ${error.message}`);
    
    // Handle foreign key constraint errors
    if (error.code === '23503') {
      if (error.constraint === 'orders_customer_id_fkey') {
        throw new Error('Customer not found');
      }
      if (error.constraint === 'orders_location_id_fkey') {
        throw new Error('Location not found');
      }
      if (error.constraint === 'order_items_service_id_fkey') {
        throw new Error('Service not found in order items');
      }
    }
    
    throw error;
  }
}

async function getAllOrders(filters = {}) {
  log.debug(`OrderService: Getting orders with filters: ${JSON.stringify(filters)}`);
  
  try {
    const orders = await orderRepository.findAll(filters);
    log.debug(`OrderService: Found ${orders.length} orders`);
    return orders;
  } catch (error) {
    log.error(`OrderService: Failed to get orders: ${error.message}`);
    throw error;
  }
}

async function getOrderById(orderId) {
  log.debug(`OrderService: Getting order by ID ${orderId}`);
  
  try {
    const order = await orderRepository.findById(orderId);
    
    if (!order) {
      return null;
    }
    
    // Get transport info if needed
    if (order.transport_needed) {
      const transport = await transportRepository.findByOrderId(orderId);
      order.transport = transport;
    }
    
    return order;
  } catch (error) {
    log.error(`OrderService: Failed to get order ${orderId}: ${error.message}`);
    throw error;
  }
}

async function updateOrderStatus(orderId, newStatus) {
  log.debug(`OrderService: Updating order ${orderId} status to ${newStatus}`);
  
  if (!VALID_ORDER_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid order status. Must be one of: ${VALID_ORDER_STATUSES.join(', ')}`);
  }
  
  try {
    const result = await orderRepository.updateStatus(orderId, newStatus);
    
    if (result) {
      log.info(`OrderService: Updated order ${orderId} status to ${newStatus}`);
      return result;
    } else {
      return null;
    }
  } catch (error) {
    log.error(`OrderService: Failed to update order ${orderId} status: ${error.message}`);
    throw error;
  }
}

async function updateOrder(orderId, orderData) {
  log.debug(`OrderService: Updating order ${orderId}`);
  
  try {
    const result = await orderRepository.update(orderId, orderData);
    
    if (result) {
      log.info(`OrderService: Updated order ${orderId}`);
      return result;
    } else {
      return null;
    }
  } catch (error) {
    log.error(`OrderService: Failed to update order ${orderId}: ${error.message}`);
    throw error;
  }
}

async function cancelOrder(orderId) {
  log.debug(`OrderService: Cancelling order ${orderId}`);
  
  try {
    const result = await updateOrderStatus(orderId, 'CANCELLED');
    
    if (result) {
      // Also update transport status if exists
      await transportRepository.updateStatusByOrderId(orderId, 'CANCELLED');
      log.info(`OrderService: Cancelled order ${orderId} and associated transport`);
    }
    
    return result;
  } catch (error) {
    log.error(`OrderService: Failed to cancel order ${orderId}: ${error.message}`);
    throw error;
  }
}

// Get orders with recurrence rules for job processing
async function getOrdersWithRecurrence() {
  log.debug('OrderService: Getting orders with recurrence rules');
  
  try {
    const result = await orderRepository.findWithRecurrence();
    log.debug(`OrderService: Found ${result.length} orders with recurrence rules`);
    return result;
  } catch (error) {
    log.error(`OrderService: Failed to get orders with recurrence: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  cancelOrder,
  getOrdersWithRecurrence,
  VALID_ORDER_STATUSES
}; 