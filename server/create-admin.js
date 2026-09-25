require('dotenv').config()

const bcrypt = require('bcrypt')
const pool = require('./db')

async function createAdmin() {
  try {
    const username = 'admin'
    const password = 'admin321'

    const passwordHash = await bcrypt.hash(password, 12)

    await pool.query(
      `
        INSERT INTO admins (username, password_hash)
        VALUES ($1, $2)
        ON CONFLICT (username) DO UPDATE
        SET password_hash = EXCLUDED.password_hash
      `,
      [username, passwordHash]
    )

    console.log('Admin created successfully')
  } catch (error) {
    console.error('Create admin error:', error)
  } finally {
    await pool.end()
  }
}

createAdmin()