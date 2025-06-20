const inventoryRepository = require('../repositories/inventoryRepository');
const log = require('../core/logger');

// Valid resource kinds from schema
const VALID_RESOURCE_KINDS = ['DETERGENT', 'BRUSH', 'WATER', 'EQUIPMENT', 'OTHER'];

class InventoryService {
  // ==================== RESOURCES ====================
  
  async getAllResources() {
    try {
      const resources = await inventoryRepository.getAllResources();
      log.info(`Retrieved ${resources.length} resources`);
      return resources;
    } catch (error) {
      log.error(`Failed to get resources: ${error.message}`);
      throw error;
    }
  }
  
  async getResourceById(resourceId) {
    if (!resourceId || resourceId <= 0) {
      throw new Error('Valid resource ID is required');
    }
    
    try {
      const resource = await inventoryRepository.getResourceById(resourceId);
      if (!resource) {
        throw new Error('Resource not found');
      }
      
      return resource;
    } catch (error) {
      log.error(`Failed to get resource ${resourceId}: ${error.message}`);
      throw error;
    }
  }
  
  async createResource(resourceData) {
    const { name, kind, unit, unit_cost } = resourceData;
    
    if (!name || name.trim().length === 0) {
      throw new Error('Resource name is required');
    }
    
    if (!kind || !VALID_RESOURCE_KINDS.includes(kind)) {
      throw new Error(`Invalid resource kind. Must be one of: ${VALID_RESOURCE_KINDS.join(', ')}`);
    }
    
    if (!unit || unit.trim().length === 0) {
      throw new Error('Unit is required');
    }
    
    try {
      const resource = await inventoryRepository.createResource({
        name: name.trim(),
        kind,
        unit: unit.trim(),
        unit_cost: unit_cost || 0
      });
      
      log.info(`Created resource: ${resource.name} (ID: ${resource.resource_id})`);
      return resource;
    } catch (error) {
      log.error(`Failed to create resource: ${error.message}`);
      throw error;
    }
  }
  
  async updateResource(resourceId, resourceData) {
    if (!resourceId || resourceId <= 0) {
      throw new Error('Valid resource ID is required');
    }
    
    const { name, kind, unit, unit_cost } = resourceData;
    
    // Validation for provided fields
    if (name !== undefined && name.trim().length === 0) {
      throw new Error('Resource name cannot be empty');
    }
    
    if (kind !== undefined && !VALID_RESOURCE_KINDS.includes(kind)) {
      throw new Error(`Invalid resource kind. Must be one of: ${VALID_RESOURCE_KINDS.join(', ')}`);
    }
    
    if (unit !== undefined && unit.trim().length === 0) {
      throw new Error('Unit cannot be empty');
    }
    
    if (unit_cost !== undefined && (isNaN(unit_cost) || unit_cost < 0)) {
      throw new Error('Unit cost must be a non-negative number');
    }
    
    try {
      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (kind !== undefined) updateData.kind = kind;
      if (unit !== undefined) updateData.unit = unit.trim();
      if (unit_cost !== undefined) updateData.unit_cost = unit_cost;
      
      const resource = await inventoryRepository.updateResource(resourceId, updateData);
      if (!resource) {
        throw new Error('Resource not found');
      }
      
      log.info(`Updated resource: ${resource.name} (ID: ${resource.resource_id})`);
      return resource;
    } catch (error) {
      log.error(`Failed to update resource ${resourceId}: ${error.message}`);
      throw error;
    }
  }
  
  async deleteResource(resourceId) {
    if (!resourceId || resourceId <= 0) {
      throw new Error('Valid resource ID is required');
    }
    
    try {
      const deleted = await inventoryRepository.deleteResource(resourceId);
      if (deleted) {
        log.info(`Deleted resource ID: ${resourceId}`);
      }
      return deleted;
    } catch (error) {
      log.error(`Failed to delete resource ${resourceId}: ${error.message}`);
      throw error;
    }
  }
  
  // ==================== INVENTORY ====================
  
  async getInventoryByLocation(locationId, includeZero = false) {
    if (!locationId || locationId <= 0) {
      throw new Error('Valid location ID is required');
    }
    
    try {
      const inventory = await inventoryRepository.getInventoryByLocation(locationId, includeZero);
      log.info(`Retrieved ${inventory.length} inventory items for location ${locationId}`);
      return inventory;
    } catch (error) {
      log.error(`Failed to get inventory for location ${locationId}: ${error.message}`);
      throw error;
    }
  }
  
  async getInventoryByResource(resourceId) {
    if (!resourceId || resourceId <= 0) {
      throw new Error('Valid resource ID is required');
    }
    
    try {
      const inventory = await inventoryRepository.getInventoryByResource(resourceId);
      log.info(`Retrieved ${inventory.length} inventory items for resource ${resourceId}`);
      return inventory;
    } catch (error) {
      log.error(`Failed to get inventory for resource ${resourceId}: ${error.message}`);
      throw error;
    }
  }
  
  async getAllInventory(includeZero = false) {
    try {
      const inventory = await inventoryRepository.getAllInventory(includeZero);
      log.info(`Retrieved ${inventory.length} total inventory items`);
      return inventory;
    } catch (error) {
      log.error(`Failed to get all inventory: ${error.message}`);
      throw error;
    }
  }
  
  async getInventoryItem(locationId, resourceId) {
    if (!locationId || locationId <= 0) {
      throw new Error('Valid location ID is required');
    }
    
    if (!resourceId || resourceId <= 0) {
      throw new Error('Valid resource ID is required');
    }
    
    try {
      const item = await inventoryRepository.getInventoryItem(locationId, resourceId);
      return item;
    } catch (error) {
      log.error(`Failed to get inventory item: ${error.message}`);
      throw error;
    }
  }
  
  async updateInventoryQuantity(locationId, resourceId, quantity) {
    if (!locationId || locationId <= 0) {
      throw new Error('Valid location ID is required');
    }
    
    if (!resourceId || resourceId <= 0) {
      throw new Error('Valid resource ID is required');
    }
    
    if (quantity === undefined || isNaN(quantity) || quantity < 0) {
      throw new Error('Quantity must be a non-negative number');
    }
    
    try {
      const item = await inventoryRepository.updateInventoryQuantity(locationId, resourceId, quantity);
      log.info(`Updated inventory: Location ${locationId}, Resource ${resourceId}, Quantity: ${quantity}`);
      return item;
    } catch (error) {
      log.error(`Failed to update inventory quantity: ${error.message}`);
      throw error;
    }
  }
  
  async adjustInventoryQuantity(locationId, resourceId, adjustment) {
    if (!locationId || locationId <= 0) {
      throw new Error('Valid location ID is required');
    }
    
    if (!resourceId || resourceId <= 0) {
      throw new Error('Valid resource ID is required');
    }
    
    if (adjustment === undefined || isNaN(adjustment)) {
      throw new Error('Adjustment must be a number');
    }
    
    try {
      const item = await inventoryRepository.adjustInventoryQuantity(locationId, resourceId, adjustment);
      log.info(`Adjusted inventory: Location ${locationId}, Resource ${resourceId}, Adjustment: ${adjustment}`);
      return item;
    } catch (error) {
      log.error(`Failed to adjust inventory quantity: ${error.message}`);
      throw error;
    }
  }
  
  // ==================== RESOURCE USAGE ====================
  
  async getOrderResourceUsage(orderId) {
    if (!orderId || orderId <= 0) {
      throw new Error('Valid order ID is required');
    }
    
    try {
      const usage = await inventoryRepository.getOrderResourceUsage(orderId);
      return usage;
    } catch (error) {
      log.error(`Failed to get resource usage for order ${orderId}: ${error.message}`);
      throw error;
    }
  }
  
  async addOrderResourceUsage(orderId, resourceId, quantity) {
    if (!orderId || orderId <= 0) {
      throw new Error('Valid order ID is required');
    }
    
    if (!resourceId || resourceId <= 0) {
      throw new Error('Valid resource ID is required');
    }
    
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }
    
    try {
      const usage = await inventoryRepository.addOrderResourceUsage(orderId, resourceId, quantity);
      log.info(`Added resource usage: Order ${orderId}, Resource ${resourceId}, Quantity: ${quantity}`);
      return usage;
    } catch (error) {
      log.error(`Failed to add resource usage: ${error.message}`);
      throw error;
    }
  }
  
  async removeOrderResourceUsage(orderId, resourceId = null) {
    if (!orderId || orderId <= 0) {
      throw new Error('Valid order ID is required');
    }
    
    if (resourceId !== null && (!resourceId || resourceId <= 0)) {
      throw new Error('Valid resource ID is required');
    }
    
    try {
      const removed = await inventoryRepository.removeOrderResourceUsage(orderId, resourceId);
      if (resourceId) {
        log.info(`Removed resource usage: Order ${orderId}, Resource ${resourceId}`);
      } else {
        log.info(`Removed all resource usage for order ${orderId}`);
      }
      return removed;
    } catch (error) {
      log.error(`Failed to remove resource usage: ${error.message}`);
      throw error;
    }
  }
  
  // ==================== ADVANCED OPERATIONS ====================
  
  async consumeResourcesForOrder(orderId, locationId, resourceUsage) {
    if (!orderId || orderId <= 0) {
      throw new Error('Valid order ID is required');
    }
    
    if (!locationId || locationId <= 0) {
      throw new Error('Valid location ID is required');
    }
    
    if (!Array.isArray(resourceUsage) || resourceUsage.length === 0) {
      throw new Error('Resource usage array is required');
    }
    
    try {
      // Record the resource usage for the order
      for (const usage of resourceUsage) {
        await inventoryRepository.addOrderResourceUsage(orderId, usage.resource_id, usage.quantity);
      }
      
      // Consume the resources from inventory
      await inventoryRepository.consumeResources(locationId, resourceUsage);
      
      log.info(`Consumed resources for order ${orderId} at location ${locationId}`);
      return true;
    } catch (error) {
      log.error(`Failed to consume resources for order ${orderId}: ${error.message}`);
      throw error;
    }
  }
  
  async restockResources(locationId, resourceRestock) {
    if (!locationId || locationId <= 0) {
      throw new Error('Valid location ID is required');
    }
    
    if (!Array.isArray(resourceRestock) || resourceRestock.length === 0) {
      throw new Error('Resource restock array is required');
    }
    
    try {
      await inventoryRepository.restockResources(locationId, resourceRestock);
      log.info(`Restocked resources at location ${locationId}`);
      return true;
    } catch (error) {
      log.error(`Failed to restock resources at location ${locationId}: ${error.message}`);
      throw error;
    }
  }
  
  // ==================== ALERTS & MONITORING ====================
  
  async getLowStockItems(threshold = 10) {
    if (isNaN(threshold) || threshold < 0) {
      throw new Error('Threshold must be a non-negative number');
    }
    
    try {
      const lowStockItems = await inventoryRepository.getLowStockItems(threshold);
      log.info(`Found ${lowStockItems.length} low stock items (threshold: ${threshold})`);
      return lowStockItems;
    } catch (error) {
      log.error(`Failed to get low stock items: ${error.message}`);
      throw error;
    }
  }
  
  async getOutOfStockItems() {
    try {
      const outOfStockItems = await inventoryRepository.getOutOfStockItems();
      log.info(`Found ${outOfStockItems.length} out of stock items`);
      return outOfStockItems;
    } catch (error) {
      log.error(`Failed to get out of stock items: ${error.message}`);
      throw error;
    }
  }
  
  async getInventoryAlerts(lowStockThreshold = 10) {
    try {
      const lowStock = await this.getLowStockItems(lowStockThreshold);
      const outOfStock = await this.getOutOfStockItems();
      
      return {
        low_stock: lowStock,
        out_of_stock: outOfStock,
        total_alerts: lowStock.length + outOfStock.length
      };
    } catch (error) {
      log.error(`Failed to get inventory alerts: ${error.message}`);
      throw error;
    }
  }
  
  // ==================== REPORTING ====================
  
  async getInventoryReport(locationId = null) {
    try {
      let inventory;
      if (locationId) {
        inventory = await this.getInventoryByLocation(locationId, true);
      } else {
        inventory = await this.getAllInventory(true);
      }
      
      // Group by location and kind
      const report = {};
      
      for (const item of inventory) {
        const locationName = item.location_name;
        if (!report[locationName]) {
          report[locationName] = {
            location_id: item.location_id,
            location_name: locationName,
            resources: {},
            totals: {
              total_items: 0,
              total_value: 0
            }
          };
        }
        
        const kind = item.kind;
        if (!report[locationName].resources[kind]) {
          report[locationName].resources[kind] = [];
        }
        
        const itemValue = (item.quantity || 0) * (item.unit_cost || 0);
        
        report[locationName].resources[kind].push({
          resource_id: item.resource_id,
          resource_name: item.resource_name,
          quantity: item.quantity,
          unit: item.unit,
          unit_cost: item.unit_cost,
          total_value: itemValue,
          updated_at: item.updated_at
        });
        
        report[locationName].totals.total_items += 1;
        report[locationName].totals.total_value += itemValue;
      }
      
      return report;
    } catch (error) {
      log.error(`Failed to generate inventory report: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new InventoryService(); 