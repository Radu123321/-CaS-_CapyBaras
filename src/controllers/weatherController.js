const weatherService = require('../services/weatherService');
const logger = require('../core/logger');

/**
 * Weather Controller
 * HTTP endpoints for weather data and impact analysis
 */
class WeatherController {
    
    /**
     * POST /api/weather
     * Add weather snapshot (manual entry)
     */
    async addWeatherSnapshot(req, res) {
        try {
            const weatherData = {
                location_id: parseInt(req.body.location_id),
                temperature_c: parseFloat(req.body.temperature_c),
                humidity_pct: parseInt(req.body.humidity_pct),
                condition: req.body.condition,
                wind_speed: parseFloat(req.body.wind_speed) || 0,
                precipitation: parseFloat(req.body.precipitation) || 0,
                captured_at: req.body.captured_at
            };
            
            // Validate required fields
            if (!weatherData.location_id || weatherData.temperature_c === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Location ID and temperature are required'
                });
            }
            
            const snapshot = await weatherService.addWeatherSnapshot(weatherData);
            
            res.status(201).json({
                success: true,
                data: snapshot,
                message: 'Weather snapshot added successfully'
            });
        } catch (error) {
            logger.error('Error in addWeatherSnapshot:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * GET /api/weather/current
     * Get current weather for all locations
     */
    async getCurrentWeatherAll(req, res) {
        try {
            const weather = await weatherService.getAllCurrentWeather();
            
            res.json({
                success: true,
                data: weather,
                count: weather.length
            });
        } catch (error) {
            logger.error('Error in getCurrentWeatherAll:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * GET /api/weather/location/:id
     * Get current weather for specific location
     */
    async getCurrentWeatherByLocation(req, res) {
        try {
            const locationId = parseInt(req.params.id);
            
            if (isNaN(locationId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid location ID'
                });
            }
            
            const weather = await weatherService.getCurrentWeather(locationId);
            
            if (!weather) {
                return res.status(404).json({
                    success: false,
                    error: 'No weather data found for this location'
                });
            }
            
            res.json({
                success: true,
                data: weather
            });
        } catch (error) {
            logger.error(`Error in getCurrentWeatherByLocation (${req.params.id}):`, error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * GET /api/weather/impact/location/:id/service/:type
     * Analyze weather impact on specific service
     */
    async analyzeServiceImpact(req, res) {
        try {
            const locationId = parseInt(req.params.id);
            const serviceType = req.params.type.toUpperCase();
            
            if (isNaN(locationId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid location ID'
                });
            }
            
            const impact = await weatherService.analyzeServiceImpact(locationId, serviceType);
            
            res.json({
                success: true,
                data: impact
            });
        } catch (error) {
            logger.error(`Error in analyzeServiceImpact (${req.params.id}, ${req.params.type}):`, error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * GET /api/weather/recommendations/location/:id
     * Get weather-based scheduling recommendations
     */
    async getSchedulingRecommendations(req, res) {
        try {
            const locationId = parseInt(req.params.id);
            const serviceTypes = req.query.services ? req.query.services.split(',').map(s => s.toUpperCase()) : [];
            
            if (isNaN(locationId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid location ID'
                });
            }
            
            const recommendations = await weatherService.getSchedulingRecommendations(locationId, serviceTypes);
            
            res.json({
                success: true,
                data: recommendations
            });
        } catch (error) {
            logger.error(`Error in getSchedulingRecommendations (${req.params.id}):`, error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * POST /api/weather/update-all
     * Manually trigger weather data update for all locations
     */
    async updateAllWeatherData(req, res) {
        try {
            const result = await weatherService.updateWeatherDataForAllLocations();
            
            res.json({
                success: true,
                data: result,
                message: 'Weather data update completed'
            });
        } catch (error) {
            logger.error('Error in updateAllWeatherData:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * POST /api/weather/check-adverse
     * Manually trigger adverse weather conditions check
     */
    async checkAdverseConditions(req, res) {
        try {
            const result = await weatherService.checkAdverseWeatherConditions();
            
            res.json({
                success: true,
                data: result,
                message: 'Adverse weather conditions check completed'
            });
        } catch (error) {
            logger.error('Error in checkAdverseConditions:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * GET /api/weather/service-types
     * Get available service types for weather impact analysis
     */
    async getServiceTypes(req, res) {
        try {
            const serviceTypes = [
                'CAR_WASH',
                'CARPET_CLEANING',
                'WINDOW_CLEANING',
                'GENERAL_CLEANING'
            ];
            
            res.json({
                success: true,
                data: serviceTypes
            });
        } catch (error) {
            logger.error('Error in getServiceTypes:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new WeatherController();
