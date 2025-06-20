const employeeRepository = require('../repositories/employeeRepository');
const log = require('../core/logger');

// Valid employee types from schema
const VALID_EMPLOYEE_TYPES = ['CLEANER', 'DRIVER', 'ADMIN', 'MANAGER'];

async function createEmployee(employeeData) {
  const { user_id, employee_type, hire_date, salary } = employeeData;
  
  log.debug(`EmployeeService: Creating employee for user ${user_id}`);
  
  if (!user_id || !employee_type || !hire_date || !salary) {
    throw new Error('user_id, employee_type, hire_date, and salary are required');
  }
  
  // Validate employee type
  if (!employeeRepository.isValidEmployeeType(employee_type)) {
    throw new Error('Invalid employee type. Must be one of: CLEANER, DRIVER, ADMIN, MANAGER');
  }
  
  try {
    // Check if employee already exists for this user
    const existingEmployee = await employeeRepository.findByUserId(user_id);
    
    if (existingEmployee) {
      throw new Error('Employee already exists for this user');
    }
    
    const result = await employeeRepository.create(employeeData);
    
    if (result) {
      log.info(`EmployeeService: Created employee ${result.employee_id} for user ${user_id}`);
      return result;
    } else {
      throw new Error('Failed to create employee');
    }
  } catch (error) {
    log.error(`EmployeeService: Failed to create employee: ${error.message}`);
    
    // Handle foreign key constraint
    if (error.code === '23503' && error.constraint === 'employees_user_id_fkey') {
      throw new Error('User not found');
    }
    
    throw error;
  }
}

async function getAllEmployees(includeInactive = false) {
  log.debug(`EmployeeService: Getting all employees (includeInactive: ${includeInactive})`);
  
  try {
    const result = await employeeRepository.findAll(includeInactive);
    log.debug(`EmployeeService: Found ${result.length} employees`);
    return result;
  } catch (error) {
    log.error(`EmployeeService: Failed to get employees: ${error.message}`);
    throw error;
  }
}

async function getEmployeeById(employeeId) {
  log.debug(`EmployeeService: Getting employee by ID ${employeeId}`);
  
  try {
    return await employeeRepository.findById(employeeId);
  } catch (error) {
    log.error(`EmployeeService: Failed to get employee ${employeeId}: ${error.message}`);
    throw error;
  }
}

async function getEmployeeByUserId(userId) {
  log.debug(`EmployeeService: Getting employee by user ID ${userId}`);
  
  try {
    return await employeeRepository.findByUserId(userId);
  } catch (error) {
    log.error(`EmployeeService: Failed to get employee by user ID ${userId}: ${error.message}`);
    throw error;
  }
}

async function getEmployeesByType(employeeType) {
  log.debug(`EmployeeService: Getting employees by type ${employeeType}`);
  
  // Validate employee type
  if (!employeeRepository.isValidEmployeeType(employeeType)) {
    throw new Error('Invalid employee type. Must be one of: CLEANER, DRIVER, ADMIN, MANAGER');
  }
  
  try {
    const result = await employeeRepository.findByType(employeeType);
    log.debug(`EmployeeService: Found ${result.length} employees of type ${employeeType}`);
    return result;
  } catch (error) {
    log.error(`EmployeeService: Failed to get employees by type ${employeeType}: ${error.message}`);
    throw error;
  }
}

async function updateEmployee(employeeId, employeeData) {
  const { employee_type } = employeeData;
  
  log.debug(`EmployeeService: Updating employee ${employeeId}`);
  
  // Validate employee type if provided
  if (employee_type && !employeeRepository.isValidEmployeeType(employee_type)) {
    throw new Error('Invalid employee type. Must be one of: CLEANER, DRIVER, ADMIN, MANAGER');
  }
  
  try {
    const result = await employeeRepository.update(employeeId, employeeData);
    
    if (result) {
      log.info(`EmployeeService: Updated employee ${employeeId}`);
      return result;
    } else {
      return null;
    }
  } catch (error) {
    log.error(`EmployeeService: Failed to update employee ${employeeId}: ${error.message}`);
    throw error;
  }
}

async function deleteEmployee(employeeId) {
  log.debug(`EmployeeService: Soft deleting employee ${employeeId}`);
  
  try {
    const result = await employeeRepository.softDelete(employeeId);
    
    if (result) {
      log.info(`EmployeeService: Soft deleted employee ${employeeId}`);
      return result;
    } else {
      return null;
    }
  } catch (error) {
    log.error(`EmployeeService: Failed to delete employee ${employeeId}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getEmployeeByUserId,
  getEmployeesByType,
  updateEmployee,
  deleteEmployee,
  VALID_EMPLOYEE_TYPES
}; 