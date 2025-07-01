const fetch = require('node-fetch');
const chalk = require('chalk');

// Base URL of running CaS server
const BASE = process.env.CAS_BASE_URL || 'http://localhost:8000';

const ADMIN_CRED = {
  email: process.env.CAS_ADMIN_EMAIL || 'admin@cas.local',
  password: process.env.CAS_ADMIN_PWD || 'admin123'
};

/** Pretty print helpers */
const divider = () => console.log(chalk.gray('────────────────────────────────────────────'));

async function login() {
  console.log(chalk.cyan('→ POST /api/login'), ADMIN_CRED);
  const res = await fetch(BASE + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ADMIN_CRED)
  });
  const body = await res.text();
  console.log(chalk.yellow('←', res.status), body);
  if (!res.ok) throw new Error('Login failed');
  const { token } = JSON.parse(body);
  return token;
}

// List of endpoints to probe (GET only for safety)
const endpoints = [
  '/api/ping',
  '/api/scheduler/status',
  '/api/locations',
  '/api/services',
  '/api/customers',
  '/api/employees',
  '/api/orders',
  '/api/orders/active',
  '/api/transports',
  '/api/inventory',
  '/api/inventory/low-stock',
  '/api/equipment',
  '/api/equipment/statuses',
  '/api/maintenance?branchId=1',
  '/api/maintenance/upcoming?branchId=1',
  '/api/stats/dashboard',
  '/api/stats/system-status',
  '/api/stats/performance',
  '/api/notifications/recent'
];

(async () => {
  console.log(chalk.bold(`Auth + probe ${endpoints.length} endpoints on ${BASE}`));
  divider();

  let token;
  try {
    token = await login();
  } catch (e) {
    console.error(chalk.red('Cannot proceed without token'), e.message);
    process.exit(1);
  }

  divider();
  let success = 0;
  for (const ep of endpoints) {
    try {
      console.log(chalk.cyan('→ GET', ep));
      const res = await fetch(BASE + ep, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const body = await res.text();
      if (res.ok) success++;
      const mark = res.ok ? chalk.green('✓') : chalk.yellow('⚠');
      console.log(mark, ep, chalk.gray(`(${res.status})`));
      console.log(chalk.gray(body));
    } catch (err) {
      console.log(chalk.red('✗'), ep, err.message);
    }
    divider();
  }
  console.log(chalk.bold(`\n${success}/${endpoints.length} endpoints responded OK`));
})(); 