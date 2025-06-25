const maintenanceRepository = require('../repositories/maintenanceRepository');
const log = require('../core/logger');

class MaintenanceService {
  constructor() {
    this.maintenanceRepository = maintenanceRepository;
  }

  // Creează o programare de mentenanță nouă
  async createMaintenance(maintenanceData) {
    try {
      // Validare date
      if (!maintenanceData.equipment_id || !maintenanceData.type || !maintenanceData.scheduled_date) {
        throw new Error('Equipment ID, type, and scheduled date are required');
      }

      if (!maintenanceData.description) {
        throw new Error('Description is required');
      }

      const maintenanceToCreate = {
        ...maintenanceData,
        priority: maintenanceData.priority || 'MEDIUM',
        status: maintenanceData.status || 'SCHEDULED'
      };

      const maintenance = await this.maintenanceRepository.create(maintenanceToCreate);
      log.info(`Maintenance scheduled successfully: ${maintenance.maintenance_id}`);
      return maintenance;
    } catch (error) {
      log.error(`Error creating maintenance: ${error.message}`);
      throw error;
    }
  }

  // Obține toate programările de mentenanță cu filtre
  async getAllMaintenance(filters = {}) {
    try {
      return await this.maintenanceRepository.findAll(filters);
    } catch (error) {
      log.error(`Error getting maintenance schedules: ${error.message}`);
      throw error;
    }
  }

  // Obține programare de mentenanță prin ID
  async getMaintenanceById(maintenanceId) {
    try {
      const maintenance = await this.maintenanceRepository.findById(maintenanceId);
      if (!maintenance) {
        throw new Error('Maintenance schedule not found');
      }
      return maintenance;
    } catch (error) {
      log.error(`Error getting maintenance ${maintenanceId}: ${error.message}`);
      throw error;
    }
  }

  // Obține programările de mentenanță pentru un echipament
  async getMaintenanceByEquipment(equipmentId, filters = {}) {
    try {
      return await this.maintenanceRepository.findByEquipmentId(equipmentId, filters);
    } catch (error) {
      log.error(`Error getting maintenance for equipment ${equipmentId}: ${error.message}`);
      throw error;
    }
  }

  // Obține programările de mentenanță programate pentru azi
  async getTodayScheduled(locationId = null) {
    try {
      return await this.maintenanceRepository.findScheduledToday(locationId);
    } catch (error) {
      log.error(`Error getting today's scheduled maintenance: ${error.message}`);
      throw error;
    }
  }

  // Obține programările de mentenanță în întârziere
  async getOverdue(locationId = null) {
    try {
      return await this.maintenanceRepository.findOverdue(locationId);
    } catch (error) {
      log.error(`Error getting overdue maintenance: ${error.message}`);
      throw error;
    }
  }

  // Obține programările de mentenanță urgente
  async getUrgentMaintenance(locationId = null) {
    try {
      return await this.maintenanceRepository.findUrgent(locationId);
    } catch (error) {
      log.error(`Error getting urgent maintenance: ${error.message}`);
      throw error;
    }
  }

  // Actualizează programarea de mentenanță
  async updateMaintenance(maintenanceId, maintenanceData) {
    try {
      const existingMaintenance = await this.maintenanceRepository.findById(maintenanceId);
      if (!existingMaintenance) {
        throw new Error('Maintenance schedule not found');
      }

      if (existingMaintenance.status === 'COMPLETED') {
        throw new Error('Cannot update completed maintenance');
      }

      const updatedMaintenance = await this.maintenanceRepository.update(maintenanceId, maintenanceData);
      log.info(`Maintenance updated successfully: ${maintenanceId}`);
      return updatedMaintenance;
    } catch (error) {
      log.error(`Error updating maintenance ${maintenanceId}: ${error.message}`);
      throw error;
    }
  }

  // Actualizează statusul programării de mentenanță
  async updateMaintenanceStatus(maintenanceId, status, additionalData = {}) {
    try {
      const maintenance = await this.maintenanceRepository.updateStatus(maintenanceId, status, additionalData);
      log.info(`Maintenance status updated: ${maintenanceId} -> ${status}`);
      return maintenance;
    } catch (error) {
      log.error(`Error updating maintenance status ${maintenanceId}: ${error.message}`);
      throw error;
    }
  }

  // Începe mentenanța
  async startMaintenance(maintenanceId) {
    try {
      const maintenance = await this.maintenanceRepository.startMaintenance(maintenanceId);
      log.info(`Maintenance started: ${maintenanceId}`);
      return maintenance;
    } catch (error) {
      log.error(`Error starting maintenance ${maintenanceId}: ${error.message}`);
      throw error;
    }
  }

  // Finalizează mentenanța
  async completeMaintenance(maintenanceId, actualCost = null, completionNotes = null) {
    try {
      const maintenance = await this.maintenanceRepository.completeMaintenance(
        maintenanceId, 
        actualCost, 
        completionNotes
      );
      log.info(`Maintenance completed: ${maintenanceId}`);
      return maintenance;
    } catch (error) {
      log.error(`Error completing maintenance ${maintenanceId}: ${error.message}`);
      throw error;
    }
  }

  // Șterge programarea de mentenanță
  async deleteMaintenance(maintenanceId) {
    try {
      const maintenance = await this.maintenanceRepository.findById(maintenanceId);
      if (!maintenance) {
        throw new Error('Maintenance schedule not found');
      }

      if (maintenance.status === 'IN_PROGRESS') {
        throw new Error('Cannot delete maintenance in progress');
      }

      await this.maintenanceRepository.delete(maintenanceId);
      log.info(`Maintenance deleted successfully: ${maintenanceId}`);
      return { success: true, message: 'Maintenance schedule deleted successfully' };
    } catch (error) {
      log.error(`Error deleting maintenance ${maintenanceId}: ${error.message}`);
      throw error;
    }
  }

  // Obține tipurile de mentenanță
  async getMaintenanceTypes() {
    try {
      return await this.maintenanceRepository.getTypes();
    } catch (error) {
      log.error(`Error getting maintenance types: ${error.message}`);
      throw error;
    }
  }

  // Obține nivelurile de prioritate
  async getPriorityLevels() {
    try {
      return await this.maintenanceRepository.getPriorityLevels();
    } catch (error) {
      log.error(`Error getting priority levels: ${error.message}`);
      throw error;
    }
  }

  // Obține statusurile valide
  async getValidStatuses() {
    try {
      return await this.maintenanceRepository.getValidStatuses();
    } catch (error) {
      log.error(`Error getting valid statuses: ${error.message}`);
      throw error;
    }
  }

  // Obține statistici mentenanță
  async getMaintenanceStats(filters = {}) {
    try {
      return await this.maintenanceRepository.getStats(filters);
    } catch (error) {
      log.error(`Error getting maintenance stats: ${error.message}`);
      throw error;
    }
  }

  // Obține statistici mentenanță pe echipament
  async getStatsByEquipment(locationId = null) {
    try {
      return await this.maintenanceRepository.getStatsByEquipment(locationId);
    } catch (error) {
      log.error(`Error getting maintenance stats by equipment: ${error.message}`);
      throw error;
    }
  }

  // Obține programul de mentenanță viitor
  async getUpcomingSchedule(days = 7, locationId = null) {
    try {
      return await this.maintenanceRepository.getUpcomingSchedule(days, locationId);
    } catch (error) {
      log.error(`Error getting upcoming maintenance schedule: ${error.message}`);
      throw error;
    }
  }

  // Curăță înregistrările vechi finalizate
  async cleanupOldCompleted(daysOld = 365) {
    try {
      const result = await this.maintenanceRepository.cleanupOldCompleted(daysOld);
      log.info(`Cleaned up old maintenance records: ${result.deleted_count} records deleted`);
      return result;
    } catch (error) {
      log.error(`Error cleaning up old maintenance records: ${error.message}`);
      throw error;
    }
  }
}

module.exports = MaintenanceService; 