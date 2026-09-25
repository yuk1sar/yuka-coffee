const bcrypt = require('bcrypt')
const pool = require('./db')
async function main() {
  try {
    const username = process.env.ADMIN_USERNAME?.trim()
    const password = process.env.ADMIN_PASSWORD
    if (!username || username.length > 100 || !password || password.length < 12 || Buffer.byteLength(password) > 72) {
      throw new Error('Invalid admin configuration')
    }
    const hash = await bcrypt.hash(password, 12)
    await pool.query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', [username, hash])
    console.log('Admin created successfully')
  } catch {
    console.error('Admin not created. Check input, database connection, and whether username already exists.')
    process.exitCode = 1
  } finally {
    delete process.env.ADMIN_PASSWORD
    await pool.end()
  }
}
main()
