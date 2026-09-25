const path = require('node:path')
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true })
const { Pool, types } = require('pg')
types.setTypeParser(1082, (value) => value)
const connectionString = process.env.DATABASE_URL
if (process.env.NODE_ENV === 'production' && !connectionString) {
  throw new Error('DATABASE_URL is required in production')
}
let config
if (connectionString) {
  const url = new URL(connectionString)
  if (process.env.NODE_ENV === 'production' || url.hostname.endsWith('.neon.tech')) {
    url.searchParams.set('sslmode', 'verify-full')
  }
  config = { connectionString: url.toString(), enableChannelBinding: true }
} else {
  config = { host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD }
}
const pool = new Pool({ ...config, max: 5, connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000, query_timeout: 15000 })
pool.on('error', () => console.error('Database connection error'))
module.exports = pool
