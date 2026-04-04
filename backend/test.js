const http = require('http');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://pos_user:supersecretpassword@postgres:5432/pos_db' });

async function test() {
  const { rows } = await pool.query(" SELECT id FROM users WHERE role = admin LIMIT 1\);
