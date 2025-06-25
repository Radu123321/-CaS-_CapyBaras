const log = require('../core/logger');
const employeeService = require('../services/employeeService');
const url = require('url');

// GET /api/employees
async function getAllEmployees(req, res) {
  log.info('GET /api/employees');
  
  try {
    // Parse query parameters for filtering
    const parsedUrl = url.parse(req.url, true);
    const filters = {
      location_id: parsedUrl.query.location_id ? parseInt(parsedUrl.query.location_id) : null,
      position: parsedUrl.query.position,
      is_active: parsedUrl.query.is_active !== undefined ? parsedUrl.query.is_active === 'true' : null,
      is_available: parsedUrl.query.is_available !== undefined ? parsedUrl.query.is_available === 'true' : null,
      skills: parsedUrl.query.skills ? parsedUrl.query.skills.split(',') : null,
      page: parseInt(parsedUrl.query.page) || 1,
      limit: parseInt(parsedUrl.query.limit) || 20
    };
    
    // Remove null/undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    const employees = await employeeService.getAllEmployees(filters);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: employees,
      count: employees.length
    }));
  } catch (error) {
    log.error(`Get employees error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to get employees' 
    }));
  }
}

// GET /api/employees/:id
async function getEmployeeById(req, res) {
  const employeeId = extractIdFromUrl(req.url);
  log.info(`GET /api/employees/${employeeId}`);
  
  if (!employeeId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid employee ID' 
    }));
    return;
  }
  
  try {
    const employee = await employeeService.getEmployeeById(employeeId);
    
    if (employee) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        data: employee
      }));
    } else {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Employee not found' 
      }));
    }
  } catch (error) {
    log.error(`Get employee by ID error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to get employee' 
    }));
  }
}

// GET /api/employees/code/:code
async function getEmployeeByCode(req, res) {
  const employeeCode = extractCodeFromUrl(req.url);
  log.info(`GET /api/employees/code/${employeeCode}`);
  
  if (!employeeCode) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid employee code' 
    }));
    return;
  }
  
  try {
    const employee = await employeeService.getEmployeeByCode(employeeCode);
    
    if (employee) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        data: employee
      }));
    } else {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Employee not found' 
      }));
    }
  } catch (error) {
    log.error(`Get employee by code error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to get employee' 
    }));
  }
}

// GET /api/employees/position/:position
async function getEmployeesByPosition(req, res) {
  const position = extractPositionFromUrl(req.url);
  log.info(`GET /api/employees/position/${position}`);
  
  if (!position) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid position',
      validPositions: employeeService.VALID_POSITIONS
    }));
    return;
  }
  
  try {
    const employees = await employeeService.getEmployeesByPosition(position);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: employees,
      count: employees.length
    }));
  } catch (error) {
    log.error(`Get employees by position error: ${error.message}`);
    
    if (error.message.includes('Invalid position')) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: error.message,
        validPositions: employeeService.VALID_POSITIONS
      }));
    } else {
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Failed to get employees by position' 
      }));
    }
  }
}

// GET /api/employees/location/:locationId
async function getEmployeesByLocation(req, res) {
  const locationId = extractLocationIdFromUrl(req.url);
  log.info(`GET /api/employees/location/${locationId}`);
  
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
    const employees = await employeeService.getEmployeesByLocation(locationId);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: employees,
      count: employees.length
    }));
  } catch (error) {
    log.error(`Get employees by location error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to get employees by location' 
    }));
  }
}

// GET /api/employees/available/:locationId
async function getAvailableEmployees(req, res) {
  const locationId = extractLocationIdFromUrl(req.url, 'available');
  log.info(`GET /api/employees/available/${locationId}`);
  
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
    const employees = await employeeService.getAvailableEmployees(locationId);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: employees,
      count: employees.length
    }));
  } catch (error) {
    log.error(`Get available employees error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to get available employees' 
    }));
  }
}

// GET /api/employees/search
async function searchEmployees(req, res) {
  log.info('GET /api/employees/search');
  
  try {
    const parsedUrl = url.parse(req.url, true);
    const searchTerm = parsedUrl.query.q;
    
    if (!searchTerm) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Search term is required' 
      }));
      return;
    }
    
    const filters = {
      location_id: parsedUrl.query.location_id ? parseInt(parsedUrl.query.location_id) : null,
      position: parsedUrl.query.position,
      is_active: parsedUrl.query.is_active !== undefined ? parsedUrl.query.is_active === 'true' : null,
      page: parseInt(parsedUrl.query.page) || 1,
      limit: parseInt(parsedUrl.query.limit) || 20
    };
    
    // Remove null/undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    const employees = await employeeService.searchEmployees(searchTerm, filters);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      data: employees,
      count: employees.length,
      searchTerm
    }));
  } catch (error) {
    log.error(`Search employees error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to search employees' 
    }));
  }
}

// POST /api/employees
async function createEmployee(req, res) {
  log.info('POST /api/employees');
  
  try {
    const { 
      user_id, 
      location_id,
      employee_code,
      position, 
      hourly_rate, 
      hire_date,
      skills
    } = req.body;
    
    if (!user_id || !location_id) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'user_id and location_id are required'
      }));
      return;
    }
    
    const employeeData = { 
      user_id, 
      location_id,
      employee_code: employee_code?.trim() || null,
      position: position || 'EMPLOYEE',
      hourly_rate: hourly_rate ? parseFloat(hourly_rate) : 15.00,
      hire_date: hire_date ? new Date(hire_date) : new Date(),
      skills: Array.isArray(skills) ? skills : (skills ? [skills] : [])
    };
    
    const newEmployee = await employeeService.createEmployee(employeeData);
    
    res.writeHead(201, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Employee created successfully',
      data: newEmployee
    }));
  } catch (error) {
    log.error(`Create employee error: ${error.message}`);
    
    let statusCode = 500;
    let errorMessage = 'Failed to create employee';
    
    if (error.message === 'User not found') {
      statusCode = 404;
      errorMessage = 'User not found';
    } else if (error.message === 'Location not found') {
      statusCode = 404;
      errorMessage = 'Location not found';
    } else if (error.message === 'Employee already exists for this user') {
      statusCode = 409;
      errorMessage = 'Employee already exists for this user';
    } else if (error.message.includes('required')) {
      statusCode = 400;
      errorMessage = error.message;
    }
    
    res.writeHead(statusCode, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: errorMessage
    }));
  }
}

// PUT /api/employees/:id
async function updateEmployee(req, res) {
  const employeeId = extractIdFromUrl(req.url);
  log.info(`PUT /api/employees/${employeeId}`);
  
  if (!employeeId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid employee ID' 
    }));
    return;
  }
  
  try {
    const { 
      position, 
      hourly_rate, 
      skills,
      is_available,
      is_active 
    } = req.body;
    
    const employeeData = { 
      position: position?.trim() || null,
      hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
      skills: Array.isArray(skills) ? skills : (skills ? [skills] : null),
      is_available: is_available !== undefined ? is_available : null,
      is_active: is_active !== undefined ? is_active : null
    };
    
    // Remove null/undefined values
    Object.keys(employeeData).forEach(key => {
      if (employeeData[key] === null || employeeData[key] === undefined) {
        delete employeeData[key];
      }
    });
    
    const updatedEmployee = await employeeService.updateEmployee(employeeId, employeeData);
    
    if (updatedEmployee) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        message: 'Employee updated successfully',
        data: updatedEmployee
      }));
    } else {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Employee not found' 
      }));
    }
  } catch (error) {
    log.error(`Update employee error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to update employee' 
    }));
  }
}

// DELETE /api/employees/:id
async function deleteEmployee(req, res) {
  const employeeId = extractIdFromUrl(req.url);
  log.info(`DELETE /api/employees/${employeeId}`);
  
  if (!employeeId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid employee ID' 
    }));
    return;
  }
  
  try {
    const deleted = await employeeService.deleteEmployee(employeeId);
    
    if (deleted) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true,
        message: 'Employee deactivated successfully' 
      }));
    } else {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Employee not found' 
      }));
    }
  } catch (error) {
    log.error(`Delete employee error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to delete employee' 
    }));
  }
}

// POST /api/employees/:id/skills
async function addSkill(req, res) {
  const employeeId = extractIdFromUrl(req.url);
  log.info(`POST /api/employees/${employeeId}/skills`);
  
  if (!employeeId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid employee ID' 
    }));
    return;
  }
  
  try {
    const { skill } = req.body;
    
    if (!skill) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Skill is required' 
      }));
      return;
    }
    
    const updatedEmployee = await employeeService.addSkill(employeeId, skill.trim());
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Skill added successfully',
      data: updatedEmployee
    }));
  } catch (error) {
    log.error(`Add skill error: ${error.message}`);
    
    let statusCode = 500;
    let errorMessage = 'Failed to add skill';
    
    if (error.message === 'Employee not found') {
      statusCode = 404;
      errorMessage = 'Employee not found';
    }
    
    res.writeHead(statusCode, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }));
  }
}

// DELETE /api/employees/:id/skills/:skill
async function removeSkill(req, res) {
  const employeeId = extractIdFromUrl(req.url);
  const skill = extractSkillFromUrl(req.url);
  log.info(`DELETE /api/employees/${employeeId}/skills/${skill}`);
  
  if (!employeeId || !skill) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid employee ID or skill' 
    }));
    return;
  }
  
  try {
    const updatedEmployee = await employeeService.removeSkill(employeeId, decodeURIComponent(skill));
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Skill removed successfully',
      data: updatedEmployee
    }));
  } catch (error) {
    log.error(`Remove skill error: ${error.message}`);
    
    let statusCode = 500;
    let errorMessage = 'Failed to remove skill';
    
    if (error.message === 'Employee not found') {
      statusCode = 404;
      errorMessage = 'Employee not found';
    }
    
    res.writeHead(statusCode, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }));
  }
}

// PUT /api/employees/:id/availability
async function updateAvailability(req, res) {
  const employeeId = extractIdFromUrl(req.url);
  log.info(`PUT /api/employees/${employeeId}/availability`);
  
  if (!employeeId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid employee ID' 
    }));
    return;
  }
  
  try {
    const { is_available } = req.body;
    
    if (is_available === undefined || is_available === null) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'is_available is required' 
      }));
      return;
    }
    
    const updatedEmployee = await employeeService.updateAvailability(employeeId, is_available);
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Availability updated successfully',
      data: updatedEmployee
    }));
  } catch (error) {
    log.error(`Update availability error: ${error.message}`);
    
    let statusCode = 500;
    let errorMessage = 'Failed to update availability';
    
    if (error.message === 'Employee not found') {
      statusCode = 404;
      errorMessage = 'Employee not found';
    }
    
    res.writeHead(statusCode, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }));
  }
}

// GET /api/employees/:id/stats
async function getEmployeeStats(req, res) {
  const employeeId = extractIdFromUrl(req.url);
  log.info(`GET /api/employees/${employeeId}/stats`);
  
  if (!employeeId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Invalid employee ID' 
    }));
    return;
  }
  
  try {
    const stats = await employeeService.getEmployeeStats(employeeId);
    
    if (stats) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        data: stats
      }));
    } else {
      res.writeHead(404, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Employee not found' 
      }));
    }
  } catch (error) {
    log.error(`Get employee stats error: ${error.message}`);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Failed to get employee stats' 
    }));
  }
}

// Helper function to extract ID from URL like /api/employees/123
function extractIdFromUrl(url) {
  const match = url.match(/\/api\/employees\/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Helper function to extract code from URL like /api/employees/code/EMP123
function extractCodeFromUrl(url) {
  const match = url.match(/\/api\/employees\/code\/([A-Za-z0-9]+)/);
  return match ? match[1] : null;
}

// Helper function to extract position from URL like /api/employees/position/MANAGER
function extractPositionFromUrl(url) {
  const match = url.match(/\/api\/employees\/position\/([A-Z_]+)/);
  return match ? match[1] : null;
}

// Helper function to extract location ID from URL like /api/employees/location/123
function extractLocationIdFromUrl(url, prefix = 'location') {
  const match = url.match(new RegExp(`\\/api\\/employees\\/${prefix}\\/(\\d+)`));
  return match ? parseInt(match[1]) : null;
}

// Helper function to extract skill from URL like /api/employees/123/skills/CLEANING
function extractSkillFromUrl(url) {
  const match = url.match(/\/api\/employees\/\d+\/skills\/([^\/]+)/);
  return match ? match[1] : null;
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  getEmployeeByCode,
  getEmployeesByPosition,
  getEmployeesByLocation,
  getAvailableEmployees,
  searchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  addSkill,
  removeSkill,
  updateAvailability,
  getEmployeeStats
}; 