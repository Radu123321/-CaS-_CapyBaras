const orderRepository = require('../repositories/orderRepository');
const transportRepository = require('../repositories/transportRepository');
const customerRepository = require('../repositories/customerRepository');
const log = require('../core/logger');

// Valid order statuses
const VALID_ORDER_STATUSES = ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

async function createOrder(orderData) {
  const { 
    customer_id, 
    location_id, 
    service_id,
    quantity = 1,
    unit_price,
    assigned_employee_id,
    scheduled_for, 
    transport_request_id,
    notes
  } = orderData;
  
  log.debug(`OrderService: Creating order for customer ${customer_id}`);
  
  if (!customer_id || !location_id || !service_id || !unit_price) {
    throw new Error('customer_id, location_id, service_id, and unit_price are required');
  }
  
  try {
    // Calculate total amount
    const total_amount = parseFloat(unit_price) * parseInt(quantity);
    
    // Create the order using repository
    const orderCreateData = {
      customer_id,
      location_id,
      service_id,
      quantity: parseInt(quantity),
      unit_price: parseFloat(unit_price),
      total_amount,
      assigned_employee_id: assigned_employee_id || null,
      scheduled_for: scheduled_for ? new Date(scheduled_for) : null,
      transport_request_id: transport_request_id || null,
      notes: notes?.trim() || null,
      status: 'PENDING'
    };
    
    const order = await orderRepository.create(orderCreateData);
    
    if (!order) {
      throw new Error('Failed to create order');
    }
    
    // Update customer stats
    if (order.status === 'COMPLETED') {
      await customerRepository.updateStats(customer_id, total_amount);
    }
    
    log.info(`OrderService: Created order ${order.order_id} for customer ${customer_id}`);
    
    return order;
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
      if (error.constraint === 'orders_service_id_fkey') {
        throw new Error('Service not found');
      }
      if (error.constraint === 'orders_assigned_employee_id_fkey') {
        throw new Error('Assigned employee not found');
      }
      if (error.constraint === 'orders_transport_request_id_fkey') {
        throw new Error('Transport request not found');
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
    
    return order;
  } catch (error) {
    log.error(`OrderService: Failed to get order ${orderId}: ${error.message}`);
    throw error;
  }
}

async function getOrdersByCustomer(customerId, filters = {}) {
  log.debug(`OrderService: Getting orders for customer ${customerId}`);
  
  try {
    const orders = await orderRepository.findByCustomerId(customerId, filters);
    log.debug(`OrderService: Found ${orders.length} orders for customer ${customerId}`);
    return orders;
  } catch (error) {
    log.error(`OrderService: Failed to get orders for customer ${customerId}: ${error.message}`);
    throw error;
  }
}

async function getOrdersByEmployee(employeeId, filters = {}) {
  log.debug(`OrderService: Getting orders for employee ${employeeId}`);
  
  try {
    const orders = await orderRepository.findByEmployeeId(employeeId, filters);
    log.debug(`OrderService: Found ${orders.length} orders for employee ${employeeId}`);
    return orders;
  } catch (error) {
    log.error(`OrderService: Failed to get orders for employee ${employeeId}: ${error.message}`);
    throw error;
  }
}

async function getActiveOrders(locationId = null) {
  log.debug(`OrderService: Getting active orders${locationId ? ` for location ${locationId}` : ''}`);
  
  try {
    const orders = await orderRepository.getActiveOrders(locationId);
    log.debug(`OrderService: Found ${orders.length} active orders`);
    return orders;
  } catch (error) {
    log.error(`OrderService: Failed to get active orders: ${error.message}`);
    throw error;
  }
}

async function getOrdersWithTransport() {
  log.debug('OrderService: Getting orders with transport');
  
  try {
    const orders = await orderRepository.findWithTransport();
    log.debug(`OrderService: Found ${orders.length} orders with transport`);
    return orders;
  } catch (error) {
    log.error(`OrderService: Failed to get orders with transport: ${error.message}`);
    throw error;
  }
}

async function updateOrderStatus(orderId, newStatus) {
  log.debug(`OrderService: Updating order ${orderId} status to ${newStatus}`);
  
  if (!VALID_ORDER_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid order status. Must be one of: ${VALID_ORDER_STATUSES.join(', ')}`);
  }
  
  try {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      return null;
    }
    
    const result = await orderRepository.updateStatus(orderId, newStatus);
    
    if (result) {
      // Update customer stats if order is completed
      if (newStatus === 'COMPLETED' && order.status !== 'COMPLETED') {
        await customerRepository.updateStats(order.customer_id, order.total_amount);
      }
      
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
    // Recalculate total if quantity or unit_price changed
    if (orderData.quantity !== undefined || orderData.unit_price !== undefined) {
      const currentOrder = await orderRepository.findById(orderId);
      if (currentOrder) {
        const quantity = orderData.quantity !== undefined ? parseInt(orderData.quantity) : currentOrder.quantity;
        const unit_price = orderData.unit_price !== undefined ? parseFloat(orderData.unit_price) : currentOrder.unit_price;
        orderData.total_amount = quantity * unit_price;
      }
    }
    
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

async function assignEmployee(orderId, employeeId) {
  log.debug(`OrderService: Assigning employee ${employeeId} to order ${orderId}`);
  
  try {
    const result = await orderRepository.assignEmployee(orderId, employeeId);
    
    if (result) {
      log.info(`OrderService: Assigned employee ${employeeId} to order ${orderId}`);
      return result;
    } else {
      throw new Error('Order not found');
    }
  } catch (error) {
    log.error(`OrderService: Failed to assign employee to order ${orderId}: ${error.message}`);
    throw error;
  }
}

async function startOrder(orderId) {
  log.debug(`OrderService: Starting order ${orderId}`);
  
  try {
    const result = await orderRepository.startOrder(orderId);
    
    if (result) {
      log.info(`OrderService: Started order ${orderId}`);
      return result;
    } else {
      throw new Error('Order not found or cannot be started');
    }
  } catch (error) {
    log.error(`OrderService: Failed to start order ${orderId}: ${error.message}`);
    throw error;
  }
}

async function completeOrder(orderId) {
  log.debug(`OrderService: Completing order ${orderId}`);
  
  try {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    const result = await orderRepository.completeOrder(orderId);
    
    if (result) {
      // Update customer stats
      if (order.status !== 'COMPLETED') {
        await customerRepository.updateStats(order.customer_id, order.total_amount);
      }
      
      log.info(`OrderService: Completed order ${orderId}`);
      return result;
    } else {
      throw new Error('Failed to complete order');
    }
  } catch (error) {
    log.error(`OrderService: Failed to complete order ${orderId}: ${error.message}`);
    throw error;
  }
}

async function cancelOrder(orderId) {
  log.debug(`OrderService: Cancelling order ${orderId}`);
  
  try {
    const result = await updateOrderStatus(orderId, 'CANCELLED');
    
    if (result) {
      log.info(`OrderService: Cancelled order ${orderId}`);
    }
    
    return result;
  } catch (error) {
    log.error(`OrderService: Failed to cancel order ${orderId}: ${error.message}`);
    throw error;
  }
}

async function searchOrders(searchTerm, filters = {}) {
  log.debug(`OrderService: Searching orders with term: ${searchTerm}`);
  
  try {
    return await orderRepository.search(searchTerm, filters);
  } catch (error) {
    log.error(`OrderService: Failed to search orders: ${error.message}`);
    throw error;
  }
}

async function getOrderStats(filters = {}) {
  log.debug('OrderService: Getting order statistics');
  
  try {
    return await orderRepository.getStats(filters);
  } catch (error) {
    log.error(`OrderService: Failed to get order stats: ${error.message}`);
    throw error;
  }
}

async function getOrderAvailability(date, locationId = null, serviceId = null) {
  log.debug(`OrderService: Getting order availability for ${date}`);
  
  try {
    // Get available time slots for the given date
    const availability = await orderRepository.getAvailability(date, locationId, serviceId);
    
    // Basic logic for time slots (can be enhanced based on business rules)
    const timeSlots = [];
    for (let hour = 8; hour <= 18; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      const isAvailable = !availability.some(order => 
        order.scheduled_time === timeSlot && order.status !== 'CANCELLED'
      );
      
      timeSlots.push({
        time: timeSlot,
        available: isAvailable,
        capacity: isAvailable ? 5 : 0, // Basic capacity logic
        orders_count: availability.filter(order => 
          order.scheduled_time === timeSlot && order.status !== 'CANCELLED'
        ).length
      });
    }
    
    return {
      date,
      locationId,
      serviceId,
      timeSlots,
      totalSlots: timeSlots.length,
      availableSlots: timeSlots.filter(slot => slot.available).length
    };
  } catch (error) {
    log.error(`OrderService: Failed to get order availability: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  getOrdersByEmployee,
  getActiveOrders,
  getOrdersWithTransport,
  updateOrderStatus,
  updateOrder,
  assignEmployee,
  startOrder,
  completeOrder,
  cancelOrder,
  searchOrders,
  getOrderStats,
  getOrderAvailability,
  VALID_ORDER_STATUSES
}; 