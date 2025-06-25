const { query } = require('../core/psql');

class NotificationRepository {
  // Creează o notificare nouă
  async create(notificationData) {
    const {
      user_id,
      type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      sent_via,
      scheduled_for,
      expires_at
    } = notificationData;
    
    const insertSQL = `
      INSERT INTO notifications (user_id, type, title, message, related_entity_type, 
                               related_entity_id, sent_via, scheduled_for, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING notification_id, user_id, type, title, message, related_entity_type,
                related_entity_id, is_read, is_sent, sent_via, scheduled_for, 
                expires_at, created_at
    `;
    
    const result = await query(insertSQL, [
      user_id, type, title, message, related_entity_type,
      related_entity_id, sent_via || ['BROWSER'], scheduled_for, expires_at
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește toate notificările pentru un utilizator
  async findByUserId(userId, filters = {}) {
    const { is_read, type, limit = 50, offset = 0 } = filters;
    
    let whereClause = 'WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;
    
    if (is_read !== undefined) {
      whereClause += ` AND is_read = $${paramIndex}`;
      params.push(is_read);
      paramIndex++;
    }
    
    if (type) {
      whereClause += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    // Exclude notificările expirate
    whereClause += ` AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`;
    
    const selectSQL = `
      SELECT notification_id, user_id, type, title, message, related_entity_type,
             related_entity_id, is_read, is_sent, sent_via, scheduled_for,
             expires_at, created_at, read_at
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    return await query(selectSQL, params);
  }

  // Găsește notificare prin ID
  async findById(notificationId) {
    const selectSQL = `
      SELECT notification_id, user_id, type, title, message, related_entity_type,
             related_entity_id, is_read, is_sent, sent_via, scheduled_for,
             expires_at, created_at, read_at
      FROM notifications
      WHERE notification_id = $1
    `;
    
    const result = await query(selectSQL, [notificationId]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește toate notificările cu filtrare opțională
  async findAll(filters = {}) {
    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    // Build WHERE clause based on filters
    if (filters.user_id) {
      paramCount++;
      whereConditions.push(`user_id = $${paramCount}`);
      params.push(filters.user_id);
    }

    if (filters.type) {
      paramCount++;
      whereConditions.push(`type = $${paramCount}`);
      params.push(filters.type);
    }

    if (filters.is_read !== undefined) {
      paramCount++;
      whereConditions.push(`is_read = $${paramCount}`);
      params.push(filters.is_read);
    }

    if (filters.is_sent !== undefined) {
      paramCount++;
      whereConditions.push(`is_sent = $${paramCount}`);
      params.push(filters.is_sent);
    }

    // Filter out expired notifications
    whereConditions.push('(expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)');

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const limit = filters.limit ? parseInt(filters.limit) : 50;
    const offset = filters.offset ? parseInt(filters.offset) : 0;

    const selectSQL = `
      SELECT notification_id, user_id, type, title, message, related_entity_type,
             related_entity_id, is_read, is_sent, sent_via, scheduled_for,
             expires_at, created_at, read_at
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return await query(selectSQL, params);
  }

  // Găsește notificările netrimitise programate
  async findPendingScheduled() {
    const selectSQL = `
      SELECT notification_id, user_id, type, title, message, related_entity_type,
             related_entity_id, sent_via, scheduled_for
      FROM notifications
      WHERE is_sent = false 
        AND scheduled_for IS NOT NULL 
        AND scheduled_for <= CURRENT_TIMESTAMP
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      ORDER BY scheduled_for ASC
    `;
    
    return await query(selectSQL);
  }

  // Găsește notificările netrimise imediate
  async findPendingImmediate() {
    const selectSQL = `
      SELECT notification_id, user_id, type, title, message, related_entity_type,
             related_entity_id, sent_via
      FROM notifications
      WHERE is_sent = false 
        AND scheduled_for IS NULL
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      ORDER BY created_at ASC
      LIMIT 100
    `;
    
    return await query(selectSQL);
  }

  // Marchează notificarea ca citită
  async markAsRead(notificationId, userId = null) {
    let whereClause = 'WHERE notification_id = $1';
    const params = [notificationId];
    
    if (userId) {
      whereClause += ' AND user_id = $2';
      params.push(userId);
    }
    
    const updateSQL = `
      UPDATE notifications 
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      ${whereClause}
      RETURNING notification_id, is_read, read_at
    `;
    
    const result = await query(updateSQL, params);
    return result && result.length > 0 ? result[0] : null;
  }

  // Marchează multiple notificări ca citite
  async markMultipleAsRead(notificationIds, userId) {
    const updateSQL = `
      UPDATE notifications 
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE notification_id = ANY($1) AND user_id = $2
      RETURNING notification_id, is_read, read_at
    `;
    
    return await query(updateSQL, [notificationIds, userId]);
  }

  // Marchează toate notificările unui utilizator ca citite
  async markAllAsRead(userId) {
    const updateSQL = `
      UPDATE notifications 
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = false
      RETURNING COUNT(*) as updated_count
    `;
    
    const result = await query(updateSQL, [userId]);
    return result && result.length > 0 ? parseInt(result[0].updated_count) : 0;
  }

  // Marchează notificarea ca trimisă
  async markAsSent(notificationId) {
    const updateSQL = `
      UPDATE notifications 
      SET is_sent = true
      WHERE notification_id = $1
      RETURNING notification_id, is_sent
    `;
    
    const result = await query(updateSQL, [notificationId]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Numără notificările necitite pentru un utilizator
  async countUnread(userId) {
    const selectSQL = `
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = $1 
        AND is_read = false
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `;
    
    const result = await query(selectSQL, [userId]);
    return result && result.length > 0 ? parseInt(result[0].unread_count) : 0;
  }

  // Numără notificările pe tip pentru un utilizator
  async countByType(userId) {
    const selectSQL = `
      SELECT type, COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      GROUP BY type
      ORDER BY count DESC
    `;
    
    return await query(selectSQL, [userId]);
  }

  // Șterge notificările expirate
  async deleteExpired() {
    const deleteSQL = `
      DELETE FROM notifications 
      WHERE expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP
      RETURNING COUNT(*) as deleted_count
    `;
    
    const result = await query(deleteSQL);
    return result && result.length > 0 ? parseInt(result[0].deleted_count) : 0;
  }

  // Șterge notificările vechi (peste X zile)
  async deleteOld(daysOld = 30) {
    const deleteSQL = `
      DELETE FROM notifications 
      WHERE created_at < CURRENT_DATE - INTERVAL '${daysOld} days'
      RETURNING COUNT(*) as deleted_count
    `;
    
    const result = await query(deleteSQL);
    return result && result.length > 0 ? parseInt(result[0].deleted_count) : 0;
  }

  // Șterge notificare specifică
  async delete(notificationId, userId = null) {
    let whereClause = 'WHERE notification_id = $1';
    const params = [notificationId];
    
    if (userId) {
      whereClause += ' AND user_id = $2';
      params.push(userId);
    }
    
    const deleteSQL = `
      DELETE FROM notifications 
      ${whereClause}
      RETURNING notification_id
    `;
    
    const result = await query(deleteSQL, params);
    return result && result.length > 0;
  }

  // Creează notificare pentru toți utilizatorii cu un anumit rol
  async createForRole(role, notificationData) {
    const {
      type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      sent_via,
      scheduled_for,
      expires_at
    } = notificationData;
    
    const insertSQL = `
      INSERT INTO notifications (user_id, type, title, message, related_entity_type, 
                               related_entity_id, sent_via, scheduled_for, expires_at)
      SELECT u.user_id, $1, $2, $3, $4, $5, $6, $7, $8
      FROM users u
      WHERE u.role = $9 AND u.is_active = true
      RETURNING notification_id, user_id
    `;
    
    return await query(insertSQL, [
      type, title, message, related_entity_type, related_entity_id,
      sent_via || ['BROWSER'], scheduled_for, expires_at, role
    ]);
  }

  // Creează notificare pentru utilizatorii unei locații
  async createForLocation(locationId, notificationData) {
    const {
      type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      sent_via,
      scheduled_for,
      expires_at
    } = notificationData;
    
    const insertSQL = `
      INSERT INTO notifications (user_id, type, title, message, related_entity_type, 
                               related_entity_id, sent_via, scheduled_for, expires_at)
      SELECT DISTINCT u.user_id, $1, $2, $3, $4, $5, $6, $7, $8
      FROM users u
      LEFT JOIN employees e ON u.user_id = e.user_id
      LEFT JOIN locations l ON u.user_id = (SELECT user_id FROM employees WHERE employee_id = l.manager_id)
      WHERE (e.location_id = $9 OR l.location_id = $9) 
        AND u.is_active = true
      RETURNING notification_id, user_id
    `;
    
    return await query(insertSQL, [
      type, title, message, related_entity_type, related_entity_id,
      sent_via || ['BROWSER'], scheduled_for, expires_at, locationId
    ]);
  }

  // Obține statistici notificări
  async getStats(userId = null) {
    let whereClause = '';
    const params = [];
    
    if (userId) {
      whereClause = 'WHERE user_id = $1';
      params.push(userId);
    }
    
    const statsSQL = `
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN is_read = true THEN 1 END) as read_notifications,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications,
        COUNT(CASE WHEN is_sent = true THEN 1 END) as sent_notifications,
        COUNT(CASE WHEN is_sent = false THEN 1 END) as pending_notifications,
        COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP THEN 1 END) as expired_notifications
      FROM notifications
      ${whereClause}
    `;
    
    const result = await query(statsSQL, params);
    return result && result.length > 0 ? result[0] : null;
  }
}

module.exports = new NotificationRepository(); 