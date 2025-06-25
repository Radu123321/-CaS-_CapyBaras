const MaintenanceService = require('../services/maintenanceService');
const log = require('../core/logger');

class MaintenanceController {
  constructor() {
    this.maintenanceService = new MaintenanceService();
  }

  // Creează programare de mentenanță
  async createMaintenance(req, res) {
    try {
      const maintenance = await this.maintenanceService.createMaintenance(req.body);
      res.writeHead(201, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: maintenance,
        message: 'Maintenance scheduled successfully'
      }));
    } catch (error) {
      log.error(`MaintenanceController.createMaintenance: ${error.message}`);
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

  // Obține toate programările de mentenanță
  async getAllMaintenance(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const filters = parsedUrl.query;

      if (filters.limit) filters.limit = parseInt(filters.limit);
      if (filters.offset) filters.offset = parseInt(filters.offset);
      if (filters.equipment_id) filters.equipment_id = parseInt(filters.equipment_id);
      if (filters.location_id) filters.location_id = parseInt(filters.location_id);

      const maintenance = await this.maintenanceService.getAllMaintenance(filters);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: maintenance,
        count: maintenance.length
      }));
    } catch (error) {
      log.error(`MaintenanceController.getAllMaintenance: ${error.message}`);
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

  // Obține programare prin ID
  async getMaintenanceById(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const maintenanceId = parseInt(pathParts[pathParts.length - 1]);

      if (!maintenanceId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid maintenance ID' 
        }));
        return;
      }

      const maintenance = await this.maintenanceService.getMaintenanceById(maintenanceId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: maintenance 
      }));
    } catch (error) {
      log.error(`MaintenanceController.getMaintenanceById: ${error.message}`);
      const statusCode = error.message === 'Maintenance schedule not found' ? 404 : 500;
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

  // Obține programări pentru echipament
  async getMaintenanceByEquipment(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const equipmentId = parseInt(pathParts[pathParts.length - 1]);
      const filters = parsedUrl.query;

      if (!equipmentId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid equipment ID' 
        }));
        return;
      }

      if (filters.limit) filters.limit = parseInt(filters.limit);

      const maintenance = await this.maintenanceService.getMaintenanceByEquipment(equipmentId, filters);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: maintenance,
        count: maintenance.length
      }));
    } catch (error) {
      log.error(`MaintenanceController.getMaintenanceByEquipment: ${error.message}`);
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

  // Obține programări pentru azi
  async getTodayScheduled(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const locationId = parsedUrl.query.location_id ? parseInt(parsedUrl.query.location_id) : null;

      const maintenance = await this.maintenanceService.getTodayScheduled(locationId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: maintenance,
        count: maintenance.length
      }));
    } catch (error) {
      log.error(`MaintenanceController.getTodayScheduled: ${error.message}`);
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

  // Obține programări în întârziere
  async getOverdue(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const locationId = parsedUrl.query.location_id ? parseInt(parsedUrl.query.location_id) : null;

      const maintenance = await this.maintenanceService.getOverdue(locationId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: maintenance,
        count: maintenance.length
      }));
    } catch (error) {
      log.error(`MaintenanceController.getOverdue: ${error.message}`);
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

  // Obține programări urgente
  async getUrgent(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const locationId = parsedUrl.query.location_id ? parseInt(parsedUrl.query.location_id) : null;

      const maintenance = await this.maintenanceService.getUrgentMaintenance(locationId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: maintenance,
        count: maintenance.length
      }));
    } catch (error) {
      log.error(`MaintenanceController.getUrgent: ${error.message}`);
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

  // Actualizează programare
  async updateMaintenance(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const maintenanceId = parseInt(pathParts[pathParts.length - 1]);

      if (!maintenanceId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid maintenance ID' 
        }));
        return;
      }

      const maintenance = await this.maintenanceService.updateMaintenance(maintenanceId, req.body);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: maintenance,
        message: 'Maintenance updated successfully'
      }));
    } catch (error) {
      log.error(`MaintenanceController.updateMaintenance: ${error.message}`);
      const statusCode = error.message === 'Maintenance schedule not found' ? 404 : 400;
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

  // Începe mentenanță
  async startMaintenance(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const maintenanceId = parseInt(pathParts[pathParts.length - 2]); // /maintenance/:id/start

      if (!maintenanceId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid maintenance ID' 
        }));
        return;
      }

      const maintenance = await this.maintenanceService.startMaintenance(maintenanceId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: maintenance,
        message: 'Maintenance started successfully'
      }));
    } catch (error) {
      log.error(`MaintenanceController.startMaintenance: ${error.message}`);
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

  // Finalizează mentenanță
  async completeMaintenance(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const maintenanceId = parseInt(pathParts[pathParts.length - 2]); // /maintenance/:id/complete

      if (!maintenanceId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid maintenance ID' 
        }));
        return;
      }

      const { actual_cost, completion_notes } = req.body;
      const maintenance = await this.maintenanceService.completeMaintenance(
        maintenanceId, 
        actual_cost, 
        completion_notes
      );
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: maintenance,
        message: 'Maintenance completed successfully'
      }));
    } catch (error) {
      log.error(`MaintenanceController.completeMaintenance: ${error.message}`);
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

  // Șterge programare
  async deleteMaintenance(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const maintenanceId = parseInt(pathParts[pathParts.length - 1]);

      if (!maintenanceId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid maintenance ID' 
        }));
        return;
      }

      const result = await this.maintenanceService.deleteMaintenance(maintenanceId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        data: result,
        message: 'Maintenance schedule deleted successfully'
      }));
    } catch (error) {
      log.error(`MaintenanceController.deleteMaintenance: ${error.message}`);
      const statusCode = error.message === 'Maintenance schedule not found' ? 404 : 400;
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

  // Obține tipuri de mentenanță
  async getMaintenanceTypes(req, res) {
    try {
      const types = await this.maintenanceService.getMaintenanceTypes();
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: types 
      }));
    } catch (error) {
      log.error(`MaintenanceController.getMaintenanceTypes: ${error.message}`);
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

  // Obține niveluri de prioritate
  async getPriorityLevels(req, res) {
    try {
      const priorities = await this.maintenanceService.getPriorityLevels();
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: priorities 
      }));
    } catch (error) {
      log.error(`MaintenanceController.getPriorityLevels: ${error.message}`);
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

  // Obține statistici
  async getMaintenanceStats(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const filters = parsedUrl.query;

      if (filters.location_id) filters.location_id = parseInt(filters.location_id);

      const stats = await this.maintenanceService.getMaintenanceStats(filters);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: stats 
      }));
    } catch (error) {
      log.error(`MaintenanceController.getMaintenanceStats: ${error.message}`);
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

  // Obține program viitor
  async getUpcomingSchedule(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const days = parsedUrl.query.days ? parseInt(parsedUrl.query.days) : 7;
      const locationId = parsedUrl.query.location_id ? parseInt(parsedUrl.query.location_id) : null;

      const schedule = await this.maintenanceService.getUpcomingSchedule(days, locationId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: schedule 
      }));
    } catch (error) {
      log.error(`MaintenanceController.getUpcomingSchedule: ${error.message}`);
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

module.exports = new MaintenanceController();
