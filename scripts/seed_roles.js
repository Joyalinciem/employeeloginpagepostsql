const { MongoMemoryServer } = require('mongodb-memory-server');
const fetch = require('node-fetch');

async function call(path, opts = {}) {
  const base = `http://localhost:${process.env.PORT || 5000}`;
  const res = await fetch(base + path, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

(async () => {
  let mongod;
  try {
    if (!process.env.MONGO_URI) {
      console.log('No MONGO_URI set — starting in-memory MongoDB for seeding...');
      mongod = await MongoMemoryServer.create();
      process.env.MONGO_URI = mongod.getUri();
    }

    process.env.PORT = process.env.PORT || '5002';
    console.log('Starting backend server on port', process.env.PORT);
    require('../backend/server');

    // wait for server to start
    await new Promise(r => setTimeout(r, 2000));

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const adminPass = process.env.SEED_ADMIN_PASS || 'adminpass';

    console.log('Registering admin user...');
    let r = await call('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Seed Admin', email: adminEmail, password: adminPass }) });
    console.log('Register admin:', r.status, r.body);

    console.log('Logging in admin...');
    r = await call('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: adminEmail, password: adminPass }) });
    console.log('Admin login:', r.status, r.body);
    if (!r.body || !r.body.token) throw new Error('Admin login failed');
    const adminToken = r.body.token;

    const toCreate = [
      { name: 'Seed Manager', email: process.env.SEED_MANAGER_EMAIL || 'manager@example.com', password: process.env.SEED_MANAGER_PASS || 'managerpass' },
      { name: 'Seed CTO', email: process.env.SEED_CTO_EMAIL || 'cto@example.com', password: process.env.SEED_CTO_PASS || 'ctopass' },
      { name: 'Sample User', email: process.env.SAMPLE_USER_EMAIL || 'user@example.com', password: process.env.SAMPLE_USER_PASS || 'userpass' },
    ];

    for (const u of toCreate) {
      console.log('Registering', u.email);
      const resReg = await call('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: u.name, email: u.email, password: u.password }) });
      console.log(' ->', resReg.status, resReg.body);
    }

    // fetch pending and approve manager and cto and sample user if present
    console.log('Fetching pending users...');
    const pending = await call('/api/admin/pending', { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('Pending:', pending.status, pending.body);
    const list = pending.body.pending || [];
    for (const p of list) {
      if ([process.env.SEED_MANAGER_EMAIL || 'manager@example.com', process.env.SEED_CTO_EMAIL || 'cto@example.com', process.env.SAMPLE_USER_EMAIL || 'user@example.com'].includes(p.email)) {
        console.log('Approving', p.email);
        const appr = await call(`/api/admin/approve/${p._id}`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } });
        console.log(' ->', appr.status, appr.body);
      }
    }

    // Directly set roles for manager and cto in DB because API disallows assigning elevated roles from admin
    // Use native MongoDB driver to update roles directly to avoid Mongoose model conflicts
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();
    const managerEmail = process.env.SEED_MANAGER_EMAIL || 'manager@example.com';
    const ctoEmail = process.env.SEED_CTO_EMAIL || 'cto@example.com';
    const mRes = await db.collection('users').updateOne({ email: managerEmail }, { $set: { role: 'manager' } });
    const cRes = await db.collection('users').updateOne({ email: ctoEmail }, { $set: { role: 'cto' } });
    console.log('DB role set:', mRes.modifiedCount ? `${managerEmail} -> manager` : 'manager not found', cRes.modifiedCount ? `${ctoEmail} -> cto` : 'cto not found');
    await client.close();

    console.log('Seed complete. Credentials:');
    console.table([
      { role: 'admin', email: adminEmail, password: adminPass },
      { role: 'manager', email: process.env.SEED_MANAGER_EMAIL || 'manager@example.com', password: process.env.SEED_MANAGER_PASS || 'managerpass' },
      { role: 'cto', email: process.env.SEED_CTO_EMAIL || 'cto@example.com', password: process.env.SEED_CTO_PASS || 'ctopass' },
      { role: 'user', email: process.env.SAMPLE_USER_EMAIL || 'user@example.com', password: process.env.SAMPLE_USER_PASS || 'userpass' },
    ]);

    if (mongod) {
      await mongod.stop();
    }
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();
