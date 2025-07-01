const repo = require('../repositories/serviceRepository');

// Helper to translate legacy controller payload → schema v3 columns
function normalizePayload(p) {
  if (!p) return {};
  return {
    // category code (service type)
    categoryCode: p.categoryCode || p.category_code || p.service_type || null,
    name: p.name || p.service_name || p.description || null,
    description: p.description || null,
    basePrice: p.basePrice !== undefined ? p.basePrice : p.base_price,
    currencyCode: p.currencyCode || p.currency_code || undefined,
    avgDurationMin: p.avgDurationMin || p.avg_duration_min || 30 // default 30 min
  };
}

module.exports = {
  // generic wrappers
  list: () => repo.list(),
  get: id => repo.get(id),

  create: data => {
    const svc = normalizePayload(data);
    return repo.create(svc, data.requirements || []);
  },

  update: (id, data = {}) => repo.update(id, normalizePayload(data)),
  remove: id => repo.delete ? repo.delete(id) : repo.remove(id),

  // controller-friendly aliases
  getAllServices: () => repo.list(),
  getServiceById: id => repo.get(id),
  createService: data => module.exports.create(data),
  updateService: (id, data) => module.exports.update(id, data),
  deleteService: id => module.exports.remove(id)
}; 