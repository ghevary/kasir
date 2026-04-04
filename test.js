
const http = require('http');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://pos_user:supersecretpassword@localhost:5432/pos_db' });

async function test() {
  const { rows } = await pool.query(SELECT id FROM users WHERE role = 'admin' LIMIT 1);
  if (!rows.length) { console.log('no admin'); process.exit(1); }
  const adminId = rows[0].id;
  pool.end();
  
  const postData = JSON.stringify({ name: 'TestCat ' + Date.now() });
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/categories',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': adminId }
  };
  
  const req1 = http.request(options, res => {
    let d = ''; res.on('data', c => d+=c); res.on('end', () => console.log('Req 1:', res.statusCode, d));
    
    const req2 = http.request(options, res2 => {
      let d2 = ''; res2.on('data', c => d2+=c); res2.on('end', () => console.log('Req  2:', res2.statusCode, d2));
    });
    req2.write(JSON.stringify({ name: 'TestCat ' + Date.now() }));
    req2.end();
  });
  req1.write(postData);
  req1.end();
}
test();

