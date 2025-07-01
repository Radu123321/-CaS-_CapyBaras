const ExceptionService = require('../services/exceptionService');
const log = require('../core/logger');

class ExceptionController {
  constructor() {
    this.exceptionService = ExceptionService;
  }

  // Creează excepție
  async createException(req, res) {
    try {
      const exception = await this.exceptionService.createException(req.body);
      res.writeHead(201, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: exception,
        message: 'Exception reported successfully'
      }));
    } catch (error) {
      log.error(`ExceptionController.createException: ${error.message}`);
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

  // Obține toate excepțiile
  async getAllExceptions(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const filters = parsedUrl.query;

      if (filters.limit) filters.limit = parseInt(filters.limit);
      if (filters.offset) filters.offset = parseInt(filters.offset);
      if (filters.location_id) filters.location_id = parseInt(filters.location_id);
      if (filters.is_resolved !== undefined) filters.is_resolved = filters.is_resolved === 'true';

      const exceptions = await this.exceptionService.getAllExceptions(filters);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: exceptions,
        count: exceptions.length
      }));
    } catch (error) {
      log.error(`ExceptionController.getAllExceptions: ${error.message}`);
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

  // Obține excepție prin ID
  async getExceptionById(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const exceptionId = parseInt(pathParts[pathParts.length - 1]);

      if (!exceptionId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid exception ID' 
        }));
        return;
      }

      const exception = await this.exceptionService.getExceptionById(exceptionId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: exception 
      }));
    } catch (error) {
      log.error(`ExceptionController.getExceptionById: ${error.message}`);
      const statusCode = error.message === 'Exception not found' ? 404 : 500;
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

  // Obține excepții active
  async getActiveExceptions(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const filters = parsedUrl.query;

      if (filters.location_id) filters.location_id = parseInt(filters.location_id);
      if (filters.limit) filters.limit = parseInt(filters.limit);

      const exceptions = await this.exceptionService.getActiveExceptions(filters);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: exceptions,
        count: exceptions.length
      }));
    } catch (error) {
      log.error(`ExceptionController.getActiveExceptions: ${error.message}`);
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

  // Obține excepții critice
  async getCriticalExceptions(req, res) {
    try {
      const exceptions = await this.exceptionService.getCriticalExceptions();
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: exceptions,
        count: exceptions.length
      }));
    } catch (error) {
      log.error(`ExceptionController.getCriticalExceptions: ${error.message}`);
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

  // Actualizează excepție
  async updateException(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const exceptionId = parseInt(pathParts[pathParts.length - 1]);

      if (!exceptionId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid exception ID' 
        }));
        return;
      }

      const exception = await this.exceptionService.updateException(exceptionId, req.body);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: exception,
        message: 'Exception updated successfully'
      }));
    } catch (error) {
      log.error(`ExceptionController.updateException: ${error.message}`);
      const statusCode = error.message === 'Exception not found' ? 404 : 400;
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

  // Rezolvă excepție
  async resolveException(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const exceptionId = parseInt(pathParts[pathParts.length - 2]); // /exceptions/:id/resolve

      if (!exceptionId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid exception ID' 
        }));
        return;
      }

      const { resolved_by_user_id, resolution_notes } = req.body;
      const exception = await this.exceptionService.resolveException(
        exceptionId, 
        resolved_by_user_id, 
        resolution_notes
      );
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: exception,
        message: 'Exception resolved successfully'
      }));
    } catch (error) {
      log.error(`ExceptionController.resolveException: ${error.message}`);
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

  // Șterge excepție
  async deleteException(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const pathParts = parsedUrl.pathname.split('/');
      const exceptionId = parseInt(pathParts[pathParts.length - 1]);

      if (!exceptionId) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid exception ID' 
        }));
        return;
      }

      const result = await this.exceptionService.deleteException(exceptionId);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        data: result,
        message: 'Exception deleted successfully'
      }));
    } catch (error) {
      log.error(`ExceptionController.deleteException: ${error.message}`);
      const statusCode = error.message === 'Exception not found' ? 404 : 400;
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

  // Obține tipuri de excepții
  async getExceptionTypes(req, res) {
    try {
      const types = await this.exceptionService.getExceptionTypes();
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: types 
      }));
    } catch (error) {
      log.error(`ExceptionController.getExceptionTypes: ${error.message}`);
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
  async getExceptionStats(req, res) {
    try {
      const url = require('url');
      const parsedUrl = url.parse(req.url, true);
      const filters = parsedUrl.query;

      if (filters.location_id) filters.location_id = parseInt(filters.location_id);

      const stats = await this.exceptionService.getExceptionStats(filters);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true, 
        data: stats 
      }));
    } catch (error) {
      log.error(`ExceptionController.getExceptionStats: ${error.message}`);
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

module.exports = new ExceptionController();
