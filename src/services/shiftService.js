const shiftRepository = require('../repositories/shiftRepository');
const log = require('../core/logger');

class ShiftService {
  constructor() {
    this.shiftRepository = shiftRepository;
  }

  // Creează un schimb nou
  async createShift(shiftData) {
    try {
      // Validare date
      if (!shiftData.employee_id || !shiftData.location_id || !shiftData.shift_date) {
        throw new Error('Employee ID, location ID, and shift date are required');
      }

      if (!shiftData.start_time || !shiftData.end_time) {
        throw new Error('Start time and end time are required');
      }

      // Verifică conflicte de program
      const conflicts = await this.shiftRepository.checkConflicts(
        shiftData.employee_id,
        shiftData.shift_date,
        shiftData.start_time,
        shiftData.end_time
      );

      if (conflicts && conflicts.length > 0) {
        throw new Error('Shift conflicts with existing schedule');
      }

      // Calculează orele lucrate și plata
      const startTime = new Date(`${shiftData.shift_date}T${shiftData.start_time}`);
      const endTime = new Date(`${shiftData.shift_date}T${shiftData.end_time}`);
      const hoursWorked = (endTime - startTime) / (1000 * 60 * 60);
      const breakDuration = shiftData.break_duration || 0;
      const actualHours = hoursWorked - (breakDuration / 60);
      
      const totalPay = actualHours * (shiftData.hourly_rate || 0);

      const shiftToCreate = {
        ...shiftData,
        hours_worked: actualHours,
        total_pay: totalPay,
        status: shiftData.status || 'SCHEDULED'
      };

      const shift = await this.shiftRepository.create(shiftToCreate);
      log.info(`Shift created successfully: ${shift.shift_id}`);
      return shift;
    } catch (error) {
      log.error(`Error creating shift: ${error.message}`);
      throw error;
    }
  }

  // Obține toate schimburile cu filtre
  async getAllShifts(filters = {}) {
    try {
      return await this.shiftRepository.findAll(filters);
    } catch (error) {
      log.error(`Error getting shifts: ${error.message}`);
      throw error;
    }
  }

  // Obține schimb prin ID
  async getShiftById(shiftId) {
    try {
      const shift = await this.shiftRepository.findById(shiftId);
      if (!shift) {
        throw new Error('Shift not found');
      }
      return shift;
    } catch (error) {
      log.error(`Error getting shift ${shiftId}: ${error.message}`);
      throw error;
    }
  }

  // Obține schimburile pentru un angajat
  async getShiftsByEmployee(employeeId, filters = {}) {
    try {
      return await this.shiftRepository.findByEmployeeId(employeeId, filters);
    } catch (error) {
      log.error(`Error getting shifts for employee ${employeeId}: ${error.message}`);
      throw error;
    }
  }

  // Obține schimburile pentru o locație
  async getShiftsByLocation(locationId, filters = {}) {
    try {
      return await this.shiftRepository.findByLocationId(locationId, filters);
    } catch (error) {
      log.error(`Error getting shifts for location ${locationId}: ${error.message}`);
      throw error;
    }
  }

  // Obține schimburile active
  async getActiveShifts(locationId = null) {
    try {
      return await this.shiftRepository.findActive(locationId);
    } catch (error) {
      log.error(`Error getting active shifts: ${error.message}`);
      throw error;
    }
  }

  // Obține schimburile programate pentru azi
  async getTodayScheduledShifts(locationId = null) {
    try {
      return await this.shiftRepository.findTodayScheduled(locationId);
    } catch (error) {
      log.error(`Error getting today's scheduled shifts: ${error.message}`);
      throw error;
    }
  }

  // Actualizează schimb
  async updateShift(shiftId, shiftData) {
    try {
      const existingShift = await this.shiftRepository.findById(shiftId);
      if (!existingShift) {
        throw new Error('Shift not found');
      }

      // Verifică conflicte dacă se schimbă programul
      if (shiftData.shift_date || shiftData.start_time || shiftData.end_time) {
        const conflicts = await this.shiftRepository.checkConflicts(
          existingShift.employee_id,
          shiftData.shift_date || existingShift.shift_date,
          shiftData.start_time || existingShift.start_time,
          shiftData.end_time || existingShift.end_time,
          shiftId
        );

        if (conflicts && conflicts.length > 0) {
          throw new Error('Updated shift conflicts with existing schedule');
        }
      }

      const updatedShift = await this.shiftRepository.update(shiftId, shiftData);
      log.info(`Shift updated successfully: ${shiftId}`);
      return updatedShift;
    } catch (error) {
      log.error(`Error updating shift ${shiftId}: ${error.message}`);
      throw error;
    }
  }

  // Actualizează statusul schimbului
  async updateShiftStatus(shiftId, status, additionalData = {}) {
    try {
      const shift = await this.shiftRepository.updateStatus(shiftId, status, additionalData);
      log.info(`Shift status updated: ${shiftId} -> ${status}`);
      return shift;
    } catch (error) {
      log.error(`Error updating shift status ${shiftId}: ${error.message}`);
      throw error;
    }
  }

  // Începe schimbul
  async startShift(shiftId) {
    try {
      const shift = await this.shiftRepository.startShift(shiftId);
      log.info(`Shift started: ${shiftId}`);
      return shift;
    } catch (error) {
      log.error(`Error starting shift ${shiftId}: ${error.message}`);
      throw error;
    }
  }

  // Termină schimbul
  async endShift(shiftId, endTime = null, breakDuration = 0) {
    try {
      const shift = await this.shiftRepository.endShift(shiftId, endTime, breakDuration);
      log.info(`Shift ended: ${shiftId}`);
      return shift;
    } catch (error) {
      log.error(`Error ending shift ${shiftId}: ${error.message}`);
      throw error;
    }
  }

  // Șterge schimb
  async deleteShift(shiftId) {
    try {
      const shift = await this.shiftRepository.findById(shiftId);
      if (!shift) {
        throw new Error('Shift not found');
      }

      if (shift.status === 'IN_PROGRESS') {
        throw new Error('Cannot delete shift in progress');
      }

      await this.shiftRepository.delete(shiftId);
      log.info(`Shift deleted successfully: ${shiftId}`);
      return { success: true, message: 'Shift deleted successfully' };
    } catch (error) {
      log.error(`Error deleting shift ${shiftId}: ${error.message}`);
      throw error;
    }
  }

  // Obține statusurile valide
  async getValidStatuses() {
    try {
      return await this.shiftRepository.getValidStatuses();
    } catch (error) {
      log.error(`Error getting valid statuses: ${error.message}`);
      throw error;
    }
  }

  // Obține statistici schimburi
  async getShiftStats(filters = {}) {
    try {
      return await this.shiftRepository.getStats(filters);
    } catch (error) {
      log.error(`Error getting shift stats: ${error.message}`);
      throw error;
    }
  }

  // Obține raport de prezență
  async getAttendanceReport(filters = {}) {
    try {
      return await this.shiftRepository.getAttendanceReport(filters);
    } catch (error) {
      log.error(`Error getting attendance report: ${error.message}`);
      throw error;
    }
  }

  // Obține programul săptămânal
  async getWeeklySchedule(locationId, weekStartDate) {
    try {
      return await this.shiftRepository.getWeeklySchedule(locationId, weekStartDate);
    } catch (error) {
      log.error(`Error getting weekly schedule: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ShiftService; 