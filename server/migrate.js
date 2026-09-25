const fs = require('node:fs')
const path = require('node:path')
const pool = require('./db')
async function main() {
  try {
    await pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'))
    console.log('Database schema is ready')
  } catch {
    console.error('Migration failed. Check database connection and existing schema.')
    process.exitCode = 1
  } finally { await pool.end() }
}
main()
