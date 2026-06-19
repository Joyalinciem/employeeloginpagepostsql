const { Pool } = require('pg');
(async () => {
  try {
    const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/taskmanager' });
    const res = await pool.query(
      'SELECT id, name, email, password, old_password, approved, role, created_at, updated_at FROM users WHERE email=$1',
      ['joyalanto54@gmail.com']
    );
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
