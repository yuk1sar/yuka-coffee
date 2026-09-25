const { test } = require('node:test')
const assert = require('node:assert/strict')
process.env.JWT_SECRET = require('node:crypto').randomBytes(48).toString('hex')
process.env.NODE_ENV = 'test'
process.env.CORS_ORIGINS = 'https://frontend.example.com'
process.env.RENDER = 'true'
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const pool = require('./db')
let lastQuery
const password = 'test-only-password'
const hash = bcrypt.hashSync(password, 4)
pool.query = async (sql, values) => {
  lastQuery = { sql, values }
  if (sql.includes('password_hash')) return { rows: [{ id: 1, username: 'test-admin', password_hash: hash }] }
  if (sql.startsWith('INSERT')) return { rows: [{ id: 7, status: 'pending' }] }
  if (sql.startsWith('UPDATE')) return { rows: values[1] === 7 ? [{ id: 7, status: values[0] }] : [] }
  return { rows: [] }
}
const app = require('./server')
test('HTTP API contract with a stub database', async (t) => {
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  t.after(async () => { await new Promise((resolve) => server.close(resolve)); await pool.end() })
  const base = `http://127.0.0.1:${server.address().port}`
  const request = (url, options = {}) => fetch(base + url, options)
  const json = (body, headers = {}) => ({ method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
  await t.test('health and readiness', async () => {
    assert.equal((await request('/api/health')).status, 200)
    assert.equal((await request('/api/ready')).status, 200)
  })
  await t.test('CORS allowed, rejected, and PATCH preflight', async () => {
    const headers = { Origin: 'https://frontend.example.com' }
    assert.equal((await request('/api/health', { headers })).headers.get('access-control-allow-origin'), headers.Origin)
    assert.equal((await request('/api/health', { headers: { Origin: 'https://evil.example.com' } })).status, 403)
    assert.equal((await request('/api/reservations/7/status', { method: 'OPTIONS', headers: { ...headers,
      'Access-Control-Request-Method': 'PATCH', 'Access-Control-Request-Headers': 'authorization,content-type' } })).status, 204)
  })
  await t.test('anonymous and forged tokens cannot read or update bookings', async () => {
    assert.equal((await request('/api/reservations')).status, 401)
    assert.equal((await request('/api/reservations/7/status', { method: 'PATCH' })).status, 401)
    const forged = jwt.sign({ id: 1, username: 'test-admin' }, 'wrong-key')
    assert.equal((await request('/api/reservations', { headers: { Authorization: `Bearer ${forged}` } })).status, 401)
    const expired = jwt.sign({ id: 1, username: 'test-admin' }, process.env.JWT_SECRET, { expiresIn: -1 })
    assert.equal((await request('/api/reservations', { headers: { Authorization: `Bearer ${expired}` } })).status, 401)
  })
  await t.test('bcrypt login, authenticated list and status update', async () => {
    const login = await request('/api/admin/login', json({ username: 'test-admin', password }))
    assert.equal(login.status, 200)
    const { token } = await login.json()
    const headers = { Authorization: `Bearer ${token}` }
    assert.equal((await request('/api/reservations', { headers })).status, 200)
    assert.equal((await request('/api/reservations/7/status', { ...json({ status: 'confirmed' }, headers), method: 'PATCH' })).status, 200)
    assert.equal((await request('/api/reservations/8/status', { ...json({ status: 'confirmed' }, headers), method: 'PATCH' })).status, 404)
    assert.equal((await request('/api/reservations/7/status', { ...json({ status: 'invalid' }, headers), method: 'PATCH' })).status, 400)
  })
  await t.test('booking validation and parameterized insert', async () => {
    const booking = { name: "Test O'Name", phone: '+994501234567', date: '2099-01-01', time: '12:00', guests: 2 }
    assert.equal((await request('/api/reservations', json(booking))).status, 201)
    assert.equal(lastQuery.values[0], booking.name)
    assert.ok(lastQuery.sql.includes('$1'))
    for (const change of [{ date: '2099-02-30' }, { date: '2000-01-01' }, { guests: true }, { guests: 11 }, { phone: '123' }]) {
      assert.equal((await request('/api/reservations', json({ ...booking, ...change }))).status, 400)
    }
    assert.equal((await request('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400)
  })
  await t.test('login rate limit and independent proxy client IPs', async () => {
    for (let i = 0; i < 10; i++) {
      assert.equal((await request('/api/admin/login', json({ username: 'test-admin', password: 'wrong' }, { 'X-Forwarded-For': '192.0.2.1' }))).status, 401)
    }
    assert.equal((await request('/api/admin/login', json({ username: 'test-admin', password: 'wrong' }, { 'X-Forwarded-For': '192.0.2.1' }))).status, 429)
    assert.equal((await request('/api/admin/login', json({ username: 'test-admin', password }, { 'X-Forwarded-For': '192.0.2.2' }))).status, 200)
  })
})
