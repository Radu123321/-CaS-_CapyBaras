const repo = require('../repositories/transportRepository');

module.exports = {
  list: filters => repo.list(filters),
  getTransportById: id => repo.get ? repo.get(id) : Promise.resolve(null),
  getActiveTransports: () => repo.list({ status: 'ON_ROUTE' }),
  createTransport: data => repo.create ? repo.create(data) : Promise.resolve({ todo: true }),
  updateStatus: (id, status) => repo.updateStatus(id, status),
  closeForOrder: orderId => repo.closeForOrder(orderId)
}; 