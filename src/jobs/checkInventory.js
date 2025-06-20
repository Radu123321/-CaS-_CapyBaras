const log = require('../core/logger');
const inventoryService = require('../services/inventoryService');

// Configuration for inventory monitoring
const INVENTORY_CONFIG = {
  LOW_STOCK_THRESHOLD: 10,
  CRITICAL_STOCK_THRESHOLD: 5,
  OUT_OF_STOCK_THRESHOLD: 0
};

/**
 * Check Inventory Job
 * Monitors inventory levels and logs alerts for low/out of stock items
 * This job should be scheduled to run periodically (e.g., every hour)
 */
async function checkInventory() {
  try {
    log.info('CheckInventory: Starting inventory monitoring job');
    
    // Get inventory alerts
    const alerts = await inventoryService.getInventoryAlerts(INVENTORY_CONFIG.LOW_STOCK_THRESHOLD);
    
    if (alerts.total_alerts === 0) {
      log.info('CheckInventory: All inventory levels are adequate');
      return {
        success: true,
        message: 'All inventory levels are adequate',
        alerts: alerts
      };
    }
    
    // Process out of stock items (critical)
    if (alerts.out_of_stock.length > 0) {
      log.error(`CheckInventory: CRITICAL - ${alerts.out_of_stock.length} items are out of stock`);
      
      for (const item of alerts.out_of_stock) {
        log.error(`CheckInventory: OUT OF STOCK - ${item.resource_name} at ${item.location_name} (Quantity: ${item.quantity})`);
      }
      
      // In a real application, this would trigger:
      // - Email notifications to managers
      // - SMS alerts for critical items
      // - Automatic reorder for essential resources
      // - Dashboard alerts
    }
    
    // Process low stock items (warning)
    if (alerts.low_stock.length > 0) {
      log.warn(`CheckInventory: WARNING - ${alerts.low_stock.length} items are low in stock`);
      
      for (const item of alerts.low_stock) {
        const severity = item.quantity <= INVENTORY_CONFIG.CRITICAL_STOCK_THRESHOLD ? 'CRITICAL' : 'WARNING';
        log.warn(`CheckInventory: LOW STOCK [${severity}] - ${item.resource_name} at ${item.location_name} (Quantity: ${item.quantity})`);
      }
    }
    
    // Generate summary report
    const summary = generateInventorySummary(alerts);
    log.info(`CheckInventory: ${summary}`);
    
    return {
      success: true,
      message: summary,
      alerts: alerts
    };
    
  } catch (error) {
    log.error(`CheckInventory: Job failed - ${error.message}`);
    throw error;
  }
}

/**
 * Generate a summary of inventory status
 */
function generateInventorySummary(alerts) {
  const { low_stock, out_of_stock, total_alerts } = alerts;
  
  if (total_alerts === 0) {
    return 'All inventory levels are adequate';
  }
  
  const parts = [];
  
  if (out_of_stock.length > 0) {
    parts.push(`${out_of_stock.length} items out of stock`);
  }
  
  if (low_stock.length > 0) {
    parts.push(`${low_stock.length} items low in stock`);
  }
  
  return `Inventory alerts: ${parts.join(', ')} (Total: ${total_alerts})`;
}

/**
 * Advanced inventory check with location-specific analysis
 */
async function checkInventoryByLocation(locationId) {
  try {
    log.info(`CheckInventory: Checking inventory for location ${locationId}`);
    
    const inventory = await inventoryService.getInventoryByLocation(locationId, true);
    
    if (inventory.length === 0) {
      log.warn(`CheckInventory: No inventory found for location ${locationId}`);
      return {
        success: true,
        message: `No inventory found for location ${locationId}`,
        location_id: locationId,
        alerts: { low_stock: [], out_of_stock: [], total_alerts: 0 }
      };
    }
    
    // Categorize items by stock level
    const outOfStock = inventory.filter(item => item.quantity <= INVENTORY_CONFIG.OUT_OF_STOCK_THRESHOLD);
    const lowStock = inventory.filter(item => 
      item.quantity > INVENTORY_CONFIG.OUT_OF_STOCK_THRESHOLD && 
      item.quantity <= INVENTORY_CONFIG.LOW_STOCK_THRESHOLD
    );
    const adequateStock = inventory.filter(item => item.quantity > INVENTORY_CONFIG.LOW_STOCK_THRESHOLD);
    
    const locationName = inventory[0]?.location_name || `Location ${locationId}`;
    
    log.info(`CheckInventory: ${locationName} - ${adequateStock.length} adequate, ${lowStock.length} low, ${outOfStock.length} out of stock`);
    
    // Log specific alerts for this location
    if (outOfStock.length > 0) {
      log.error(`CheckInventory: ${locationName} has ${outOfStock.length} items out of stock`);
      outOfStock.forEach(item => {
        log.error(`CheckInventory: OUT OF STOCK - ${item.resource_name} (${item.quantity} ${item.unit})`);
      });
    }
    
    if (lowStock.length > 0) {
      log.warn(`CheckInventory: ${locationName} has ${lowStock.length} items low in stock`);
      lowStock.forEach(item => {
        log.warn(`CheckInventory: LOW STOCK - ${item.resource_name} (${item.quantity} ${item.unit})`);
      });
    }
    
    return {
      success: true,
      location_id: locationId,
      location_name: locationName,
      message: `${locationName}: ${adequateStock.length} adequate, ${lowStock.length} low, ${outOfStock.length} out of stock`,
      alerts: {
        low_stock: lowStock,
        out_of_stock: outOfStock,
        total_alerts: lowStock.length + outOfStock.length
      },
      stats: {
        total_items: inventory.length,
        adequate_stock: adequateStock.length,
        low_stock: lowStock.length,
        out_of_stock: outOfStock.length
      }
    };
    
  } catch (error) {
    log.error(`CheckInventory: Failed to check inventory for location ${locationId} - ${error.message}`);
    throw error;
  }
}

/**
 * Predict when resources will run out based on usage patterns
 * This is a simplified prediction - in a real system you'd use historical data
 */
async function predictStockDepletion() {
  try {
    log.info('CheckInventory: Analyzing stock depletion predictions');
    
    // Get current low stock items
    const lowStockItems = await inventoryService.getLowStockItems(INVENTORY_CONFIG.LOW_STOCK_THRESHOLD);
    
    const predictions = lowStockItems.map(item => {
      // Simple prediction: assume 20% usage per day for demonstration
      const dailyUsageRate = 0.20;
      const currentQuantity = item.quantity;
      const daysUntilDepletion = Math.floor(currentQuantity / (currentQuantity * dailyUsageRate + 1));
      
      return {
        resource_id: item.resource_id,
        resource_name: item.resource_name,
        location_name: item.location_name,
        current_quantity: currentQuantity,
        estimated_days_until_depletion: daysUntilDepletion,
        urgency: daysUntilDepletion <= 3 ? 'HIGH' : daysUntilDepletion <= 7 ? 'MEDIUM' : 'LOW'
      };
    });
    
    // Log urgent predictions
    const urgentPredictions = predictions.filter(p => p.urgency === 'HIGH');
    if (urgentPredictions.length > 0) {
      log.warn(`CheckInventory: ${urgentPredictions.length} resources predicted to run out within 3 days`);
      urgentPredictions.forEach(pred => {
        log.warn(`CheckInventory: URGENT - ${pred.resource_name} at ${pred.location_name} will run out in ~${pred.estimated_days_until_depletion} days`);
      });
    }
    
    return {
      success: true,
      predictions: predictions,
      urgent_count: urgentPredictions.length
    };
    
  } catch (error) {
    log.error(`CheckInventory: Failed to predict stock depletion - ${error.message}`);
    throw error;
  }
}

module.exports = {
  checkInventory,
  checkInventoryByLocation,
  predictStockDepletion,
  INVENTORY_CONFIG
}; 