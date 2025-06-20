const log = require('../core/logger');
const locationRepository = require('../repositories/locationRepository');

async function createLocation(locationData) {
  const { name } = locationData;
  
  log.debug(`LocationService: Creating location ${name}`);
  
  try {
    const result = await locationRepository.create(locationData);
    
    if (result) {
      log.info(`LocationService: Created location ${name} with ID ${result.location_id}`);
      return result;
    } else {
      throw new Error('Failed to create location');
    }
  } catch (error) {
    log.error(`LocationService: Failed to create location ${name}: ${error.message}`);
    throw error;
  }
}

async function getAllLocations(activeOnly = true) {
  log.debug(`LocationService: Getting all locations (activeOnly: ${activeOnly})`);
  
  try {
    const result = await locationRepository.findAll({ include_inactive: !activeOnly });
    log.debug(`LocationService: Found ${result.length} locations`);
    return result;
  } catch (error) {
    log.error(`LocationService: Failed to get locations: ${error.message}`);
    throw error;
  }
}

async function getLocationById(locationId) {
  log.debug(`LocationService: Getting location by ID ${locationId}`);
  
  try {
    const result = await locationRepository.findById(locationId);
    return result;
  } catch (error) {
    log.error(`LocationService: Failed to get location ${locationId}: ${error.message}`);
    throw error;
  }
}

async function updateLocation(locationId, locationData) {
  log.debug(`LocationService: Updating location ${locationId}`);
  
  try {
    const result = await locationRepository.update(locationId, locationData);
    
    if (result) {
      log.info(`LocationService: Updated location ${locationId}`);
      return result;
    } else {
      return null;
    }
  } catch (error) {
    log.error(`LocationService: Failed to update location ${locationId}: ${error.message}`);
    throw error;
  }
}

async function deleteLocation(locationId) {
  log.debug(`LocationService: Deleting location ${locationId}`);
  
  try {
    const result = await locationRepository.delete(locationId);
    
    if (result) {
      log.info(`LocationService: Deleted (deactivated) location ${locationId}`);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    log.error(`LocationService: Failed to delete location ${locationId}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation
}; 