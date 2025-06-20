const log = require('../core/logger');
const serviceService = require('../services/serviceService');

// Valid service types from schema
const VALID_SERVICE_TYPES = ['CARPET', 'CAR_WASH', 'GARMENT', 'OTHER'];

// GET /api/services
async function getAllServices(req, res) {
  log.info('GET /api/services');
  
  try {
    const services = await serviceService.getAllServices();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(services));
  } catch (error) {
    log.error(`Get services error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to get services' }));
  }
}

// GET /api/services/:id
async function getServiceById(req, res) {
  const serviceId = extractIdFromUrl(req.url);
  log.info(`GET /api/services/${serviceId}`);
  
  if (!serviceId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid service ID' }));
    return;
  }
  
  try {
    const service = await serviceService.getServiceById(serviceId);
    
    if (service) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(service));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Service not found' }));
    }
  } catch (error) {
    log.error(`Get service by ID error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to get service' }));
  }
}

// POST /api/services
async function createService(req, res) {
  log.info('POST /api/services');
  
  try {
    const { service_type, description, base_price } = req.body;
    
    if (!service_type || !description || base_price === undefined) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'service_type, description and base_price are required' }));
      return;
    }
    
    if (!VALID_SERVICE_TYPES.includes(service_type)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Invalid service_type. Must be one of: ${VALID_SERVICE_TYPES.join(', ')}` }));
      return;
    }
    
    if (isNaN(base_price) || base_price < 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'base_price must be a positive number' }));
      return;
    }
    
    const serviceData = { service_type, description, base_price: parseFloat(base_price) };
    const newService = await serviceService.createService(serviceData);
    
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(newService));
  } catch (error) {
    log.error(`Create service error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to create service' }));
  }
}

// PUT /api/services/:id
async function updateService(req, res) {
  const serviceId = extractIdFromUrl(req.url);
  log.info(`PUT /api/services/${serviceId}`);
  
  if (!serviceId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid service ID' }));
    return;
  }
  
  try {
    const { service_type, description, base_price } = req.body;
    
    if (!service_type || !description || base_price === undefined) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'service_type, description and base_price are required' }));
      return;
    }
    
    if (!VALID_SERVICE_TYPES.includes(service_type)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Invalid service_type. Must be one of: ${VALID_SERVICE_TYPES.join(', ')}` }));
      return;
    }
    
    if (isNaN(base_price) || base_price < 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'base_price must be a positive number' }));
      return;
    }
    
    const serviceData = { service_type, description, base_price: parseFloat(base_price) };
    const updatedService = await serviceService.updateService(serviceId, serviceData);
    
    if (updatedService) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(updatedService));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Service not found' }));
    }
  } catch (error) {
    log.error(`Update service error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to update service' }));
  }
}

// DELETE /api/services/:id
async function deleteService(req, res) {
  const serviceId = extractIdFromUrl(req.url);
  log.info(`DELETE /api/services/${serviceId}`);
  
  if (!serviceId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid service ID' }));
    return;
  }
  
  try {
    const deleted = await serviceService.deleteService(serviceId);
    
    if (deleted) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Service deleted successfully' }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Service not found' }));
    }
  } catch (error) {
    log.error(`Delete service error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to delete service' }));
  }
}

// Helper function to extract ID from URL like /api/services/123
function extractIdFromUrl(url) {
  const match = url.match(/\/api\/services\/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
}; 