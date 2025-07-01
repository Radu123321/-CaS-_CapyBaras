const fetch = require('node-fetch');

(async () => {
  const BASE = 'http://localhost:8000/api';
  const branchId = process.argv[2] || 7;

  const login = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cas.local', password: 'admin123' })
  }).then(r => r.json());
  const token = login.data.token;
  const H = { Authorization: `Bearer ${token}` };

  const csv=`item_code,qty_on_hand\nSOAP,2000\nSHAMPOO,1500\nWAX,1000\nGLASS,800\nDEGREASE,1200\n`;
  const res = await fetch(`${BASE}/inventory/import/${branchId}`, { method:'POST', headers:{ ...H, 'Content-Type':'text/csv' }, body: csv }).then(r=>r.json());
  console.log(res);
})(); 