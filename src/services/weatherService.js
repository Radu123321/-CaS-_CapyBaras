const repo = require('../repositories/weatherRepository');

module.exports = {
  latestAll: () => repo.latestAll(),
  latestByBranch: id => repo.latestByBranch(id),
  history: (id, days) => repo.history(id, days),
  async getAllCurrentWeather() {
    // For demo return empty array; a real impl would query weather_repository
    return [];
  },
  async getCurrentWeather(locationId) { return null; },
  async analyzeServiceImpact() { return {}; },
  async getSchedulingRecommendations() { return []; },
  async updateWeatherDataForAllLocations() { return { updated: 0 }; },
  async checkAdverseWeatherConditions() { return { alerts: 0 }; }
}; 