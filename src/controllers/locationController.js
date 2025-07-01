const log = require('../core/logger');
const locationService = require('../services/locationService');

// GET /api/locations
async function getAllLocations(req, res) {
  log.info('GET /api/locations');
  
  try {
    const activeOnly = req.url.includes('?include_inactive=true') ? false : true;
    const locations = await locationService.getAllLocations(activeOnly);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: locations,
      count: locations.length
    }));
  } catch (error) {
    log.error(`Get locations error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to get locations' 
    }));
  }
}

// GET /api/locations/:id
async function getLocationById(req, res) {
  const locationId = extractIdFromUrl(req.url);
  log.info(`GET /api/locations/${locationId}`);
  
  if (!locationId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid location ID' 
    }));
    return;
  }
  
  try {
    const location = await locationService.getLocationById(locationId);
    
    if (location) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        data: location
      }));
    } else {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Location not found' 
      }));
    }
  } catch (error) {
    log.error(`Get location by ID error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to get location' 
    }));
  }
}

// POST /api/locations
async function createLocation(req, res) {
  log.info('POST /api/locations');
  
  try {
    const { name, address, latitude, longitude, timezone } = req.body;
    
    if (!name || !address) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Name and address are required' 
      }));
      return;
    }
    
    const locationData = { name, address, latitude, longitude, timezone };
    const newLocation = await locationService.createLocation(locationData);
    
    res.writeHead(201, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: newLocation,
      message: 'Location created successfully'
    }));
  } catch (error) {
    log.error(`Create location error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to create location' 
    }));
  }
}

// PUT /api/locations/:id
async function updateLocation(req, res) {
  const locationId = extractIdFromUrl(req.url);
  log.info(`PUT /api/locations/${locationId}`);
  
  if (!locationId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid location ID' 
    }));
    return;
  }
  
  try {
    const { name, address, city, latitude, longitude, timezone, is_active } = req.body;
    
    // Build update object dynamically; only include supplied fields
    const locationData = { };
    if (name !== undefined) locationData.name = name;
    if (address !== undefined) locationData.address = address;
    if (city !== undefined) locationData.city = city;
    if (latitude !== undefined) locationData.lat = latitude;
    if (longitude !== undefined) locationData.lon = longitude;
    if (timezone !== undefined) locationData.timezone = timezone;
    if (is_active !== undefined) locationData.is_active = is_active;
    
    if (Object.keys(locationData).length === 0) {
      res.writeHead(400, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: false,
        error: 'No valid fields supplied for update'
      }));
      return;
    }
    
    const updatedLocation = await locationService.updateLocation(locationId, locationData);
    
    if (updatedLocation) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        data: updatedLocation,
        message: 'Location updated successfully'
      }));
    } else {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Location not found' 
      }));
    }
  } catch (error) {
    log.error(`Update location error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to update location' 
    }));
  }
}

// DELETE /api/locations/:id
async function deleteLocation(req, res) {
  const locationId = extractIdFromUrl(req.url);
  log.info(`DELETE /api/locations/${locationId}`);
  
  if (!locationId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid location ID' 
    }));
    return;
  }
  
  try {
    const deleted = await locationService.deleteLocation(locationId);
    
    if (deleted === true) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true,
        message: 'Location deleted successfully' 
      }));
    } else if (deleted === 'soft') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        message: 'Location had related data, marked inactive instead'
      }));
    } else {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Location not found' 
      }));
    }
  } catch (error) {
    log.error(`Delete location error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to delete location' 
    }));
  }
}

// Helper function to extract ID from URL like /api/locations/123
function extractIdFromUrl(url) {
  const match = url.match(/\/api\/locations\/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

module.exports = {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
}; 