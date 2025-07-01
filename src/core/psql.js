'use strict';
const { Pool } = require('pg');
const log = require('./logger');

// PostgreSQL connection configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'twproject',
  password: process.env.DB_PASSWORD || 'pass',
  port: parseInt(process.env.DB_PORT) || 5432,
  max: 10, // maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

log.info(`Connecting to PostgreSQL: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  log.error(`PostgreSQL pool error: ${err.message}`);
});

// Test connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    log.info(`PostgreSQL connection successful. Server time: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    log.error(`PostgreSQL connection failed: ${error.message}`);
    return false;
  }
}

// Execute query
async function query(text, params = []) {
  const start = Date.now();
  
  try {
    log.debug(`SQL Query: ${text}`);
    if (params.length > 0) {
      log.debug(`SQL Params: ${JSON.stringify(params)}`);
    }
    
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    log.debug(`SQL executed in ${duration}ms, returned ${result.rowCount} rows`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    log.error(`SQL error after ${duration}ms: ${error.message}`);
    log.error(`Failed query: ${text}`);
    throw error;
  }
}

// Execute transaction
async function transaction(queries, params = []) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    if (Array.isArray(queries)) {
      // Execute multiple queries
      if (queries.length > 0 && typeof queries[0] === 'object' && queries[0].text) {
        // New format: array of {text, values} objects
        for (const queryObj of queries) {
          await client.query(queryObj.text, queryObj.values || []);
        }
      } else {
        // Old format: array of query strings with shared params
        let paramIndex = 0;
        for (const query of queries) {
          const queryParams = params.slice(paramIndex, paramIndex + (query.match(/\$\d+/g) || []).length);
          await client.query(query, queryParams);
          paramIndex += queryParams.length;
        }
      }
    } else {
      // Execute single query
      await client.query(queries, params);
    }
    
    await client.query('COMMIT');
    log.debug('Transaction committed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    log.error(`Transaction rolled back: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

// Close pool (for graceful shutdown)
async function close() {
  try {
    await pool.end();
    log.info('PostgreSQL pool closed');
  } catch (error) {
    log.error(`Error closing PostgreSQL pool: ${error.message}`);
  }
}

// Test connection on module load
testConnection();

module.exports = { query, transaction, close, testConnection }; 