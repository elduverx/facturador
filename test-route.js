const { POST } = require('./.next/server/app/api/admin/login/route.js');
async function run() {
  const req = new Request('http://localhost/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '123456', login: 'diana' })
  });
  const res = await POST(req);
  console.log(res.status);
  const text = await res.text();
  console.log(text);
}
run().catch(console.error);
