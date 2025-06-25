const employeeRepository = require('../repositories/employeeRepository');
const log = require('../core/logger');

// Valid positions from schema
const VALID_POSITIONS = ['CLEANER', 'DRIVER', 'TECHNICIAN', 'SUPERVISOR', 'MANAGER', 'ADMIN'];

async function createEmployee(employeeData) {
  log.debug(`EmployeeService: Creating employee for user ${employeeData.user_id}`);
  
  try {
    // Validate required fields
    if (!employeeData.user_id || !employeeData.location_id) {
      throw new Error('user_id and location_id are required');
    }
    
    // Check if employee already exists for this user
    const existingEmployee = await employeeRepository.findByUserId(employeeData.user_id);
    
    if (existingEmployee) {
      throw new Error('Employee already exists for this user');
    }
    
    // Generate employee code if not provided
    if (!employeeData.employee_code) {
      employeeData.employee_code = `EMP${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
    }
    
    // Set defaults
    const employeeDefaults = {
      position: 'EMPLOYEE',
      hourly_rate: 15.00,
      hire_date: new Date(),
      skills: [],
      is_available: true,
      is_active: true,
      ...employeeData
    };
    
    const result = await employeeRepository.create(employeeDefaults);
    
    if (result) {
      log.info(`EmployeeService: Created employee ${result.employee_id} for user ${employeeData.user_id}`);
      return result;
    } else {
      throw new Error('Failed to create employee');
    }
  } catch (error) {
    log.error(`EmployeeService: Failed to create employee: ${error.message}`);
    
    // Handle foreign key constraint
    if (error.code === '23503') {
      if (error.constraint === 'employees_user_id_fkey') {
        throw new Error('User not found');
      } else if (error.constraint === 'employees_location_id_fkey') {
        throw new Error('Location not found');
      }
    }
    
    throw error;
  }
}

async function getAllEmployees(filters = {}) {
  log.debug('EmployeeService: Getting all employees');
  
  try {
    const result = await employeeRepository.findAll(filters);
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

async function getEmployeeByCode(employeeCode) {
  log.debug(`EmployeeService: Getting employee by code ${employeeCode}`);
  
  try {
    return await employeeRepository.findByCode(employeeCode);
  } catch (error) {
    log.error(`EmployeeService: Failed to get employee by code ${employeeCode}: ${error.message}`);
    throw error;
  }
}

async function getEmployeesByPosition(position) {
  log.debug(`EmployeeService: Getting employees by position ${position}`);
  
  try {
    const result = await employeeRepository.findByPosition(position);
    log.debug(`EmployeeService: Found ${result.length} employees with position ${position}`);
    return result;
  } catch (error) {
    log.error(`EmployeeService: Failed to get employees by position ${position}: ${error.message}`);
    throw error;
  }
}

async function getEmployeesByLocation(locationId) {
  log.debug(`EmployeeService: Getting employees by location ${locationId}`);
  
  try {
    const result = await employeeRepository.findByLocation(locationId);
    log.debug(`EmployeeService: Found ${result.length} employees at location ${locationId}`);
    return result;
  } catch (error) {
    log.error(`EmployeeService: Failed to get employees by location ${locationId}: ${error.message}`);
    throw error;
  }
}

async function getEmployeesBySkills(skills) {
  log.debug(`EmployeeService: Getting employees by skills ${JSON.stringify(skills)}`);
  
  try {
    const result = await employeeRepository.findBySkills(skills);
    log.debug(`EmployeeService: Found ${result.length} employees with required skills`);
    return result;
  } catch (error) {
    log.error(`EmployeeService: Failed to get employees by skills: ${error.message}`);
    throw error;
  }
}

async function getAvailableEmployees(locationId) {
  log.debug(`EmployeeService: Getting available employees for location ${locationId}`);
  
  try {
    const result = await employeeRepository.findAvailableByLocation(locationId);
    log.debug(`EmployeeService: Found ${result.length} available employees`);
    return result;
  } catch (error) {
    log.error(`EmployeeService: Failed to get available employees: ${error.message}`);
    throw error;
  }
}

async function updateEmployee(employeeId, employeeData) {
  log.debug(`EmployeeService: Updating employee ${employeeId}`);
  
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

async function addSkill(employeeId, skill) {
  log.debug(`EmployeeService: Adding skill ${skill} to employee ${employeeId}`);
  
  try {
    const result = await employeeRepository.addSkill(employeeId, skill);
    
    if (result) {
      log.info(`EmployeeService: Added skill ${skill} to employee ${employeeId}`);
      return result;
    } else {
      throw new Error('Employee not found');
    }
  } catch (error) {
    log.error(`EmployeeService: Failed to add skill to employee ${employeeId}: ${error.message}`);
    throw error;
  }
}

async function removeSkill(employeeId, skill) {
  log.debug(`EmployeeService: Removing skill ${skill} from employee ${employeeId}`);
  
  try {
    const result = await employeeRepository.removeSkill(employeeId, skill);
    
    if (result) {
      log.info(`EmployeeService: Removed skill ${skill} from employee ${employeeId}`);
      return result;
    } else {
      throw new Error('Employee not found');
    }
  } catch (error) {
    log.error(`EmployeeService: Failed to remove skill from employee ${employeeId}: ${error.message}`);
    throw error;
  }
}

async function updateAvailability(employeeId, isAvailable) {
  log.debug(`EmployeeService: Updating availability for employee ${employeeId} to ${isAvailable}`);
  
  try {
    const result = await employeeRepository.updateAvailability(employeeId, isAvailable);
    
    if (result) {
      log.info(`EmployeeService: Updated availability for employee ${employeeId}`);
      return result;
    } else {
      throw new Error('Employee not found');
    }
  } catch (error) {
    log.error(`EmployeeService: Failed to update availability for employee ${employeeId}: ${error.message}`);
    throw error;
  }
}

async function searchEmployees(searchTerm, filters = {}) {
  log.debug(`EmployeeService: Searching employees with term: ${searchTerm}`);
  
  try {
    return await employeeRepository.search(searchTerm, filters);
  } catch (error) {
    log.error(`EmployeeService: Failed to search employees: ${error.message}`);
    throw error;
  }
}

async function getEmployeeStats(employeeId) {
  log.debug(`EmployeeService: Getting stats for employee ${employeeId}`);
  
  try {
    return await employeeRepository.getStats(employeeId);
  } catch (error) {
    log.error(`EmployeeService: Failed to get employee stats: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getEmployeeByUserId,
  getEmployeeByCode,
  getEmployeesByPosition,
  getEmployeesByLocation,
  getEmployeesBySkills,
  getAvailableEmployees,
  updateEmployee,
  deleteEmployee,
  addSkill,
  removeSkill,
  updateAvailability,
  searchEmployees,
  getEmployeeStats,
  VALID_POSITIONS
}; 