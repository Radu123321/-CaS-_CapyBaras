const log = require('../core/logger');
const locationRepository = require('../repositories/locationRepository');

async function createLocation(locationData) {
  const { name, address, latitude, longitude } = locationData;
  
  log.debug(`LocationService: Creating location ${name}`);
  
  try {
    const result = await locationRepository.create({
      name,
      address,
      latitude: latitude || null,
      longitude: longitude || null,
      timezone: 'Europe/Bucharest', // Default timezone
      is_active: true
    });
    
    if (result) {
      log.info(`LocationService: Created location ${name} with ID ${result.location_id}`);
      return {
        location_id: result.location_id,
        name: result.name,
        address: result.address,
        latitude: result.latitude,
        longitude: result.longitude
      };
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
    const results = await locationRepository.findAll({ include_inactive: !activeOnly });
    log.debug(`LocationService: Found ${results.length} locations`);
    
    return results.map(location => ({
      location_id: location.location_id,
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude
    }));
  } catch (error) {
    log.error(`LocationService: Failed to get locations: ${error.message}`);
    throw error;
  }
}

async function getLocationById(locationId) {
  log.debug(`LocationService: Getting location by ID ${locationId}`);
  
  try {
    const result = await locationRepository.findById(locationId);
    
    if (result) {
      return {
        location_id: result.location_id,
        name: result.name,
        address: result.address,
        latitude: result.latitude,
        longitude: result.longitude
      };
    }
    return null;
  } catch (error) {
    log.error(`LocationService: Failed to get location ${locationId}: ${error.message}`);
    throw error;
  }
}

async function updateLocation(locationId, locationData) {
  log.debug(`LocationService: Updating location ${locationId}`);
  
  try {
    const result = await locationRepository.update(locationId, {
      name: locationData.name,
      address: locationData.address
    });
    
    if (result) {
      log.info(`LocationService: Updated location ${locationId}`);
      return {
        location_id: result.location_id,
        name: result.name,
        address: result.address,
        latitude: result.latitude,
        longitude: result.longitude
      };
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