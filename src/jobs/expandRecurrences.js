const orderService = require('../services/orderService');
const log = require('../core/logger');

// Parse simple recurrence rules
// Format examples: "WEEKLY", "MONTHLY", "DAILY", "WEEKLY:2" (every 2 weeks)
function parseRecurrenceRule(rule) {
  if (!rule) return null;
  
  const parts = rule.split(':');
  const type = parts[0].toUpperCase();
  const interval = parts[1] ? parseInt(parts[1]) : 1;
  
  switch (type) {
    case 'DAILY':
      return { type: 'DAILY', interval, days: interval };
    case 'WEEKLY':
      return { type: 'WEEKLY', interval, days: interval * 7 };
    case 'MONTHLY':
      return { type: 'MONTHLY', interval, days: interval * 30 }; // Approximate
    default:
      return null;
  }
}

// Calculate next occurrence date
function calculateNextOccurrence(lastDate, recurrenceRule) {
  const rule = parseRecurrenceRule(recurrenceRule);
  if (!rule) return null;
  
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + rule.days);
  
  return nextDate;
}

// Check if we should create next occurrence
function shouldCreateNextOccurrence(scheduledFor, recurrenceRule) {
  const now = new Date();
  const scheduledDate = new Date(scheduledFor);
  
  // Only create if scheduled date is in the past and within reasonable range
  if (scheduledDate > now) {
    return false; // Future date, don't create yet
  }
  
  const daysSinceScheduled = Math.floor((now - scheduledDate) / (1000 * 60 * 60 * 24));
  
  // Don't create if too old (more than 30 days ago)
  if (daysSinceScheduled > 30) {
    return false;
  }
  
  const rule = parseRecurrenceRule(recurrenceRule);
  if (!rule) return false;
  
  // Create if enough days have passed according to the rule
  return daysSinceScheduled >= rule.days;
}

async function expandRecurrences() {
  log.info('ExpandRecurrences: Starting job');
  
  try {
    // Get all orders with recurrence rules
    const recurringOrders = await orderService.getOrdersWithRecurrence();
    
    log.debug(`ExpandRecurrences: Found ${recurringOrders.length} recurring orders`);
    
    let createdCount = 0;
    
    for (const order of recurringOrders) {
      try {
        // Check if we should create next occurrence
        if (shouldCreateNextOccurrence(order.scheduled_for, order.recurrence_rule)) {
          const nextDate = calculateNextOccurrence(order.scheduled_for, order.recurrence_rule);
          
          if (nextDate) {
            log.debug(`ExpandRecurrences: Creating next occurrence for order ${order.order_id}, scheduled for ${nextDate.toISOString()}`);
            
            // Get the original order items
            const originalOrder = await orderService.getOrderById(order.order_id);
            
            if (originalOrder && originalOrder.order_items && originalOrder.order_items.length > 0) {
              // Create new order with same details but new scheduled date
              const newOrderData = {
                customer_id: order.customer_id,
                location_id: order.location_id,
                scheduled_for: nextDate.toISOString(),
                recurrence_rule: order.recurrence_rule,
                transport_needed: order.transport_needed,
                notes: `Recurring order (based on order #${order.order_id}) - ${order.notes || ''}`.trim(),
                order_items: originalOrder.order_items.map(item => ({
                  service_id: item.service_id,
                  quantity: item.quantity,
                  price: item.price
                }))
              };
              
              const newOrder = await orderService.createOrder(newOrderData);
              createdCount++;
              
              log.info(`ExpandRecurrences: Created recurring order ${newOrder.order_id} for ${nextDate.toISOString()}`);
              
              // Update the original order's scheduled_for to prevent duplicate creation
              await orderService.updateOrder(order.order_id, {
                scheduled_for: nextDate.toISOString()
              });
            } else {
              log.warn(`ExpandRecurrences: Could not get order items for order ${order.order_id}`);
            }
          }
        }
      } catch (error) {
        log.error(`ExpandRecurrences: Failed to process order ${order.order_id}: ${error.message}`);
        // Continue with other orders
      }
    }
    
    log.info(`ExpandRecurrences: Job completed, created ${createdCount} new recurring orders`);
    
    return {
      success: true,
      processed: recurringOrders.length,
      created: createdCount
    };
  } catch (error) {
    log.error(`ExpandRecurrences: Job failed: ${error.message}`);
    throw error;
  }
}

module.exports = expandRecurrences; 