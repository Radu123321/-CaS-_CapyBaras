const fs = require('fs');
const path = require('path');

// Load .env file manually (no external libs)
const envFile = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
  for (const l of lines) {
    const line = l.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

module.exports = {
  port: process.env.PORT || 8000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'twproject'
  },
  jwtSecret: process.env.JWT_SECRET || 'super-secret',
  websocket: {
    enabled: true
  }
}; 