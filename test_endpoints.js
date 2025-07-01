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
  console.log(chalk.cyan('→ POST /api/auth/login'), ADMIN_CRED);
  const res = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ADMIN_CRED)
  });
  const body = await res.text();
  console.log(chalk.yellow('←', res.status), body);
  if (!res.ok) throw new Error('Login failed');
  const parsed = JSON.parse(body);
  const token = parsed.token || parsed.data?.token;
  if (!token) throw new Error('Token not found in response');
  return token;
}

// Richer test matrix – method & endpoint (body optional)
const endpoints = [
  { m: 'GET',  p: '/api/ping' },
  { m: 'GET',  p: '/api/scheduler/status' },
  { m: 'GET',  p: '/api/locations' },
  { m: 'GET',  p: '/api/services' },
  { m: 'GET',  p: '/api/customers' },
  { m: 'GET',  p: '/api/employees' },
  { m: 'GET',  p: '/api/orders' },
  { m: 'GET',  p: '/api/orders/active' },
  { m: 'GET',  p: '/api/transports' },
  { m: 'GET',  p: '/api/inventory' },
  { m: 'GET',  p: '/api/inventory/low-stock' },
  { m: 'GET',  p: '/api/inventory/alerts' },
  { m: 'GET',  p: '/api/equipment' },
  { m: 'GET',  p: '/api/equipment/dashboard' },
  { m: 'GET',  p: '/api/equipment/statuses' },
  { m: 'GET',  p: '/api/maintenance?branchId=1' },
  { m: 'GET',  p: '/api/maintenance/overdue' },
  { m: 'GET',  p: '/api/maintenance/upcoming?branchId=1' },
  { m: 'GET',  p: '/api/shifts' },
  { m: 'GET',  p: '/api/recurrences' },
  { m: 'GET',  p: '/api/weather/current' },
  { m: 'GET',  p: '/api/stats/dashboard' },
  { m: 'GET',  p: '/api/stats/summary' },
  { m: 'GET',  p: '/api/stats/system-status' },
  { m: 'GET',  p: '/api/stats/performance' },
  { m: 'GET',  p: '/api/stats/kpis' },
  { m: 'GET',  p: '/api/notifications/recent' },
  // Simple POST actions that are idempotent / safe
  { m: 'POST', p: '/api/equipment/check-status' },
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
  for (const { m, p, body } of endpoints) {
    try {
      console.log(chalk.cyan(`→ ${m}`, p));
      const res = await fetch(BASE + p, {
        method: m,
        headers: {
          'Accept': 'application/json',
          ...(m !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
          'Authorization': `Bearer ${token}`
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      const respText = await res.text();
      if (res.ok) success++;
      const mark = res.ok ? chalk.green('✓') : chalk.yellow('⚠');
      console.log(mark, p, chalk.gray(`(${res.status})`));
      console.log(chalk.gray(respText));
    } catch (err) {
      console.log(chalk.red('✗'), p, err.message);
    }
    divider();
  }
  console.log(chalk.bold(`\n${success}/${endpoints.length} endpoints responded OK`));
})();