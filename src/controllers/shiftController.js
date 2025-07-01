const ShiftService = require('../services/shiftService');
const log = require('../core/logger');

class ShiftController {
  constructor() {
    this.shiftService = ShiftService; // service is plain object
    Object.getOwnPropertyNames(ShiftController.prototype)
      .filter(m => m !== 'constructor' && typeof this[m] === 'function')
      .forEach(m => { this[m] = this[m].bind(this); });
  }

  // Creează un schimb nou
  async createShift(req, res) {
    try {
      const shift = await this.shiftService.createShift(req.body);
      res.writeHead(201, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: shift,
        message: 'Shift created successfully'
      }));
    } catch (error) {
      log.error(`ShiftController.createShift: ${error.message}`);
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }

  // Obține toate schimburile
  async getAllShifts(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const filters = parsedUrl.query;

      // Convertește parametrii numerici
      if (filters.limit) filters.limit = parseInt(filters.limit);
      if (filters.offset) filters.offset = parseInt(filters.offset);
      if (filters.employee_id) filters.employee_id = parseInt(filters.employee_id);
      if (filters.location_id) filters.location_id = parseInt(filters.location_id);

      const shifts = await this.shiftService.getAllShifts(filters);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: shifts,
        count: shifts.length
      }));
    } catch (error) {
      log.error(`ShiftController.getAllShifts: ${error.message}`);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }

  // Obține schimb prin ID
  async getShiftById(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const shiftId = parseInt(pathParts[pathParts.length - 1]);

      if (!shiftId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid shift ID' 
        }));
        return;
      }

      const shift = await this.shiftService.getShiftById(shiftId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: shift 
      }));
    } catch (error) {
      log.error(`ShiftController.getShiftById: ${error.message}`);
      const statusCode = error.message === 'Shift not found' ? 404 : 500;
      res.writeHead(statusCode, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }

  // Obține schimburile pentru un angajat
  async getShiftsByEmployee(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const employeeId = parseInt(pathParts[pathParts.length - 1]);
      const filters = parsedUrl.query;

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

      if (filters.limit) filters.limit = parseInt(filters.limit);

      const shifts = await this.shiftService.getShiftsByEmployee(employeeId, filters);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: shifts,
        count: shifts.length
      }));
    } catch (error) {
      log.error(`ShiftController.getShiftsByEmployee: ${error.message}`);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }

  // Obține schimburile pentru o locație
  async getShiftsByLocation(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const locationId = parseInt(pathParts[pathParts.length - 1]);
      const filters = parsedUrl.query;

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

      if (filters.limit) filters.limit = parseInt(filters.limit);

      const shifts = await this.shiftService.getShiftsByLocation(locationId, filters);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: shifts,
        count: shifts.length
      }));
    } catch (error) {
      log.error(`ShiftController.getShiftsByLocation: ${error.message}`);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }

  // Obține schimburile active
  async getActiveShifts(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const locationId = parsedUrl.query.location_id ? parseInt(parsedUrl.query.location_id) : null;

      const shifts = await this.shiftService.getActiveShifts(locationId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: shifts,
        count: shifts.length
      }));
    } catch (error) {
      log.error(`ShiftController.getActiveShifts: ${error.message}`);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }

  // Obține schimburile programate pentru azi
  async getTodayScheduled(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const locationId = parsedUrl.query.location_id ? parseInt(parsedUrl.query.location_id) : null;

      const shifts = await this.shiftService.getTodayScheduledShifts(locationId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: shifts,
        count: shifts.length
      }));
    } catch (error) {
      log.error(`ShiftController.getTodayScheduled: ${error.message}`);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }

  // Actualizează schimb
  async updateShift(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const shiftId = parseInt(pathParts[pathParts.length - 1]);

      if (!shiftId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid shift ID' 
        }));
        return;
      }

      const shift = await this.shiftService.updateShift(shiftId, req.body);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: shift,
        message: 'Shift updated successfully'
      }));
    } catch (error) {
      log.error(`ShiftController.updateShift: ${error.message}`);
      const statusCode = error.message === 'Shift not found' ? 404 : 400;
      res.writeHead(statusCode, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }

  // Actualizează statusul schimbului
  async updateShiftStatus(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const shiftId = parseInt(pathParts[pathParts.length - 2]); // /shifts/:id/status

      if (!shiftId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid shift ID' 
        }));
        return;
      }

      const { status, ...additionalData } = req.body;
      const shift = await this.shiftService.updateShiftStatus(shiftId, status, additionalData);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: shift,
        message: 'Shift status updated successfully'
      }));
    } catch (error) {
      log.error(`ShiftController.updateShiftStatus: ${error.message}`);
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }

  // Începe schimbul
  async startShift(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const shiftId = parseInt(pathParts[pathParts.length - 2]); // /shifts/:id/start

      if (!shiftId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid shift ID' 
        }));
        return;
      }

      const shift = await this.shiftService.startShift(shiftId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: shift,
        message: 'Shift started successfully'
      }));
    } catch (error) {
      log.error(`ShiftController.startShift: ${error.message}`);
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }

  // Termină schimbul
  async endShift(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const shiftId = parseInt(pathParts[pathParts.length - 2]); // /shifts/:id/end

      if (!shiftId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid shift ID' 
        }));
        return;
      }

      const { end_time, break_duration } = req.body;
      const shift = await this.shiftService.endShift(shiftId, end_time, break_duration);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: shift,
        message: 'Shift ended successfully'
      }));
    } catch (error) {
      log.error(`ShiftController.endShift: ${error.message}`);
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }

  // Șterge schimb
  async deleteShift(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const shiftId = parseInt(pathParts[pathParts.length - 1]);

      if (!shiftId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid shift ID' 
        }));
        return;
      }

      const result = await this.shiftService.deleteShift(shiftId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        data: result,
        message: 'Shift deleted successfully'
      }));
    } catch (error) {
      log.error(`ShiftController.deleteShift: ${error.message}`);
      const statusCode = error.message === 'Shift not found' ? 404 : 400;
      res.writeHead(statusCode, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }

  // Obține statusurile valide
  async getValidStatuses(req, res) {
    try {
      const statuses = await this.shiftService.getValidStatuses();
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: statuses 
      }));
    } catch (error) {
      log.error(`ShiftController.getValidStatuses: ${error.message}`);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }

  // Obține statistici schimburi
  async getShiftStats(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const filters = parsedUrl.query;

      if (filters.location_id) filters.location_id = parseInt(filters.location_id);

      const stats = await this.shiftService.getShiftStats(filters);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: stats 
      }));
    } catch (error) {
      log.error(`ShiftController.getShiftStats: ${error.message}`);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }

  // Obține raport de prezență
  async getAttendanceReport(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const filters = parsedUrl.query;

      if (filters.location_id) filters.location_id = parseInt(filters.location_id);
      if (filters.employee_id) filters.employee_id = parseInt(filters.employee_id);

      const report = await this.shiftService.getAttendanceReport(filters);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: report 
      }));
    } catch (error) {
      log.error(`ShiftController.getAttendanceReport: ${error.message}`);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }

  // Obține programul săptămânal
  async getWeeklySchedule(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const locationId = parseInt(pathParts[pathParts.length - 1]); // /shifts/weekly/:locationId
      const weekStartDate = parsedUrl.query.week_start;

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

      const schedule = await this.shiftService.getWeeklySchedule(locationId, weekStartDate);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: schedule 
      }));
    } catch (error) {
      log.error(`ShiftController.getWeeklySchedule: ${error.message}`);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
  }
}

module.exports = new ShiftController();
