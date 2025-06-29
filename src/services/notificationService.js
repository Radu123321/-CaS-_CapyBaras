const repo = require('../repositories/notificationRepository');

module.exports = {
  unseenByUser: uid => repo.unseenByUser(uid),
  markSeen: id => repo.markSeen(id)
}; 