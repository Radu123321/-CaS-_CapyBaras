const log = require('../core/logger');
const inventoryService = require('../services/inventoryService');
const { parseRequest } = require('../core/json');

// ==================== RESOURCES ====================

// GET /api/resources
async function getAllResources(req, res) {
  log.info('GET /api/resources');
  
  try {
    const resources = await inventoryService.getAllResources();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: resources
    }));
  } catch (error) {
    log.error(`Get resources error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Failed to get resources' 
    }));
  }
}

// POST /api/resources
async function createResource(req, res) {
  log.info('POST /api/resources');
  
  try {
    const { name, kind, unit, unit_cost } = req.body;
    
    if (!name || !kind || !unit) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: 'name, kind, and unit are required' 
      }));
      return;
    }
    
    const resourceData = { name, kind, unit, unit_cost };
    const newResource = await inventoryService.createResource(resourceData);
    
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: newResource
    }));
  } catch (error) {
    log.error(`Create resource error: ${error.message}`);
    
    if (error.message.includes('Invalid resource kind')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: 'Failed to create resource' 
      }));
    }
  }
}

// ==================== INVENTORY ====================

// GET /api/inventory
async function getAllInventory(req, res) {
  log.info('GET /api/inventory');
  
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const includeZero = url.searchParams.get('include_zero') === 'true';
    
    const inventory = await inventoryService.getAllInventory(includeZero);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: inventory
    }));
  } catch (error) {
    log.error(`Get inventory error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Failed to get inventory' 
    }));
  }
}

// GET /api/inventory/location/:locationId
async function getInventoryByLocation(req, res) {
  const locationId = extractIdFromUrl(req.url, 'location');
  log.info(`GET /api/inventory/location/${locationId}`);
  
  if (!locationId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Invalid location ID' 
    }));
    return;
  }
  
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const includeZero = url.searchParams.get('include_zero') === 'true';
    
    const inventory = await inventoryService.getInventoryByLocation(locationId, includeZero);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: inventory
    }));
  } catch (error) {
    log.error(`Get inventory by location error: ${error.message}`);
    
    if (error.message === 'Valid location ID is required') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: 'Failed to get inventory' 
      }));
    }
  }
}

// PUT /api/inventory/location/:locationId/resource/:resourceId
async function updateInventoryQuantity(req, res) {
  const locationId = extractIdFromUrl(req.url, 'location');
  const resourceId = extractIdFromUrl(req.url, 'resource');
  log.info(`PUT /api/inventory/location/${locationId}/resource/${resourceId}`);
  
  if (!locationId || !resourceId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Invalid location ID or resource ID' 
    }));
    return;
  }
  
  try {
    const { quantity } = req.body;
    
    if (quantity === undefined || isNaN(quantity) || quantity < 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: 'Valid non-negative quantity is required' 
      }));
      return;
    }
    
    const updatedItem = await inventoryService.updateInventoryQuantity(locationId, resourceId, quantity);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: updatedItem
    }));
  } catch (error) {
    log.error(`Update inventory quantity error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Failed to update inventory quantity' 
    }));
  }
}

// POST /api/inventory/location/:locationId/restock
async function restockResources(req, res) {
  const locationId = extractIdFromUrl(req.url, 'location');
  log.info(`POST /api/inventory/location/${locationId}/restock`);
  
  if (!locationId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Invalid location ID' 
    }));
    return;
  }
  
  try {
    const { resources } = req.body;
    
    if (!Array.isArray(resources) || resources.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: 'Resources array is required' 
      }));
      return;
    }
    
    // Validate each resource item
    for (const resource of resources) {
      if (!resource.resource_id || !resource.quantity || resource.quantity <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Each resource must have resource_id and positive quantity' 
        }));
        return;
      }
    }
    
    await inventoryService.restockResources(locationId, resources);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: `Successfully restocked ${resources.length} resources at location ${locationId}`
    }));
  } catch (error) {
    log.error(`Restock resources error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Failed to restock resources' 
    }));
  }
}

// POST /api/inventory/consume
async function consumeResourcesForOrder(req, res) {
  log.info('POST /api/inventory/consume');
  
  try {
    const { order_id, location_id, resources } = req.body;
    
    if (!order_id || !location_id || !Array.isArray(resources) || resources.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: 'order_id, location_id, and resources array are required' 
      }));
      return;
    }
    
    // Validate each resource item
    for (const resource of resources) {
      if (!resource.resource_id || !resource.quantity || resource.quantity <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Each resource must have resource_id and positive quantity' 
        }));
        return;
      }
    }
    
    await inventoryService.consumeResourcesForOrder(order_id, location_id, resources);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: `Successfully consumed ${resources.length} resources for order ${order_id}`
    }));
  } catch (error) {
    log.error(`Consume resources error: ${error.message}`);
    
    if (error.message.includes('Insufficient inventory')) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: 'Failed to consume resources' 
      }));
    }
  }
}

// ==================== ALERTS & MONITORING ====================

// GET /api/inventory/alerts
async function getInventoryAlerts(req, res) {
  log.info('GET /api/inventory/alerts');
  
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const threshold = parseInt(url.searchParams.get('threshold')) || 10;
    
    const alerts = await inventoryService.getInventoryAlerts(threshold);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: alerts
    }));
  } catch (error) {
    log.error(`Get inventory alerts error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Failed to get inventory alerts' 
    }));
  }
}

// GET /api/inventory/low-stock
async function getLowStockItems(req, res) {
  log.info('GET /api/inventory/low-stock');
  
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const threshold = parseInt(url.searchParams.get('threshold')) || 10;
    
    const lowStockItems = await inventoryService.getLowStockItems(threshold);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: lowStockItems,
      threshold: threshold
    }));
  } catch (error) {
    log.error(`Get low stock items error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Failed to get low stock items' 
    }));
  }
}

// ==================== HELPER FUNCTIONS ====================

function extractIdFromUrl(url, type) {
  let match;
  
  if (type === 'location') {
    match = url.match(/\/api\/inventory\/location\/(\d+)/);
  } else if (type === 'resource') {
    match = url.match(/\/resource\/(\d+)/);
  }
  
  return match ? parseInt(match[1]) : null;
}

async function readRawBody(req){
  return new Promise((resolve,reject)=>{
    let chunks=[];
    req.on('data',c=>chunks.push(c));
    req.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error',reject);
  });
}

// GET /api/inventory/export/:id
async function exportInventoryCsv(req,res){
  const branchId = extractIdFromUrl(req.url,'location') || req.params.id;
  if(!branchId){return res.status(400).json({success:false,error:'Branch id required'});}  
  try{
    const data = await inventoryService.getInventoryByLocation(branchId,true);
    const rows = data.rows || data;
    let csv='item_code,qty_on_hand,expire_date\n';
    rows.forEach(r=>{csv+=`${r.item_code},${r.qty_on_hand},${r.expire_date||''}\n`;});
    res.writeHead(200,{'Content-Type':'text/csv','Content-Disposition':`attachment; filename=inventory_${branchId}.csv`});
    res.end(csv);
  }catch(e){
    log.error(e);
    res.status(500).json({success:false,error:'export failed'});
  }
}

// POST /api/inventory/import/:id
async function importInventoryCsv(req,res){
  const branchId = req.params.id || extractIdFromUrl(req.url,'location');
  if(!branchId) return res.status(400).json({success:false,error:'Branch id required'});
  try{
    const raw = await readRawBody(req);
    const lines = raw.trim().split(/\r?\n/);
    if(lines.length<2){
      return res.status(400).json({success:false,error:'CSV empty'});
    }

    let imported = 0;
    for(let i=1;i<lines.length;i++){
      const [code,qtyStr,exp] = lines[i].split(',');
      const qty = parseFloat(qtyStr);
      if(!code || isNaN(qty) || qty===0) continue;

      try{
        await inventoryService.addTransaction({
          branchId: parseInt(branchId),
          itemCode: code.trim(),
          qtyDelta: qty,
          expireDate: exp ? (exp.trim()||null) : null,
          reason: 'RESTOCK',
          userId: req.user?.id || null
        });
        imported++;
      }catch(txErr){
        log.error(`Import row failed (${code}): ${txErr.message}`);
      }
    }

    res.json({success:true,imported});
  }catch(e){
    log.error(e);
    res.status(500).json({success:false,error:'import failed'});
  }
}

module.exports = {
  getAllResources,
  createResource,
  getAllInventory,
  getInventoryByLocation,
  updateInventoryQuantity,
  restockResources,
  consumeResourcesForOrder,
  getInventoryAlerts,
  getLowStockItems,
  exportInventoryCsv,
  importInventoryCsv
}; 