(async () => {
  const base = 'http://localhost:5000/api';
  const log = (label, obj) => console.log('\n== ' + label + ' ==\n', JSON.stringify(obj, null, 2));

  const reg = async (name, email, pass, role) => {
    const res = await fetch(`${base}/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password: pass, role })
    });
    return res.json();
  };

  const login = async (email, pass) => {
    const res = await fetch(`${base}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) });
    return res.json();
  };

  try {
    log('Register admin', await reg('Admin', 'admin@test.com', 'adminpass', 'admin'));
    const loginRes = await login('admin@test.com', 'adminpass');
    log('Login admin', loginRes);
    const token = loginRes.token;

    log('Register manager', await reg('Manager', 'manager@test.com', 'managerpass', 'manager'));
    log('Register user', await reg('User', 'user@test.com', 'userpass', 'user'));

    const pendingRes = await fetch(`${base}/admin/pending-requests`, { headers: { Authorization: `Bearer ${token}` } });
    const pending = await pendingRes.json();
    log('Pending before approve', pending);

    for (const p of pending) {
      const appro = await fetch(`${base}/admin/pending-requests/${p._id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const ares = await appro.json();
      log('Approve', ares);
    }

    const allUsersRes = await fetch(`${base}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
    const allUsers = await allUsersRes.json();
    log('All users', allUsers);
    const manager = allUsers.find(u => u.email === 'manager@test.com');
    const user = allUsers.find(u => u.email === 'user@test.com');

    const assignRes = await fetch(`${base}/admin/users/${user._id}/assign-manager`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ managerId: manager._id }) });
    log('Assign manager', await assignRes.json());

    const logs1 = await (await fetch(`${base}/admin/assignment-logs`, { headers: { Authorization: `Bearer ${token}` } })).json();
    log('Assignment logs after assign', logs1);

    const unassignRes = await fetch(`${base}/admin/users/${user._id}/assign-manager`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ managerId: null }) });
    log('Unassign manager', await unassignRes.json());

    const logs2 = await (await fetch(`${base}/admin/assignment-logs`, { headers: { Authorization: `Bearer ${token}` } })).json();
    log('Assignment logs after unassign', logs2);

    console.log('\nE2E test completed');
  } catch (err) {
    console.error('E2E error', err);
  }
})();
