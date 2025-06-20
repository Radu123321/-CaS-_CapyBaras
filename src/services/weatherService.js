const weatherRepository = require('../repositories/weatherRepository');
const alertService = require('./alertService');
const logger = require('../core/logger');

/**
 * Weather Service
 * Business logic for weather data management and impact analysis
 */
class WeatherService {
    
    constructor() {
        // Weather impact rules for different service types
        this.serviceImpactRules = {
            'CAR_WASH': {
                'HEAVY_RAIN': { efficiency: 0.3, delay_minutes: 60, recommended: false },
                'LIGHT_RAIN': { efficiency: 0.7, delay_minutes: 15, recommended: false },
                'HIGH_WIND': { efficiency: 0.8, delay_minutes: 10, recommended: true },
                'EXTREME_HEAT': { efficiency: 0.9, delay_minutes: 5, recommended: true },
                'FREEZING': { efficiency: 0.4, delay_minutes: 30, recommended: false },
                'NORMAL': { efficiency: 1.0, delay_minutes: 0, recommended: true }
            },
            'CARPET_CLEANING': {
                'HEAVY_RAIN': { efficiency: 0.8, delay_minutes: 20, recommended: true },
                'LIGHT_RAIN': { efficiency: 0.9, delay_minutes: 10, recommended: true },
                'HIGH_WIND': { efficiency: 0.95, delay_minutes: 5, recommended: true },
                'EXTREME_HEAT': { efficiency: 0.85, delay_minutes: 15, recommended: true },
                'FREEZING': { efficiency: 0.9, delay_minutes: 10, recommended: true },
                'NORMAL': { efficiency: 1.0, delay_minutes: 0, recommended: true }
            },
            'WINDOW_CLEANING': {
                'HEAVY_RAIN': { efficiency: 0.2, delay_minutes: 120, recommended: false },
                'LIGHT_RAIN': { efficiency: 0.5, delay_minutes: 30, recommended: false },
                'HIGH_WIND': { efficiency: 0.6, delay_minutes: 20, recommended: false },
                'EXTREME_HEAT': { efficiency: 0.8, delay_minutes: 10, recommended: true },
                'FREEZING': { efficiency: 0.3, delay_minutes: 60, recommended: false },
                'NORMAL': { efficiency: 1.0, delay_minutes: 0, recommended: true }
            },
            'GENERAL_CLEANING': {
                'HEAVY_RAIN': { efficiency: 0.9, delay_minutes: 10, recommended: true },
                'LIGHT_RAIN': { efficiency: 0.95, delay_minutes: 5, recommended: true },
                'HIGH_WIND': { efficiency: 0.95, delay_minutes: 5, recommended: true },
                'EXTREME_HEAT': { efficiency: 0.85, delay_minutes: 15, recommended: true },
                'FREEZING': { efficiency: 0.9, delay_minutes: 10, recommended: true },
                'NORMAL': { efficiency: 1.0, delay_minutes: 0, recommended: true }
            }
        };
    }
    
    /**
     * Add weather snapshot (manual or API)
     */
    async addWeatherSnapshot(weatherData) {
        try {
            // Validate required fields
            if (!weatherData.location_id) {
                throw new Error('Location ID is required');
            }
            
            // Create weather snapshot
            const snapshot = await weatherRepository.createSnapshot(weatherData);
            
            logger.info(`Weather snapshot created for location ${weatherData.location_id}`, {
                temperature: weatherData.temperature_c,
                condition: weatherData.condition,
                precipitation: weatherData.precipitation
            });
            
            // Analyze for adverse conditions and generate alerts
            await this.analyzeAndAlertAdverseConditions(snapshot);
            
            return snapshot;
        } catch (error) {
            logger.error('Error adding weather snapshot:', error);
            throw error;
        }
    }
    
    /**
     * Get current weather for location
     */
    async getCurrentWeather(locationId) {
        try {
            const weather = await weatherRepository.getLatestByLocation(locationId);
            
            if (!weather) {
                return null;
            }
            
            // Add weather analysis
            const analysis = this.analyzeWeatherConditions(weather);
            
            return {
                ...weather,
                analysis
            };
        } catch (error) {
            logger.error(`Error getting current weather for location ${locationId}:`, error);
            throw error;
        }
    }
    
    /**
     * Get weather for all locations
     */
    async getAllCurrentWeather() {
        try {
            const weatherSnapshots = await weatherRepository.getAllLatestSnapshots();
            
            return weatherSnapshots.map(weather => ({
                ...weather,
                analysis: this.analyzeWeatherConditions(weather)
            }));
        } catch (error) {
            logger.error('Error getting all current weather:', error);
            throw error;
        }
    }
    
    /**
     * Analyze weather impact on service efficiency
     */
    async analyzeServiceImpact(locationId, serviceType) {
        try {
            const weather = await weatherRepository.getLatestByLocation(locationId);
            
            if (!weather) {
                return {
                    weather_available: false,
                    efficiency: 1.0,
                    delay_minutes: 0,
                    recommended: true,
                    message: 'No weather data available'
                };
            }
            
            const weatherSeverity = this.getWeatherSeverity(weather);
            const impactRules = this.serviceImpactRules[serviceType] || this.serviceImpactRules['GENERAL_CLEANING'];
            const impact = impactRules[weatherSeverity] || impactRules['NORMAL'];
            
            return {
                weather_available: true,
                current_weather: weather,
                weather_severity: weatherSeverity,
                efficiency: impact.efficiency,
                delay_minutes: impact.delay_minutes,
                recommended: impact.recommended,
                message: this.getImpactMessage(serviceType, weatherSeverity, impact)
            };
        } catch (error) {
            logger.error(`Error analyzing service impact for location ${locationId}:`, error);
            throw error;
        }
    }
    
    /**
     * Get weather-based scheduling recommendations
     */
    async getSchedulingRecommendations(locationId, serviceTypes = []) {
        try {
            const weather = await weatherRepository.getLatestByLocation(locationId);
            
            if (!weather) {
                return {
                    weather_available: false,
                    recommendations: serviceTypes.map(type => ({
                        service_type: type,
                        recommended: true,
                        efficiency: 1.0,
                        message: 'No weather data available'
                    }))
                };
            }
            
            const weatherSeverity = this.getWeatherSeverity(weather);
            const recommendations = [];
            
            // If no specific service types provided, analyze all
            const typesToAnalyze = serviceTypes.length > 0 ? serviceTypes : Object.keys(this.serviceImpactRules);
            
            for (const serviceType of typesToAnalyze) {
                const impactRules = this.serviceImpactRules[serviceType] || this.serviceImpactRules['GENERAL_CLEANING'];
                const impact = impactRules[weatherSeverity] || impactRules['NORMAL'];
                
                recommendations.push({
                    service_type: serviceType,
                    recommended: impact.recommended,
                    efficiency: impact.efficiency,
                    delay_minutes: impact.delay_minutes,
                    message: this.getImpactMessage(serviceType, weatherSeverity, impact)
                });
            }
            
            // Sort by efficiency (best first)
            recommendations.sort((a, b) => b.efficiency - a.efficiency);
            
            return {
                weather_available: true,
                current_weather: weather,
                weather_severity: weatherSeverity,
                recommendations
            };
        } catch (error) {
            logger.error(`Error getting scheduling recommendations for location ${locationId}:`, error);
            throw error;
        }
    }
    
    /**
     * Update weather data for all locations
     */
    async updateWeatherDataForAllLocations() {
        try {
            logger.info('Starting weather data update for all locations...');
            
            const locationsNeedingUpdate = await weatherRepository.getLocationsNeedingWeatherUpdate();
            let updatesGenerated = 0;
            
            for (const location of locationsNeedingUpdate) {
                // Generate simulated weather data (in real app, this would call weather API)
                const weatherData = this.generateSimulatedWeatherData(location);
                await this.addWeatherSnapshot(weatherData);
                updatesGenerated++;
            }
            
            logger.info(`Weather data update completed. Updated ${updatesGenerated} locations.`);
            return { locations_updated: updatesGenerated };
        } catch (error) {
            logger.error('Error updating weather data:', error);
            throw error;
        }
    }
    
    /**
     * Check for adverse weather conditions and generate alerts
     */
    async checkAdverseWeatherConditions() {
        try {
            logger.info('Starting adverse weather conditions check...');
            
            const adverseConditions = await weatherRepository.getAdverseWeatherConditions();
            let alertsGenerated = 0;
            
            for (const condition of adverseConditions) {
                await this.generateWeatherAlert(condition);
                alertsGenerated++;
            }
            
            logger.info(`Adverse weather check completed. Generated ${alertsGenerated} alerts.`);
            return { checked: adverseConditions.length, alerts_generated: alertsGenerated };
        } catch (error) {
            logger.error('Error checking adverse weather conditions:', error);
            throw error;
        }
    }
    
    // Helper methods
    analyzeWeatherConditions(weather) {
        const severity = this.getWeatherSeverity(weather);
        
        return {
            severity,
            is_adverse: severity !== 'NORMAL',
            temperature_category: this.getTemperatureCategory(weather.temperature_c),
            precipitation_level: this.getPrecipitationLevel(weather.precipitation),
            wind_level: this.getWindLevel(weather.wind_speed),
            comfort_index: this.calculateComfortIndex(weather)
        };
    }
    
    getWeatherSeverity(weather) {
        if (weather.precipitation > 5) return 'HEAVY_RAIN';
        if (weather.precipitation > 0) return 'LIGHT_RAIN';
        if (weather.wind_speed > 30) return 'HIGH_WIND';
        if (weather.temperature_c < 0) return 'FREEZING';
        if (weather.temperature_c > 35) return 'EXTREME_HEAT';
        return 'NORMAL';
    }
    
    getTemperatureCategory(temperature) {
        if (temperature < 0) return 'FREEZING';
        if (temperature < 10) return 'COLD';
        if (temperature < 25) return 'MILD';
        if (temperature < 35) return 'WARM';
        return 'HOT';
    }
    
    getPrecipitationLevel(precipitation) {
        if (precipitation === 0) return 'NONE';
        if (precipitation < 2) return 'LIGHT';
        if (precipitation < 5) return 'MODERATE';
        return 'HEAVY';
    }
    
    getWindLevel(windSpeed) {
        if (windSpeed < 10) return 'CALM';
        if (windSpeed < 20) return 'LIGHT';
        if (windSpeed < 30) return 'MODERATE';
        return 'STRONG';
    }
    
    calculateComfortIndex(weather) {
        let index = 100;
        
        // Temperature impact
        if (weather.temperature_c < 5 || weather.temperature_c > 30) index -= 30;
        else if (weather.temperature_c < 10 || weather.temperature_c > 25) index -= 15;
        
        // Precipitation impact
        if (weather.precipitation > 5) index -= 40;
        else if (weather.precipitation > 0) index -= 20;
        
        // Wind impact
        if (weather.wind_speed > 30) index -= 25;
        else if (weather.wind_speed > 20) index -= 10;
        
        // Humidity impact
        if (weather.humidity_pct > 80) index -= 10;
        else if (weather.humidity_pct < 30) index -= 5;
        
        return Math.max(0, index);
    }
    
    getImpactMessage(serviceType, weatherSeverity, impact) {
        if (weatherSeverity === 'NORMAL') {
            return `Ideal conditions for ${serviceType.toLowerCase().replace('_', ' ')}`;
        }
        
        const messages = {
            'HEAVY_RAIN': `Heavy rain significantly impacts ${serviceType.toLowerCase().replace('_', ' ')}`,
            'LIGHT_RAIN': `Light rain may affect ${serviceType.toLowerCase().replace('_', ' ')}`,
            'HIGH_WIND': `High winds may cause delays for ${serviceType.toLowerCase().replace('_', ' ')}`,
            'EXTREME_HEAT': `Extreme heat may reduce efficiency for ${serviceType.toLowerCase().replace('_', ' ')}`,
            'FREEZING': `Freezing conditions significantly impact ${serviceType.toLowerCase().replace('_', ' ')}`
        };
        
        return messages[weatherSeverity] || `Weather may impact ${serviceType.toLowerCase().replace('_', ' ')}`;
    }
    
    async analyzeAndAlertAdverseConditions(weather) {
        const severity = this.getWeatherSeverity(weather);
        
        if (severity !== 'NORMAL') {
            await this.generateWeatherAlert(weather);
        }
    }
    
    async generateWeatherAlert(weather) {
        const severityMap = {
            'HEAVY_RAIN': 'WARNING',
            'LIGHT_RAIN': 'INFO',
            'HIGH_WIND': 'WARNING',
            'EXTREME_HEAT': 'WARNING',
            'FREEZING': 'CRITICAL'
        };
        
        const severity = this.getWeatherSeverity(weather);
        const alertSeverity = severityMap[severity] || 'INFO';
        
        await alertService.createAlert({
            location_id: weather.location_id,
            severity: alertSeverity,
            alert_type: 'WEATHER_ALERT',
            title: `Adverse Weather Conditions`,
            message: `${severity.replace('_', ' ').toLowerCase()} detected at ${weather.location_name}. Temperature: ${weather.temperature_c}°C, Precipitation: ${weather.precipitation}mm, Wind: ${weather.wind_speed}km/h`
        });
    }
    
    generateSimulatedWeatherData(location) {
        // Simple weather simulation based on location and time
        const baseTemp = 20 + Math.random() * 15; // 20-35°C
        const humidity = 40 + Math.random() * 40; // 40-80%
        const windSpeed = Math.random() * 25; // 0-25 km/h
        const precipitation = Math.random() < 0.3 ? Math.random() * 10 : 0; // 30% chance of rain
        
        const conditions = ['sunny', 'partly cloudy', 'cloudy', 'overcast'];
        if (precipitation > 5) conditions.push('heavy rain');
        else if (precipitation > 0) conditions.push('light rain');
        
        return {
            location_id: location.location_id,
            temperature_c: Math.round(baseTemp * 10) / 10,
            humidity_pct: Math.round(humidity),
            condition: conditions[Math.floor(Math.random() * conditions.length)],
            wind_speed: Math.round(windSpeed * 10) / 10,
            precipitation: Math.round(precipitation * 10) / 10
        };
    }
}

module.exports = new WeatherService();
