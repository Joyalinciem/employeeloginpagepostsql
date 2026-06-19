const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { randomUUID, randomBytes } = require('crypto');

(async () => {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/taskmanager' });

    const email = 'joyalanto54@gmail.com';
    const name = 'Joyal';
    const plainPassword = process.env.PASSWORD || randomBytes(12).toString('base64').replace(/\/+|=|\+/g, '').slice(0, 16);
    const hashed = await bcrypt.hash(plainPassword, 10);
    const id = randomUUID();

    const query = `INSERT INTO users (id, name, email, password, role, approved, can_update_tasks, can_delete_tasks, can_update_users, can_delete_users, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, approved = EXCLUDED.approved, updated_at = NOW(), name = EXCLUDED.name
      RETURNING id, email, role`;

    const values = [id, name, email, hashed, 'admin', true, true, true, true, true];
    const res = await pool.query(query, values);

    console.log('OK: created/updated user:', res.rows[0]);
    console.log('PlainPassword:', plainPassword);

    await pool.end();
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
