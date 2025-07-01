const RecurrenceService = require('../services/recurrenceService');
const log = require('../core/logger');

class RecurrenceController {
  constructor() {
    this.recurrenceService = RecurrenceService;
    Object.getOwnPropertyNames(RecurrenceController.prototype)
      .filter(m => m !== 'constructor' && typeof this[m] === 'function')
      .forEach(m => { this[m] = this[m].bind(this); });
  }

  // Creează programare recurentă
  async createRecurrence(req, res) {
    try {
      const recurrence = await this.recurrenceService.createRecurrence(req.body);
      res.writeHead(201, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: recurrence,
        message: 'Recurring schedule created successfully'
      }));
    } catch (error) {
      log.error(`RecurrenceController.createRecurrence: ${error.message}`);
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

  // Obține toate programările recurente
  async getAllRecurrences(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const filters = parsedUrl.query;

      if (filters.limit) filters.limit = parseInt(filters.limit);
      if (filters.offset) filters.offset = parseInt(filters.offset);
      if (filters.customer_id) filters.customer_id = parseInt(filters.customer_id);
      if (filters.location_id) filters.location_id = parseInt(filters.location_id);
      if (filters.is_active !== undefined) filters.is_active = filters.is_active === 'true';

      const recurrences = await this.recurrenceService.getAllRecurrences(filters);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: recurrences,
        count: recurrences.length
      }));
    } catch (error) {
      log.error(`RecurrenceController.getAllRecurrences: ${error.message}`);
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
  async getRecurrenceById(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const recurrenceId = parseInt(pathParts[pathParts.length - 1]);

      if (!recurrenceId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid recurrence ID' 
        }));
        return;
      }

      const recurrence = await this.recurrenceService.getRecurrenceById(recurrenceId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: recurrence 
      }));
    } catch (error) {
      log.error(`RecurrenceController.getRecurrenceById: ${error.message}`);
      const statusCode = error.message === 'Recurring schedule not found' ? 404 : 500;
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

  // Obține programări pentru client
  async getRecurrencesByCustomer(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const customerId = parseInt(pathParts[pathParts.length - 1]);

      if (!customerId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid customer ID' 
        }));
        return;
      }

      const recurrences = await this.recurrenceService.getRecurrencesByCustomer(customerId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: recurrences,
        count: recurrences.length
      }));
    } catch (error) {
      log.error(`RecurrenceController.getRecurrencesByCustomer: ${error.message}`);
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

  // Obține programări care trebuie executate
  async getDueRecurrences(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const beforeDate = parsedUrl.query.before_date ? new Date(parsedUrl.query.before_date) : null;

      const recurrences = await this.recurrenceService.getDueRecurrences(beforeDate);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: recurrences,
        count: recurrences.length
      }));
    } catch (error) {
      log.error(`RecurrenceController.getDueRecurrences: ${error.message}`);
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
  async updateRecurrence(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const recurrenceId = parseInt(pathParts[pathParts.length - 1]);

      if (!recurrenceId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid recurrence ID' 
        }));
        return;
      }

      const recurrence = await this.recurrenceService.updateRecurrence(recurrenceId, req.body);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: recurrence,
        message: 'Recurring schedule updated successfully'
      }));
    } catch (error) {
      log.error(`RecurrenceController.updateRecurrence: ${error.message}`);
      const statusCode = error.message === 'Recurring schedule not found' ? 404 : 400;
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

  // Activează/Dezactivează programare
  async updateActiveStatus(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const recurrenceId = parseInt(pathParts[pathParts.length - 2]); // /recurrences/:id/status

      if (!recurrenceId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid recurrence ID' 
        }));
        return;
      }

      const { is_active } = req.body;
      const recurrence = await this.recurrenceService.updateActiveStatus(recurrenceId, is_active);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: recurrence,
        message: 'Recurring schedule status updated successfully'
      }));
    } catch (error) {
      log.error(`RecurrenceController.updateActiveStatus: ${error.message}`);
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
  async deleteRecurrence(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const recurrenceId = parseInt(pathParts[pathParts.length - 1]);

      if (!recurrenceId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid recurrence ID' 
        }));
        return;
      }

      const result = await this.recurrenceService.deleteRecurrence(recurrenceId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        data: result,
        message: 'Recurring schedule deleted successfully'
      }));
    } catch (error) {
      log.error(`RecurrenceController.deleteRecurrence: ${error.message}`);
      const statusCode = error.message === 'Recurring schedule not found' ? 404 : 400;
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

  // Obține programări expirate
  async getExpiredRecurrences(req, res) {
    try {
      const recurrences = await this.recurrenceService.getExpiredRecurrences();
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: recurrences,
        count: recurrences.length
      }));
    } catch (error) {
      log.error(`RecurrenceController.getExpiredRecurrences: ${error.message}`);
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

  // Dezactivează programări expirate
  async deactivateExpired(req, res) {
    try {
      const result = await this.recurrenceService.deactivateExpired();
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: result,
        message: 'Expired recurring schedules deactivated successfully'
      }));
    } catch (error) {
      log.error(`RecurrenceController.deactivateExpired: ${error.message}`);
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
  async getRecurrenceStats(req, res) {
    try {
      const stats = await this.recurrenceService.getRecurrenceStats();
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: stats 
      }));
    } catch (error) {
      log.error(`RecurrenceController.getRecurrenceStats: ${error.message}`);
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

  // Obține statistici pe pattern
  async getStatsByPattern(req, res) {
    try {
      const stats = await this.recurrenceService.getStatsByPattern();
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: stats 
      }));
    } catch (error) {
      log.error(`RecurrenceController.getStatsByPattern: ${error.message}`);
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

  // Procesează programări recurente
  async processRecurrences(req, res) {
    try {
      const result = await this.recurrenceService.processRecurringSchedules();
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: result,
        message: 'Recurring schedules processed successfully'
      }));
    } catch (error) {
      log.error(`RecurrenceController.processRecurrences: ${error.message}`);
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

module.exports = new RecurrenceController();
