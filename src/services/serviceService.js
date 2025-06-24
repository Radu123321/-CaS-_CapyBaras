const log = require('../core/logger');
const serviceRepository = require('../repositories/serviceRepository');

async function createService(serviceData) {
  const { service_type, description, base_price } = serviceData;
  
  log.debug(`ServiceService: Creating service ${service_type}`);
  
  try {
    const result = await serviceRepository.create({
      service_type,
      description,
      base_price,
      is_active: true
    });
    
    if (result) {
      log.info(`ServiceService: Created service ${service_type} with ID ${result.service_id}`);
      return {
        service_id: result.service_id,
        service_type: result.service_type,
        description: result.description,
        base_price: result.base_price
      };
    } else {
      throw new Error('Failed to create service');
    }
  } catch (error) {
    log.error(`ServiceService: Failed to create service ${service_type}: ${error.message}`);
    throw error;
  }
}

async function getAllServices() {
  log.debug('ServiceService: Getting all services');
  
  try {
    const results = await serviceRepository.findAll();
    log.debug(`ServiceService: Found ${results.length} services`);
    
    return results.map(service => ({
      service_id: service.service_id,
      service_type: service.service_type,
      description: service.description,
      base_price: service.base_price
    }));
  } catch (error) {
    log.error(`ServiceService: Failed to get services: ${error.message}`);
    throw error;
  }
}

async function getServiceById(serviceId) {
  log.debug(`ServiceService: Getting service by ID ${serviceId}`);
  
  try {
    const result = await serviceRepository.findById(serviceId);
    
    if (result) {
      return {
        service_id: result.service_id,
        service_type: result.service_type,
        description: result.description,
        base_price: result.base_price
      };
    }
    return null;
  } catch (error) {
    log.error(`ServiceService: Failed to get service ${serviceId}: ${error.message}`);
    throw error;
  }
}

async function updateService(serviceId, serviceData) {
  log.debug(`ServiceService: Updating service ${serviceId}`);
  
  try {
    const result = await serviceRepository.update(serviceId, {
      description: serviceData.description,
      base_price: serviceData.base_price
    });
    
    if (result) {
      log.info(`ServiceService: Updated service ${serviceId}`);
      return {
        service_id: result.service_id,
        service_type: result.service_type,
        description: result.description,
        base_price: result.base_price
      };
    } else {
      return null;
    }
  } catch (error) {
    log.error(`ServiceService: Failed to update service ${serviceId}: ${error.message}`);
    throw error;
  }
}

async function deleteService(serviceId) {
  log.debug(`ServiceService: Deleting service ${serviceId}`);
  
  try {
    const result = await serviceRepository.delete(serviceId);
    
    if (result) {
      log.info(`ServiceService: Deleted service ${serviceId}`);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    log.error(`ServiceService: Failed to delete service ${serviceId}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService
}; 