const Base = require('./_base');
const pool = require('../core/psql');

/**
 * NotificationRepository – generic message queue (optional).
 * The notifications table is not part of the base schema yet but will be added
 * shortly. This repository is here so that the rest of the code does not have
 * to change when that migration lands.
 */
class NotificationRepository extends Base {
  constructor() {
    super('notifications'); // EXPECTED table: id, user_id, channel, payload, seen_at, created_at
  }

  unseenByUser(userId) {
    return this.list('user_id = $1 AND seen_at IS NULL', [userId]);
  }

  markSeen(id) {
    return this.patch(id, 'seen_at = now()', []);
  }
}

module.exports = new NotificationRepository(); 