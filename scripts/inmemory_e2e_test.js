const { MongoMemoryServer } = require('mongodb-memory-server');
const fetch = require('node-fetch');
const mongoose = require('mongoose');

(async () => {
  try {
    console.log('Starting in-memory MongoDB...');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGO_URI = uri; // backend/server.js will read this
    process.env.PORT = '5001';

    console.log('Starting backend server (it will use MONGO_URI on port 5001)...');
    require('../backend/server');

    // wait for server to start
    await new Promise((r) => setTimeout(r, 2000));

    const base = 'http://localhost:5001';

    // 1) Register first user (becomes admin automatically)
    console.log('Registering admin user...');
    let res = await fetch(base + '/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'E2E Admin', email: 'admin@e2e.test', password: 'password' }),
    });
    console.log('Admin register status:', res.status, await res.text());

    // 2) Login as admin to get token
    res = await fetch(base + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@e2e.test', password: 'password' }),
    });
    const adminLogin = await res.json();
    console.log('Admin login:', res.status, adminLogin.message || adminLogin);
    const adminToken = adminLogin.token;

    // 3) Register a normal user (should be pending)
    console.log('Registering normal user...');
    res = await fetch(base + '/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'E2E User', email: 'user@e2e.test', password: 'password' }),
    });
    console.log('User register status:', res.status, await res.text());

    // 4) Attempt login as normal user (should be blocked)
    console.log('Attempting login as normal user (should be blocked)...');
    res = await fetch(base + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@e2e.test', password: 'password' }),
    });
    console.log('User login status (blocked expected):', res.status, await res.text());

    // 5) Admin fetches pending users and approves the new user
    console.log('Admin fetching pending users...');
    res = await fetch(base + '/api/admin/pending-requests', { headers: { Authorization: `Bearer ${adminToken}` } });
    const pending = await res.json();
    console.log('Pending:', pending);

    const target = pending.find(u => u.email === 'user@e2e.test');
    if (!target) throw new Error('Pending user not found');

    console.log('Approving user via API...', target._id || target.id);
    const id = target._id || target.id;
    res = await fetch(base + `/api/admin/pending-requests/${id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('Approve response:', res.status, await res.text());

    // 6) Attempt login again as normal user (should succeed)
    console.log('Attempting login again as normal user (should succeed)...');
    res = await fetch(base + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@e2e.test', password: 'password' }),
    });
    console.log('User login2 status:', res.status, await res.json());

    console.log('Cleaning up...');
    await mongod.stop();
    process.exit(0);
  } catch (err) {
    console.error('E2E error', err);
    process.exit(1);
  }
})();
