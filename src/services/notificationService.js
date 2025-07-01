const repo = require('../repositories/notificationRepository');

module.exports = {
  unseenByUser: uid => repo.unseenByUser(uid),
  markSeen: id => repo.markSeen(id),

  /**
   * Simple fallback: some controllers expect getAllNotifications({ limit, user_id })
   * În absenţa unei tabele concrete pentru notificări, returnăm fie unseenByUser,
   * fie o listă goală, astfel încât endpoint-ul /api/notifications/recent să
   * răspundă 200 în loc de 500.
   */
  async getAllNotifications(filters = {}) {
    const { user_id: userId, limit = 20 } = filters;
    if (userId) {
      const rows = await repo.unseenByUser(userId);
      return rows.slice(0, limit);
    }
    return [];
  }
}; 