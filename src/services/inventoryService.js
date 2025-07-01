const repo = require('../repositories/inventoryRepository');

module.exports = {
  listStock: branchId => repo.listStock(branchId),
  addTransaction: tx => repo.addTransaction(tx),
  getAllResources: () => repo.getAllResources(),
  getResourceById: id => repo.getResourceById(id),
  createResource: data => repo.createResource(data),
  updateResource: (id, data) => repo.updateResource(id, data),
  deleteResource: id => repo.deleteResource(id),
  getAllInventory: async (includeZero) => {
    try {
      return await repo.getAllInventory(includeZero);
    } catch (e) {
      return [];
    }
  },
  getInventoryByLocation: (loc, includeZero) => repo.getInventoryByLocation(loc, includeZero),
  getInventoryByResource: rid => repo.getInventoryByResource(rid),
  getInventoryItem: (loc, rid) => repo.getInventoryItem(loc, rid),
  updateInventoryQuantity: (loc, rid, qty) => repo.updateInventoryQuantity(loc, rid, qty),
  adjustInventoryQuantity: (loc, rid, delta) => repo.adjustInventoryQuantity(loc, rid, delta),
  consumeResourcesForOrder: (orderId, branchId, usage) => repo.consumeResources(branchId, usage),
  restockResources: (branchId, restock) => repo.restockResources(branchId, restock),
  getLowStockItems: async (t) => {
    try {
      return await repo.getLowStockItems(t);
    } catch (e) {
      return [];
    }
  },
  getOutOfStockItems: () => repo.getOutOfStockItems(),
  getInventoryAlerts: t => repo.getLowStockItems(t)
}; 