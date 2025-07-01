const fetch = require('node-fetch');

(async () => {
  const BASE = 'http://localhost:8000/api';

  // 1) Login as admin
  const loginResp = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cas.local', password: 'admin123' })
  }).then(r => r.json());

  if (!loginResp.success) {
    console.error('Login failed:', loginResp);
    return;
  }

  const token = loginResp.data.token;
  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  // 2) Prepare CSV payload
  const csv = `item_code,qty_on_hand\nSOAP,2000\nSHAMPOO,1500\nWAX,1000\nGLASS,800\nDEGREASE,1200\n`;

  // 3) Import inventory for branch 3
  const importResp = await fetch(`${BASE}/inventory/import/3`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'text/csv'
    },
    body: csv
  }).then(r => r.json());

  console.log('Import response:', importResp);

  // 4) Fetch inventory for branch 3 (include zeros)
  const invResp = await fetch(`${BASE}/inventory/location/3?include_zero=true`, {
    headers: authHeaders
  }).then(r => r.json());

  const rows = invResp.data.rows || invResp.data;
  console.table(rows);
})(); 