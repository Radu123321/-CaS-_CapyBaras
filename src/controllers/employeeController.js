const log = require('../core/logger');
const employeeService = require('../services/employeeService');
const url = require('url');

// GET /api/employees
async function getAllEmployees(req, res) {
  log.info('GET /api/employees');
  
  try {
    const parsedUrl = url.parse(req.url, true);
    const includeInactive = parsedUrl.query.include_inactive === 'true';
    
    const employees = await employeeService.getAllEmployees(includeInactive);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(employees));
  } catch (error) {
    log.error(`Get employees error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to get employees' }));
  }
}

// GET /api/employees/:id
async function getEmployeeById(req, res) {
  const employeeId = extractIdFromUrl(req.url);
  log.info(`GET /api/employees/${employeeId}`);
  
  if (!employeeId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid employee ID' }));
    return;
  }
  
  try {
    const employee = await employeeService.getEmployeeById(employeeId);
    
    if (employee) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(employee));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Employee not found' }));
    }
  } catch (error) {
    log.error(`Get employee by ID error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to get employee' }));
  }
}

// GET /api/employees/type/:type
async function getEmployeesByType(req, res) {
  const employeeType = extractTypeFromUrl(req.url);
  log.info(`GET /api/employees/type/${employeeType}`);
  
  if (!employeeType) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Invalid employee type',
      validTypes: employeeService.VALID_EMPLOYEE_TYPES
    }));
    return;
  }
  
  try {
    const employees = await employeeService.getEmployeesByType(employeeType);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(employees));
  } catch (error) {
    log.error(`Get employees by type error: ${error.message}`);
    
    if (error.message.includes('Invalid employee type')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: error.message,
        validTypes: employeeService.VALID_EMPLOYEE_TYPES
      }));
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to get employees by type' }));
    }
  }
}

// POST /api/employees
async function createEmployee(req, res) {
  log.info('POST /api/employees');
  
  try {
    const { user_id, employee_type, hire_date, salary } = req.body;
    
    if (!user_id || !employee_type) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'user_id and employee_type are required',
        validTypes: employeeService.VALID_EMPLOYEE_TYPES
      }));
      return;
    }
    
    const employeeData = { user_id, employee_type, hire_date, salary };
    const newEmployee = await employeeService.createEmployee(employeeData);
    
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(newEmployee));
  } catch (error) {
    log.error(`Create employee error: ${error.message}`);
    
    if (error.message === 'User not found') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'User not found' }));
    } else if (error.message === 'Employee already exists for this user') {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Employee already exists for this user' }));
    } else if (error.message.includes('Invalid employee type')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: error.message,
        validTypes: employeeService.VALID_EMPLOYEE_TYPES
      }));
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create employee' }));
    }
  }
}

// PUT /api/employees/:id
async function updateEmployee(req, res) {
  const employeeId = extractIdFromUrl(req.url);
  log.info(`PUT /api/employees/${employeeId}`);
  
  if (!employeeId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid employee ID' }));
    return;
  }
  
  try {
    const { employee_type, hire_date, salary, is_active } = req.body;
    
    const employeeData = { employee_type, hire_date, salary, is_active };
    const updatedEmployee = await employeeService.updateEmployee(employeeId, employeeData);
    
    if (updatedEmployee) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(updatedEmployee));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Employee not found' }));
    }
  } catch (error) {
    log.error(`Update employee error: ${error.message}`);
    
    if (error.message.includes('Invalid employee type')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: error.message,
        validTypes: employeeService.VALID_EMPLOYEE_TYPES
      }));
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update employee' }));
    }
  }
}

// DELETE /api/employees/:id
async function deleteEmployee(req, res) {
  const employeeId = extractIdFromUrl(req.url);
  log.info(`DELETE /api/employees/${employeeId}`);
  
  if (!employeeId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid employee ID' }));
    return;
  }
  
  try {
    const deleted = await employeeService.deleteEmployee(employeeId);
    
    if (deleted) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Employee deactivated successfully' }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Employee not found' }));
    }
  } catch (error) {
    log.error(`Delete employee error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to delete employee' }));
  }
}

// Helper function to extract ID from URL like /api/employees/123
function extractIdFromUrl(url) {
  const match = url.match(/\/api\/employees\/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Helper function to extract type from URL like /api/employees/type/CLEANER
function extractTypeFromUrl(url) {
  const match = url.match(/\/api\/employees\/type\/([A-Z_]+)/);
  return match ? match[1] : null;
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  getEmployeesByType,
  createEmployee,
  updateEmployee,
  deleteEmployee
}; 