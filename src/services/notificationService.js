const notificationRepository = require('../repositories/notificationRepository');
const log = require('../core/logger');

// Valid notification types
const VALID_NOTIFICATION_TYPES = [
  'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_COMPLETED', 'ORDER_CANCELLED',
  'EQUIPMENT_FAILURE', 'EQUIPMENT_MAINTENANCE', 'EQUIPMENT_AVAILABLE',
  'STAFF_SHORTAGE', 'STAFF_AVAILABLE', 'SHIFT_REMINDER',
  'INVENTORY_LOW', 'INVENTORY_CRITICAL', 'INVENTORY_RESTOCKED',
  'TRANSPORT_ASSIGNED', 'TRANSPORT_DELAYED', 'TRANSPORT_COMPLETED',
  'SYSTEM_ALERT', 'SYSTEM_MAINTENANCE', 'SYSTEM_UPDATE',
  'CUSTOMER_FEEDBACK', 'CUSTOMER_COMPLAINT', 'CUSTOMER_REVIEW',
  'TEST_NOTIFICATION', 'GENERAL_ANNOUNCEMENT'
];

// Valid channels
const VALID_CHANNELS = ['EMAIL', 'BROWSER', 'SMS'];

// Valid priorities
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

async function createNotification(notificationData) {
  log.debug(`NotificationService: Creating notification of type ${notificationData.type}`);
  
  try {
    // Validate required fields
    if (!notificationData.type || !notificationData.message) {
      throw new Error('type and message are required');
    }
    
    // Validate type
    if (!VALID_NOTIFICATION_TYPES.includes(notificationData.type)) {
      throw new Error(`Invalid notification type. Must be one of: ${VALID_NOTIFICATION_TYPES.join(', ')}`);
    }
    
    // Validate channel
    if (notificationData.channel && !VALID_CHANNELS.includes(notificationData.channel)) {
      throw new Error(`Invalid channel. Must be one of: ${VALID_CHANNELS.join(', ')}`);
    }
    
    // Validate priority
    if (notificationData.priority && !VALID_PRIORITIES.includes(notificationData.priority)) {
      throw new Error(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }
    
    // Set defaults
    const notificationDefaults = {
      channel: 'BROWSER',
      priority: 'MEDIUM',
      is_read: false,
      ...notificationData
    };
    
    const notification = await notificationRepository.create(notificationDefaults);
    
    if (notification) {
      log.info(`NotificationService: Created notification ${notification.notification_id}`);
      return notification;
    } else {
      throw new Error('Failed to create notification');
    }
  } catch (error) {
    log.error(`NotificationService: Failed to create notification: ${error.message}`);
    throw error;
  }
}

async function getAllNotifications(filters = {}) {
  log.debug('NotificationService: Getting all notifications');
  
  try {
    const notifications = await notificationRepository.findAll(filters);
    log.debug(`NotificationService: Found ${notifications.length} notifications`);
    return notifications;
  } catch (error) {
    log.error(`NotificationService: Failed to get notifications: ${error.message}`);
    throw error;
  }
}

async function getNotificationById(notificationId) {
  log.debug(`NotificationService: Getting notification by ID ${notificationId}`);
  
  try {
    return await notificationRepository.findById(notificationId);
  } catch (error) {
    log.error(`NotificationService: Failed to get notification ${notificationId}: ${error.message}`);
    throw error;
  }
}

async function getNotificationsByUser(userId, filters = {}) {
  log.debug(`NotificationService: Getting notifications for user ${userId}`);
  
  try {
    const notifications = await notificationRepository.findByUserId(userId, filters);
    log.debug(`NotificationService: Found ${notifications.length} notifications for user ${userId}`);
    return notifications;
  } catch (error) {
    log.error(`NotificationService: Failed to get notifications for user ${userId}: ${error.message}`);
    throw error;
  }
}

async function getNotificationsByRole(role, filters = {}) {
  log.debug(`NotificationService: Getting notifications for role ${role}`);
  
  try {
    const notifications = await notificationRepository.findByRole(role, filters);
    log.debug(`NotificationService: Found ${notifications.length} notifications for role ${role}`);
    return notifications;
  } catch (error) {
    log.error(`NotificationService: Failed to get notifications for role ${role}: ${error.message}`);
    throw error;
  }
}

async function getNotificationsByLocation(locationId, filters = {}) {
  log.debug(`NotificationService: Getting notifications for location ${locationId}`);
  
  try {
    const notifications = await notificationRepository.findByLocation(locationId, filters);
    log.debug(`NotificationService: Found ${notifications.length} notifications for location ${locationId}`);
    return notifications;
  } catch (error) {
    log.error(`NotificationService: Failed to get notifications for location ${locationId}: ${error.message}`);
    throw error;
  }
}

async function getUnreadNotifications(userId) {
  log.debug(`NotificationService: Getting unread notifications for user ${userId}`);
  
  try {
    const notifications = await notificationRepository.findUnread(userId);
    log.debug(`NotificationService: Found ${notifications.length} unread notifications for user ${userId}`);
    return notifications;
  } catch (error) {
    log.error(`NotificationService: Failed to get unread notifications for user ${userId}: ${error.message}`);
    throw error;
  }
}

async function markAsRead(notificationId, userId = null) {
  log.debug(`NotificationService: Marking notification ${notificationId} as read`);
  
  try {
    const result = await notificationRepository.markAsRead(notificationId, userId);
    
    if (result) {
      log.info(`NotificationService: Marked notification ${notificationId} as read`);
      return result;
    } else {
      throw new Error('Notification not found');
    }
  } catch (error) {
    log.error(`NotificationService: Failed to mark notification as read: ${error.message}`);
    throw error;
  }
}

async function markAllAsRead(userId) {
  log.debug(`NotificationService: Marking all notifications as read for user ${userId}`);
  
  try {
    const result = await notificationRepository.markAllAsRead(userId);
    log.info(`NotificationService: Marked ${result} notifications as read for user ${userId}`);
    return result;
  } catch (error) {
    log.error(`NotificationService: Failed to mark all notifications as read: ${error.message}`);
    throw error;
  }
}

async function deleteNotification(notificationId) {
  log.debug(`NotificationService: Deleting notification ${notificationId}`);
  
  try {
    const result = await notificationRepository.delete(notificationId);
    
    if (result) {
      log.info(`NotificationService: Deleted notification ${notificationId}`);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    log.error(`NotificationService: Failed to delete notification ${notificationId}: ${error.message}`);
    throw error;
  }
}

async function createForRole(role, notificationData) {
  log.debug(`NotificationService: Creating notification for role ${role}`);
  
  try {
    const notification = await notificationRepository.createForRole(role, notificationData);
    
    if (notification) {
      log.info(`NotificationService: Created notification for role ${role}`);
      return notification;
    } else {
      throw new Error('Failed to create notification for role');
    }
  } catch (error) {
    log.error(`NotificationService: Failed to create notification for role ${role}: ${error.message}`);
    throw error;
  }
}

async function createForLocation(locationId, notificationData) {
  log.debug(`NotificationService: Creating notification for location ${locationId}`);
  
  try {
    const notification = await notificationRepository.createForLocation(locationId, notificationData);
    
    if (notification) {
      log.info(`NotificationService: Created notification for location ${locationId}`);
      return notification;
    } else {
      throw new Error('Failed to create notification for location');
    }
  } catch (error) {
    log.error(`NotificationService: Failed to create notification for location ${locationId}: ${error.message}`);
    throw error;
  }
}

async function scheduleNotification(notificationData, scheduledFor) {
  log.debug(`NotificationService: Scheduling notification for ${scheduledFor}`);
  
  try {
    const scheduledData = {
      ...notificationData,
      scheduled_for: new Date(scheduledFor)
    };
    
    const notification = await notificationRepository.create(scheduledData);
    
    if (notification) {
      log.info(`NotificationService: Scheduled notification ${notification.notification_id} for ${scheduledFor}`);
      return notification;
    } else {
      throw new Error('Failed to schedule notification');
    }
  } catch (error) {
    log.error(`NotificationService: Failed to schedule notification: ${error.message}`);
    throw error;
  }
}

async function getPendingScheduled() {
  log.debug('NotificationService: Getting pending scheduled notifications');
  
  try {
    const notifications = await notificationRepository.findPendingScheduled();
    log.debug(`NotificationService: Found ${notifications.length} pending scheduled notifications`);
    return notifications;
  } catch (error) {
    log.error(`NotificationService: Failed to get pending scheduled notifications: ${error.message}`);
    throw error;
  }
}

async function getNotificationStats(filters = {}) {
  log.debug('NotificationService: Getting notification statistics');
  
  try {
    return await notificationRepository.getStats(filters);
  } catch (error) {
    log.error(`NotificationService: Failed to get notification stats: ${error.message}`);
    throw error;
  }
}

async function cleanupOldNotifications(daysOld = 30) {
  log.debug(`NotificationService: Cleaning up notifications older than ${daysOld} days`);
  
  try {
    const result = await notificationRepository.cleanup(daysOld);
    log.info(`NotificationService: Cleaned up ${result} old notifications`);
    return result;
  } catch (error) {
    log.error(`NotificationService: Failed to cleanup old notifications: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createNotification,
  getAllNotifications,
  getNotificationById,
  getNotificationsByUser,
  getNotificationsByRole,
  getNotificationsByLocation,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createForRole,
  createForLocation,
  scheduleNotification,
  getPendingScheduled,
  getNotificationStats,
  cleanupOldNotifications,
  VALID_NOTIFICATION_TYPES,
  VALID_CHANNELS,
  VALID_PRIORITIES
}; 