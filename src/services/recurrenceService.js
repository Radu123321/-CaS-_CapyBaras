const recurrenceRepository = require('../repositories/recurrenceRepository');
const log = require('../core/logger');

class RecurrenceService {
  constructor() {
    this.recurrenceRepository = recurrenceRepository;
  }

  // Creează o programare recurentă nouă
  async createRecurrence(recurrenceData) {
    try {
      // Validare date
      if (!recurrenceData.customer_id || !recurrenceData.location_id || !recurrenceData.service_id) {
        throw new Error('Customer ID, location ID, and service ID are required');
      }

      if (!recurrenceData.recurrence_pattern || !recurrenceData.start_date) {
        throw new Error('Recurrence pattern and start date are required');
      }

      // Calculează următoarea execuție
      const nextExecution = this.recurrenceRepository.calculateNextExecution(
        new Date(recurrenceData.start_date),
        recurrenceData.recurrence_pattern
      );

      const recurrenceToCreate = {
        ...recurrenceData,
        next_execution: nextExecution,
        is_active: recurrenceData.is_active !== undefined ? recurrenceData.is_active : true
      };

      const recurrence = await this.recurrenceRepository.create(recurrenceToCreate);
      log.info(`Recurring schedule created successfully: ${recurrence.recurring_schedule_id}`);
      return recurrence;
    } catch (error) {
      log.error(`Error creating recurring schedule: ${error.message}`);
      throw error;
    }
  }

  // Obține toate programările recurente cu filtre
  async getAllRecurrences(filters = {}) {
    try {
      return await this.recurrenceRepository.findAll(filters);
    } catch (error) {
      log.error(`Error getting recurring schedules: ${error.message}`);
      throw error;
    }
  }

  // Obține programare recurentă prin ID
  async getRecurrenceById(recurringScheduleId) {
    try {
      const recurrence = await this.recurrenceRepository.findById(recurringScheduleId);
      if (!recurrence) {
        throw new Error('Recurring schedule not found');
      }
      return recurrence;
    } catch (error) {
      log.error(`Error getting recurring schedule ${recurringScheduleId}: ${error.message}`);
      throw error;
    }
  }

  // Obține programările recurente pentru un client
  async getRecurrencesByCustomer(customerId) {
    try {
      return await this.recurrenceRepository.findByCustomerId(customerId);
    } catch (error) {
      log.error(`Error getting recurring schedules for customer ${customerId}: ${error.message}`);
      throw error;
    }
  }

  // Obține programările recurente care trebuie executate
  async getDueRecurrences(beforeDate = null) {
    try {
      return await this.recurrenceRepository.findDueForExecution(beforeDate);
    } catch (error) {
      log.error(`Error getting due recurring schedules: ${error.message}`);
      throw error;
    }
  }

  // Actualizează programarea recurentă
  async updateRecurrence(recurringScheduleId, recurrenceData) {
    try {
      const existingRecurrence = await this.recurrenceRepository.findById(recurringScheduleId);
      if (!existingRecurrence) {
        throw new Error('Recurring schedule not found');
      }

      // Recalculează următoarea execuție dacă s-a schimbat pattern-ul
      if (recurrenceData.recurrence_pattern && 
          recurrenceData.recurrence_pattern !== existingRecurrence.recurrence_pattern) {
        const nextExecution = this.recurrenceRepository.calculateNextExecution(
          new Date(),
          recurrenceData.recurrence_pattern
        );
        recurrenceData.next_execution = nextExecution;
      }

      const updatedRecurrence = await this.recurrenceRepository.update(recurringScheduleId, recurrenceData);
      log.info(`Recurring schedule updated successfully: ${recurringScheduleId}`);
      return updatedRecurrence;
    } catch (error) {
      log.error(`Error updating recurring schedule ${recurringScheduleId}: ${error.message}`);
      throw error;
    }
  }

  // Actualizează următoarea execuție
  async updateNextExecution(recurringScheduleId, nextExecution) {
    try {
      const recurrence = await this.recurrenceRepository.updateNextExecution(
        recurringScheduleId, 
        nextExecution
      );
      log.info(`Next execution updated: ${recurringScheduleId}`);
      return recurrence;
    } catch (error) {
      log.error(`Error updating next execution ${recurringScheduleId}: ${error.message}`);
      throw error;
    }
  }

  // Activează/Dezactivează programarea recurentă
  async updateActiveStatus(recurringScheduleId, isActive) {
    try {
      const recurrence = await this.recurrenceRepository.updateActiveStatus(
        recurringScheduleId, 
        isActive
      );
      log.info(`Recurring schedule active status updated: ${recurringScheduleId} -> ${isActive}`);
      return recurrence;
    } catch (error) {
      log.error(`Error updating active status ${recurringScheduleId}: ${error.message}`);
      throw error;
    }
  }

  // Șterge programarea recurentă
  async deleteRecurrence(recurringScheduleId) {
    try {
      const recurrence = await this.recurrenceRepository.findById(recurringScheduleId);
      if (!recurrence) {
        throw new Error('Recurring schedule not found');
      }

      await this.recurrenceRepository.delete(recurringScheduleId);
      log.info(`Recurring schedule deleted successfully: ${recurringScheduleId}`);
      return { success: true, message: 'Recurring schedule deleted successfully' };
    } catch (error) {
      log.error(`Error deleting recurring schedule ${recurringScheduleId}: ${error.message}`);
      throw error;
    }
  }

  // Găsește programările recurente expirate
  async getExpiredRecurrences() {
    try {
      return await this.recurrenceRepository.findExpired();
    } catch (error) {
      log.error(`Error getting expired recurring schedules: ${error.message}`);
      throw error;
    }
  }

  // Dezactivează programările recurente expirate
  async deactivateExpired() {
    try {
      const result = await this.recurrenceRepository.deactivateExpired();
      log.info(`Deactivated expired recurring schedules: ${result.updated_count} schedules`);
      return result;
    } catch (error) {
      log.error(`Error deactivating expired recurring schedules: ${error.message}`);
      throw error;
    }
  }

  // Obține statistici programări recurente
  async getRecurrenceStats() {
    try {
      return await this.recurrenceRepository.getStats();
    } catch (error) {
      log.error(`Error getting recurring schedule stats: ${error.message}`);
      throw error;
    }
  }

  // Obține statistici pe tip de pattern
  async getStatsByPattern() {
    try {
      return await this.recurrenceRepository.getStatsByPattern();
    } catch (error) {
      log.error(`Error getting stats by pattern: ${error.message}`);
      throw error;
    }
  }

  // Obține top clienți cu cele mai multe programări recurente
  async getTopCustomersBySchedules(limit = 10) {
    try {
      return await this.recurrenceRepository.getTopCustomersBySchedules(limit);
    } catch (error) {
      log.error(`Error getting top customers by schedules: ${error.message}`);
      throw error;
    }
  }

  // Procesează programările recurente care trebuie executate
  async processRecurringSchedules() {
    try {
      const dueSchedules = await this.recurrenceRepository.findDueForExecution();
      const processedSchedules = [];

      for (const schedule of dueSchedules) {
        try {
          // Calculează următoarea execuție
          const nextExecution = this.recurrenceRepository.calculateNextExecution(
            new Date(schedule.next_execution),
            schedule.recurrence_pattern
          );

          // Actualizează următoarea execuție
          await this.recurrenceRepository.updateNextExecution(
            schedule.recurring_schedule_id,
            nextExecution
          );

          processedSchedules.push({
            recurring_schedule_id: schedule.recurring_schedule_id,
            customer_id: schedule.customer_id,
            location_id: schedule.location_id,
            service_id: schedule.service_id,
            next_execution: nextExecution,
            original_execution: schedule.next_execution
          });
        } catch (error) {
          log.error(`Error processing recurring schedule ${schedule.recurring_schedule_id}: ${error.message}`);
        }
      }

      log.info(`Processed ${processedSchedules.length} recurring schedules`);
      return {
        processed_count: processedSchedules.length,
        schedules: processedSchedules
      };
    } catch (error) {
      log.error(`Error processing recurring schedules: ${error.message}`);
      throw error;
    }
  }
}

module.exports = RecurrenceService; 