const path = require('node:path')
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true })
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { rateLimit } = require('express-rate-limit')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const pool = require('./db')
const requireAuth = require('./auth')
const production = process.env.NODE_ENV === 'production'
if (!process.env.JWT_SECRET || (production && Buffer.byteLength(process.env.JWT_SECRET) < 32)) {
  throw new Error('Set JWT_SECRET (at least 32 bytes in production)')
}
const origins = (process.env.CORS_ORIGINS || (production ? '' :
  'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174'))
  .split(',').map((value) => value.trim()).filter(Boolean)
if (!origins.length) throw new Error('CORS_ORIGINS is required in production')
for (const origin of origins) {
  const parsed = new URL(origin)
  if (parsed.origin !== origin || (production && parsed.protocol !== 'https:')) {
    throw new Error('CORS_ORIGINS must contain exact origins without paths or trailing slashes')
  }
}
const app = express()
app.disable('x-powered-by')
app.set('trust proxy', process.env.RENDER === 'true' ? 1 : false)
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || origins.includes(origin)) return callback(null, true)
    const error = new Error('Origin not allowed')
    error.status = 403
    callback(error)
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '16kb' }))
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next() })
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Yuka Coffee API is running' }))
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100,
  standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' } }))
app.get('/api/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1 FROM admins LIMIT 0')
    await pool.query('SELECT 1 FROM reservations LIMIT 0')
    res.json({ status: 'ok' })
  } catch { res.status(503).json({ error: 'Database is not ready' }) }
})
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10,
  skipSuccessfulRequests: true, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' } })
const dummyHash = bcrypt.hashSync(require('node:crypto').randomBytes(32).toString('hex'), 12)
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body || {}
  if (typeof username !== 'string' || !username.trim() || username.length > 100 ||
      typeof password !== 'string' || !password || Buffer.byteLength(password) > 72) {
    return res.status(400).json({ error: 'Invalid username or password' })
  }
  try {
    const result = await pool.query('SELECT id, username, password_hash FROM admins WHERE username = $1', [username.trim()])
    const admin = result.rows[0]
    const valid = await bcrypt.compare(password, admin?.password_hash || dummyHash)
    if (!admin || !valid) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '2h' })
    res.json({ message: 'Login successful', token })
  } catch {
    console.error('Login query failed')
    res.status(500).json({ error: 'Internal server error' })
  }
})
app.post('/api/reservations', async (req, res) => {
  const { name, phone, date, time, guests } = req.body || {}
  const cleanName = typeof name === 'string' ? name.trim() : ''
  const cleanPhone = typeof phone === 'string' ? phone.replace(/\s/g, '') : ''
  const count = Number(guests)
  if (cleanName.length < 2 || cleanName.length > 100) return res.status(400).json({ error: 'Invalid name' })
  if (!/^\+994(10|50|51|55|60|70|77|99)[0-9]{7}$/.test(cleanPhone)) {
    return res.status(400).json({ error: 'Invalid Azerbaijan phone number' })
  }
  const parsed = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T00:00:00Z`) : new Date(NaN)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    return res.status(400).json({ error: 'Invalid reservation date' })
  }
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku',
    year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  if (date < today) return res.status(400).json({ error: 'Reservation date cannot be in the past' })
  if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return res.status(400).json({ error: 'Invalid reservation time' })
  }
  if (!['string', 'number'].includes(typeof guests) || !Number.isInteger(count) || count < 1 || count > 10) {
    return res.status(400).json({ error: 'Invalid number of guests' })
  }
  try {
    const result = await pool.query(`INSERT INTO reservations
      (name, phone, reservation_date, reservation_time, guests)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`, [cleanName, cleanPhone, date, time, count])
    res.status(201).json({ message: 'Reservation created successfully', reservation: result.rows[0] })
  } catch {
    console.error('Reservation insert failed')
    res.status(500).json({ error: 'Internal server error' })
  }
})
app.get('/api/reservations', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reservations ORDER BY created_at DESC')
    res.json(result.rows)
  } catch {
    console.error('Reservation fetch failed')
    res.status(500).json({ error: 'Internal server error' })
  }
})
app.patch('/api/reservations/:id/status', requireAuth, async (req, res) => {
  const id = Number(req.params.id)
  const { status } = req.body || {}
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) return res.status(400).json({ error: 'Invalid reservation ID' })
  if (!['pending', 'confirmed', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' })
  try {
    const result = await pool.query('UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *', [status, id])
    if (!result.rows.length) return res.status(404).json({ error: 'Reservation not found' })
    res.json({ message: 'Reservation status updated', reservation: result.rows[0] })
  } catch {
    console.error('Reservation update failed')
    res.status(500).json({ error: 'Internal server error' })
  }
})
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }))
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  const status = [400, 403, 413, 415].includes(error.status) ? error.status : 500
  const messages = { 400: 'Invalid JSON body', 403: 'Origin not allowed', 413: 'Request body too large', 415: 'Unsupported content encoding' }
  res.status(status).json({ error: messages[status] || 'Internal server error' })
})
if (require.main === module) {
  const port = Number(process.env.PORT) || 5000
  const server = app.listen(port, '0.0.0.0', () => console.log(`API listening on port ${port}`))
  server.on('error', () => { console.error('Could not start API'); process.exitCode = 1 })
  const shutdown = () => {
    const timer = setTimeout(() => process.exit(1), 10000)
    timer.unref()
    server.close(async () => { await pool.end(); clearTimeout(timer) })
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}
module.exports = app
