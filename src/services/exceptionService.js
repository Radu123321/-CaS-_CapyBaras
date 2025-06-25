const exceptionRepository = require('../repositories/exceptionRepository');
const log = require('../core/logger');

class ExceptionService {
  constructor() {
    this.exceptionRepository = exceptionRepository;
  }

  // Creează o excepție nouă
  async createException(exceptionData) {
    try {
      // Validare date
      if (!exceptionData.location_id || !exceptionData.type || !exceptionData.title) {
        throw new Error('Location ID, type, and title are required');
      }

      if (!exceptionData.description || !exceptionData.reported_by_user_id) {
        throw new Error('Description and reporter user ID are required');
      }

      const exceptionToCreate = {
        ...exceptionData,
        severity: exceptionData.severity || 'MEDIUM',
        is_resolved: exceptionData.is_resolved !== undefined ? exceptionData.is_resolved : false,
        affected_orders: exceptionData.affected_orders || []
      };

      const exception = await this.exceptionRepository.create(exceptionToCreate);
      log.info(`Exception reported successfully: ${exception.exception_id}`);
      return exception;
    } catch (error) {
      log.error(`Error creating exception: ${error.message}`);
      throw error;
    }
  }

  // Obține toate excepțiile cu filtre
  async getAllExceptions(filters = {}) {
    try {
      return await this.exceptionRepository.findAll(filters);
    } catch (error) {
      log.error(`Error getting exceptions: ${error.message}`);
      throw error;
    }
  }

  // Obține excepție prin ID
  async getExceptionById(exceptionId) {
    try {
      const exception = await this.exceptionRepository.findById(exceptionId);
      if (!exception) {
        throw new Error('Exception not found');
      }
      return exception;
    } catch (error) {
      log.error(`Error getting exception ${exceptionId}: ${error.message}`);
      throw error;
    }
  }

  // Obține excepțiile active (nerezolvate)
  async getActiveExceptions(filters = {}) {
    try {
      return await this.exceptionRepository.findActive(filters);
    } catch (error) {
      log.error(`Error getting active exceptions: ${error.message}`);
      throw error;
    }
  }

  // Obține excepțiile critice nerezolvate
  async getCriticalExceptions() {
    try {
      return await this.exceptionRepository.findCritical();
    } catch (error) {
      log.error(`Error getting critical exceptions: ${error.message}`);
      throw error;
    }
  }

  // Obține excepțiile pentru o locație
  async getExceptionsByLocation(locationId, filters = {}) {
    try {
      return await this.exceptionRepository.findByLocationId(locationId, filters);
    } catch (error) {
      log.error(`Error getting exceptions for location ${locationId}: ${error.message}`);
      throw error;
    }
  }

  // Actualizează excepția
  async updateException(exceptionId, exceptionData) {
    try {
      const existingException = await this.exceptionRepository.findById(exceptionId);
      if (!existingException) {
        throw new Error('Exception not found');
      }

      if (existingException.is_resolved) {
        throw new Error('Cannot update resolved exception');
      }

      const updatedException = await this.exceptionRepository.update(exceptionId, exceptionData);
      log.info(`Exception updated successfully: ${exceptionId}`);
      return updatedException;
    } catch (error) {
      log.error(`Error updating exception ${exceptionId}: ${error.message}`);
      throw error;
    }
  }

  // Rezolvă excepția
  async resolveException(exceptionId, resolvedByUserId, resolutionNotes = null) {
    try {
      const exception = await this.exceptionRepository.resolve(
        exceptionId, 
        resolvedByUserId, 
        resolutionNotes
      );
      log.info(`Exception resolved: ${exceptionId} by user ${resolvedByUserId}`);
      return exception;
    } catch (error) {
      log.error(`Error resolving exception ${exceptionId}: ${error.message}`);
      throw error;
    }
  }

  // Reactivează excepția
  async reactivateException(exceptionId) {
    try {
      const exception = await this.exceptionRepository.reactivate(exceptionId);
      log.info(`Exception reactivated: ${exceptionId}`);
      return exception;
    } catch (error) {
      log.error(`Error reactivating exception ${exceptionId}: ${error.message}`);
      throw error;
    }
  }

  // Șterge excepția
  async deleteException(exceptionId) {
    try {
      const exception = await this.exceptionRepository.findById(exceptionId);
      if (!exception) {
        throw new Error('Exception not found');
      }

      await this.exceptionRepository.delete(exceptionId);
      log.info(`Exception deleted successfully: ${exceptionId}`);
      return { success: true, message: 'Exception deleted successfully' };
    } catch (error) {
      log.error(`Error deleting exception ${exceptionId}: ${error.message}`);
      throw error;
    }
  }

  // Obține tipurile de excepții
  async getExceptionTypes() {
    try {
      return await this.exceptionRepository.getTypes();
    } catch (error) {
      log.error(`Error getting exception types: ${error.message}`);
      throw error;
    }
  }

  // Obține nivelurile de severitate
  async getSeverityLevels() {
    try {
      return await this.exceptionRepository.getSeverityLevels();
    } catch (error) {
      log.error(`Error getting severity levels: ${error.message}`);
      throw error;
    }
  }

  // Obține statistici excepții
  async getExceptionStats(filters = {}) {
    try {
      return await this.exceptionRepository.getStats(filters);
    } catch (error) {
      log.error(`Error getting exception stats: ${error.message}`);
      throw error;
    }
  }

  // Obține statistici excepții pe locație
  async getStatsByLocation() {
    try {
      return await this.exceptionRepository.getStatsByLocation();
    } catch (error) {
      log.error(`Error getting exception stats by location: ${error.message}`);
      throw error;
    }
  }

  // Găsește excepțiile cu impact mare
  async getHighImpactExceptions(limit = 10) {
    try {
      return await this.exceptionRepository.findHighImpact(limit);
    } catch (error) {
      log.error(`Error getting high impact exceptions: ${error.message}`);
      throw error;
    }
  }

  // Curăță excepțiile vechi rezolvate
  async cleanupOldResolved(daysOld = 90) {
    try {
      const result = await this.exceptionRepository.cleanupOldResolved(daysOld);
      log.info(`Cleaned up old exception records: ${result.deleted_count} records deleted`);
      return result;
    } catch (error) {
      log.error(`Error cleaning up old exception records: ${error.message}`);
      throw error;
    }
  }

  // Raportează excepție automată (pentru sistemul de detectare)
  async reportAutomaticException(type, locationId, details) {
    try {
      const exceptionData = {
        location_id: locationId,
        type: type,
        severity: this.determineSeverity(type, details),
        title: this.generateTitle(type, details),
        description: this.generateDescription(type, details),
        reported_by_user_id: 1, // System user
        equipment_id: details.equipment_id || null,
        affected_orders: details.affected_orders || []
      };

      return await this.createException(exceptionData);
    } catch (error) {
      log.error(`Error reporting automatic exception: ${error.message}`);
      throw error;
    }
  }

  // Determină severitatea în funcție de tip și detalii
  determineSeverity(type, details) {
    switch (type) {
      case 'POWER_OUTAGE':
        return 'CRITICAL';
      case 'EQUIPMENT_FAILURE':
        return details.critical_equipment ? 'HIGH' : 'MEDIUM';
      case 'STAFF_SHORTAGE':
        return details.coverage_percentage < 50 ? 'HIGH' : 'MEDIUM';
      case 'TRANSPORT_DELAY':
        return details.delay_hours > 2 ? 'HIGH' : 'MEDIUM';
      default:
        return 'MEDIUM';
    }
  }

  // Generează titlu pentru excepția automată
  generateTitle(type, details) {
    switch (type) {
      case 'POWER_OUTAGE':
        return 'Power Outage Detected';
      case 'EQUIPMENT_FAILURE':
        return `Equipment Failure: ${details.equipment_name || 'Unknown Equipment'}`;
      case 'STAFF_SHORTAGE':
        return 'Staff Shortage Detected';
      case 'TRANSPORT_DELAY':
        return 'Transport Delay Detected';
      default:
        return `System Exception: ${type}`;
    }
  }

  // Generează descriere pentru excepția automată
  generateDescription(type, details) {
    switch (type) {
      case 'POWER_OUTAGE':
        return `Power outage detected at location. Duration: ${details.duration || 'Unknown'}`;
      case 'EQUIPMENT_FAILURE':
        return `Equipment failure detected: ${details.equipment_name}. Status: ${details.status}`;
      case 'STAFF_SHORTAGE':
        return `Staff shortage detected. Coverage: ${details.coverage_percentage}%`;
      case 'TRANSPORT_DELAY':
        return `Transport delay detected. Delay: ${details.delay_hours} hours`;
      default:
        return `Automatic system exception detected: ${JSON.stringify(details)}`;
    }
  }
}

module.exports = ExceptionService; 