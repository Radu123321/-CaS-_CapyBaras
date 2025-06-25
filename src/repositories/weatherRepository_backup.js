const { query } = require('../core/psql');

/**
 * Weather Repository
 * Handles all database operations for weather data
 */
class WeatherRepository {
    
    /**
     * Create weather snapshot
     */
    async createSnapshot(weatherData) {
        const {
            location_id, weather_type, temperature, humidity, wind_speed, 
            precipitation, date
        } = weatherData;
        
        const sql = `
            INSERT INTO weather_conditions (
                location_id, weather_type, temperature, humidity, wind_speed,
                precipitation, date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        
        const params = [
            location_id, weather_type || 'NORMAL', temperature, humidity, 
            wind_speed, precipitation || 0, date || new Date().toISOString().split('T')[0]
        ];
        
        const result = await query(sql, params);
        return result && result.length > 0 ? result[0] : null;
    }
    
    /**
     * Get latest weather snapshot for location
     */
    async getLatestByLocation(locationId) {
        const sql = `
            SELECT 
                wc.*,
                l.name as location_name,
                l.address as location_address
            FROM weather_conditions wc
            JOIN locations l ON wc.location_id = l.location_id
            WHERE wc.location_id = $1
            ORDER BY wc.date DESC
            LIMIT 1
        `;
        
        const result = await query(sql, [locationId]);
        return result && result.length > 0 ? result[0] : null;
    }
    
    /**
     * Get all latest weather snapshots
     */
    async getAllLatestSnapshots() {
        const sql = `
            SELECT DISTINCT ON (wc.location_id)
                wc.*,
                l.name as location_name,
                l.address as location_address,
                l.latitude,
                l.longitude
            FROM weather_conditions wc
            JOIN locations l ON wc.location_id = l.location_id
            ORDER BY wc.location_id, wc.date DESC
        `;
        
        const result = await query(sql);
        return result || [];
    }
    
    /**
     * Get weather history for location
     */
    async getWeatherHistory(locationId, days = 7) {
        const sql = `
            SELECT 
                wc.*,
                l.name as location_name
            FROM weather_conditions wc
            JOIN locations l ON wc.location_id = l.location_id
            WHERE wc.location_id = $1
            AND wc.date >= CURRENT_DATE - INTERVAL '${days} days'
            ORDER BY wc.date DESC
        `;
        
        const result = await query(sql, [locationId]);
        return result || [];
    }
    
    /**
     * Get adverse weather conditions
     */
    async getAdverseWeatherConditions(locationId = null, days = 7) {
        let sql = `
            SELECT 
                wc.*,
                l.name as location_name,
                wc.weather_type as weather_severity
            FROM weather_conditions wc
            JOIN locations l ON wc.location_id = l.location_id
            WHERE wc.date >= CURRENT_DATE - INTERVAL '${days} days'
            AND wc.weather_type != 'NORMAL'
        `;
        
        const params = [];
        if (locationId) {
            sql += ' AND wc.location_id = $1';
            params.push(locationId);
        }
        
        sql += ' ORDER BY wc.date DESC';
        
        const result = await query(sql, params);
        return result || [];
    }
    
    /**
     * Get weather statistics for location
     */
    async getWeatherStats(locationId, days = 30) {
        const sql = `
            SELECT 
                COUNT(*) as total_snapshots,
                AVG(temperature) as avg_temperature,
                MIN(temperature) as min_temperature,
                MAX(temperature) as max_temperature,
                AVG(humidity) as avg_humidity,
                AVG(wind_speed) as avg_wind_speed,
                SUM(precipitation) as total_precipitation,
                COUNT(CASE WHEN precipitation > 0 THEN 1 END) as rainy_snapshots,
                COUNT(CASE WHEN precipitation > 5 THEN 1 END) as heavy_rain_snapshots
            FROM weather_conditions
            WHERE location_id = $1
            AND date >= CURRENT_DATE - INTERVAL '${days} days'
        `;
        
        const result = await query(sql, [locationId]);
        return result && result.length > 0 ? result[0] : null;
    }
    
    /**
     * Get weather correlation with orders
     */
    async getWeatherOrderCorrelation(locationId = null, days = 30) {
        let sql = `
            SELECT 
                DATE_TRUNC('day', o.created_at) as order_date,
                l.location_id,
                l.name as location_name,
                COUNT(o.order_id) as total_orders,
                AVG(wc.temperature) as avg_temperature,
                AVG(wc.precipitation) as avg_precipitation,
                CASE 
                    WHEN AVG(wc.precipitation) > 2 THEN 'RAINY'
                    WHEN AVG(wc.temperature) > 25 THEN 'HOT'
                    WHEN AVG(wc.temperature) < 10 THEN 'COLD'
                    ELSE 'NORMAL'
                END as weather_category
            FROM orders o
            JOIN locations l ON o.location_id = l.location_id
            LEFT JOIN weather_conditions wc ON l.location_id = wc.location_id 
                AND wc.date = DATE(o.created_at)
            WHERE o.created_at >= NOW() - INTERVAL '${days} days'
        `;
        
        const params = [];
        if (locationId) {
            sql += ' AND o.location_id = $1';
            params.push(locationId);
        }
        
        sql += `
            GROUP BY DATE_TRUNC('day', o.created_at), l.location_id, l.name
            ORDER BY order_date DESC, l.name
        `;
        
        const result = await query(sql, params);
        return result || [];
    }
    
    /**
     * Get locations needing weather updates
     */
    async getLocationsNeedingWeatherUpdate(daysThreshold = 1) {
        const sql = `
            SELECT 
                l.location_id,
                l.name,
                l.latitude,
                l.longitude,
                MAX(wc.date) as last_weather_update,
                EXTRACT(DAYS FROM (CURRENT_DATE - MAX(wc.date))) as days_since_update
            FROM locations l
            LEFT JOIN weather_conditions wc ON l.location_id = wc.location_id
            GROUP BY l.location_id, l.name, l.latitude, l.longitude
            HAVING MAX(wc.date) IS NULL 
            OR MAX(wc.date) < CURRENT_DATE - INTERVAL '${daysThreshold} days'
            ORDER BY days_since_update DESC NULLS FIRST
        `;
        
        const result = await query(sql);
        return result || [];
    }
    
    /**
     * Clean old weather snapshots
     */
    async cleanOldSnapshots(daysToKeep = 90) {
        const sql = `
            DELETE FROM weather_conditions 
            WHERE date < CURRENT_DATE - INTERVAL '${daysToKeep} days'
        `;
        
        const result = await query(sql);
        return result.affectedRows || 0;
    }
}

module.exports = new WeatherRepository();
