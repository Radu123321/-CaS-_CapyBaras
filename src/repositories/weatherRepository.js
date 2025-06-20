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
            location_id, temperature_c, humidity_pct, condition,
            wind_speed, precipitation, captured_at
        } = weatherData;
        
        const sql = `
            INSERT INTO weather_snapshots (
                location_id, temperature_c, humidity_pct, condition,
                wind_speed, precipitation, captured_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        
        const params = [
            location_id, temperature_c, humidity_pct, condition,
            wind_speed, precipitation, captured_at || new Date()
        ];
        
        const result = await query(sql, params);
        return result.rows[0];
    }
    
    /**
     * Get latest weather snapshot for location
     */
    async getLatestByLocation(locationId) {
        const sql = `
            SELECT 
                ws.*,
                l.name as location_name,
                l.address as location_address
            FROM weather_snapshots ws
            JOIN locations l ON ws.location_id = l.location_id
            WHERE ws.location_id = $1
            ORDER BY ws.captured_at DESC
            LIMIT 1
        `;
        
        const result = await query(sql, [locationId]);
        return result.rows[0] || null;
    }
    
    /**
     * Get all latest weather snapshots
     */
    async getAllLatestSnapshots() {
        const sql = `
            SELECT DISTINCT ON (ws.location_id)
                ws.*,
                l.name as location_name,
                l.address as location_address,
                l.latitude,
                l.longitude
            FROM weather_snapshots ws
            JOIN locations l ON ws.location_id = l.location_id
            ORDER BY ws.location_id, ws.captured_at DESC
        `;
        
        const result = await query(sql);
        return result.rows;
    }
    
    /**
     * Get weather history for location
     */
    async getWeatherHistory(locationId, hours = 24) {
        const sql = `
            SELECT 
                ws.*,
                l.name as location_name
            FROM weather_snapshots ws
            JOIN locations l ON ws.location_id = l.location_id
            WHERE ws.location_id = $1
            AND ws.captured_at >= NOW() - INTERVAL '${hours} hours'
            ORDER BY ws.captured_at DESC
        `;
        
        const result = await query(sql, [locationId]);
        return result.rows;
    }
    
    /**
     * Get adverse weather conditions
     */
    async getAdverseWeatherConditions(locationId = null, hours = 24) {
        let sql = `
            SELECT 
                ws.*,
                l.name as location_name,
                CASE 
                    WHEN ws.precipitation > 5 THEN 'HEAVY_RAIN'
                    WHEN ws.precipitation > 0 THEN 'LIGHT_RAIN'
                    WHEN ws.wind_speed > 30 THEN 'HIGH_WIND'
                    WHEN ws.temperature_c < 0 THEN 'FREEZING'
                    WHEN ws.temperature_c > 35 THEN 'EXTREME_HEAT'
                    ELSE 'NORMAL'
                END as weather_severity
            FROM weather_snapshots ws
            JOIN locations l ON ws.location_id = l.location_id
            WHERE ws.captured_at >= NOW() - INTERVAL '${hours} hours'
            AND (
                ws.precipitation > 0 
                OR ws.wind_speed > 20 
                OR ws.temperature_c < 5 
                OR ws.temperature_c > 30
                OR ws.condition LIKE '%storm%'
                OR ws.condition LIKE '%snow%'
            )
        `;
        
        const params = [];
        if (locationId) {
            sql += ' AND ws.location_id = $1';
            params.push(locationId);
        }
        
        sql += ' ORDER BY ws.captured_at DESC';
        
        const result = await query(sql, params);
        return result.rows;
    }
    
    /**
     * Get weather statistics for location
     */
    async getWeatherStats(locationId, days = 30) {
        const sql = `
            SELECT 
                COUNT(*) as total_snapshots,
                AVG(temperature_c) as avg_temperature,
                MIN(temperature_c) as min_temperature,
                MAX(temperature_c) as max_temperature,
                AVG(humidity_pct) as avg_humidity,
                AVG(wind_speed) as avg_wind_speed,
                SUM(precipitation) as total_precipitation,
                COUNT(CASE WHEN precipitation > 0 THEN 1 END) as rainy_snapshots,
                COUNT(CASE WHEN precipitation > 5 THEN 1 END) as heavy_rain_snapshots
            FROM weather_snapshots
            WHERE location_id = $1
            AND captured_at >= NOW() - INTERVAL '${days} days'
        `;
        
        const result = await query(sql, [locationId]);
        return result.rows[0] || null;
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
                AVG(ws.temperature_c) as avg_temperature,
                AVG(ws.precipitation) as avg_precipitation,
                CASE 
                    WHEN AVG(ws.precipitation) > 2 THEN 'RAINY'
                    WHEN AVG(ws.temperature_c) > 25 THEN 'HOT'
                    WHEN AVG(ws.temperature_c) < 10 THEN 'COLD'
                    ELSE 'NORMAL'
                END as weather_category
            FROM orders o
            JOIN locations l ON o.location_id = l.location_id
            LEFT JOIN weather_snapshots ws ON l.location_id = ws.location_id 
                AND DATE_TRUNC('day', ws.captured_at) = DATE_TRUNC('day', o.created_at)
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
        return result.rows;
    }
    
    /**
     * Get locations needing weather updates
     */
    async getLocationsNeedingWeatherUpdate(hoursThreshold = 2) {
        const sql = `
            SELECT 
                l.location_id,
                l.name,
                l.latitude,
                l.longitude,
                MAX(ws.captured_at) as last_weather_update,
                EXTRACT(EPOCH FROM (NOW() - MAX(ws.captured_at)))/3600 as hours_since_update
            FROM locations l
            LEFT JOIN weather_snapshots ws ON l.location_id = ws.location_id
            GROUP BY l.location_id, l.name, l.latitude, l.longitude
            HAVING MAX(ws.captured_at) IS NULL 
            OR MAX(ws.captured_at) < NOW() - INTERVAL '${hoursThreshold} hours'
            ORDER BY hours_since_update DESC NULLS FIRST
        `;
        
        const result = await query(sql);
        return result.rows;
    }
    
    /**
     * Clean old weather snapshots
     */
    async cleanOldSnapshots(daysToKeep = 90) {
        const sql = `
            DELETE FROM weather_snapshots 
            WHERE captured_at < NOW() - INTERVAL '${daysToKeep} days'
        `;
        
        const result = await query(sql);
        return result.rowCount || 0;
    }
}

module.exports = new WeatherRepository();
