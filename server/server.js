const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

require('dotenv').config()

const pool = require('./db')
const requireAuth = require('./auth')

const app = express()

app.use(helmet())

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ],
  })
)

app.use(express.json())

/* =========================
   RATE LIMIT
========================= */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
})

app.use(limiter)

/* =========================
   HEALTH CHECK
========================= */

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Yuka Coffee API is running',
  })
})

/* =========================
   ADMIN LOGIN
========================= */

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required',
      })
    }

    const cleanUsername = String(username).trim()

    const result = await pool.query(
      `
        SELECT
          id,
          username,
          password_hash
        FROM admins
        WHERE username = $1
      `,
      [cleanUsername]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
      })
    }

    const admin = result.rows[0]

    const validPassword = await bcrypt.compare(
      password,
      admin.password_hash
    )

    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
      })
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing')

      return res.status(500).json({
        error: 'Server configuration error',
      })
    }

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '2h',
      }
    )

    res.json({
      message: 'Login successful',
      token,
    })
  } catch (error) {
    console.error('Login error:', error)

    res.status(500).json({
      error: 'Internal server error',
    })
  }
})

/* =========================
   CREATE RESERVATION
========================= */

app.post('/api/reservations', async (req, res) => {
  try {
    const {
      name,
      phone,
      date,
      time,
      guests,
    } = req.body

    const cleanName = String(name || '').trim()

    const normalizedPhone = String(phone || '')
      .trim()
      .replace(/\s/g, '')

    const guestsNumber = Number(guests)

    /* NAME */

    if (
      cleanName.length < 2 ||
      cleanName.length > 100
    ) {
      return res.status(400).json({
        error: 'Invalid name',
      })
    }

    /* PHONE */

    const phoneRegex =
      /^\+994(10|50|51|55|60|70|77|99)[0-9]{7}$/

    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        error:
          'Invalid Azerbaijan phone number',
      })
    }

    /* DATE */

    if (
      !date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return res.status(400).json({
        error: 'Invalid reservation date',
      })
    }

    const reservationDate =
      new Date(`${date}T00:00:00`)

    if (
      Number.isNaN(
        reservationDate.getTime()
      )
    ) {
      return res.status(400).json({
        error: 'Invalid reservation date',
      })
    }

    const today = new Date()

    today.setHours(0, 0, 0, 0)

    if (reservationDate < today) {
      return res.status(400).json({
        error:
          'Reservation date cannot be in the past',
      })
    }

    /* TIME */

    const timeRegex =
      /^([01]\d|2[0-3]):[0-5]\d$/

    if (
      !time ||
      !timeRegex.test(time)
    ) {
      return res.status(400).json({
        error: 'Invalid reservation time',
      })
    }

    /* GUESTS */

    if (
      !Number.isInteger(guestsNumber) ||
      guestsNumber < 1 ||
      guestsNumber > 10
    ) {
      return res.status(400).json({
        error: 'Invalid number of guests',
      })
    }

    /* INSERT */

    const result = await pool.query(
      `
        INSERT INTO reservations
        (
          name,
          phone,
          reservation_date,
          reservation_time,
          guests
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        cleanName,
        normalizedPhone,
        date,
        time,
        guestsNumber,
      ]
    )

    res.status(201).json({
      message:
        'Reservation created successfully',
      reservation: result.rows[0],
    })
  } catch (error) {
    console.error(
      'Reservation error:',
      error
    )

    res.status(500).json({
      error: 'Internal server error',
    })
  }
})

/* =========================
   GET RESERVATIONS
   ADMIN ONLY
========================= */

app.get(
  '/api/reservations',
  requireAuth,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
          SELECT *
          FROM reservations
          ORDER BY created_at DESC
        `
      )

      res.json(result.rows)
    } catch (error) {
      console.error(
        'Fetch reservations error:',
        error
      )

      res.status(500).json({
        error: 'Internal server error',
      })
    }
  }
)

/* =========================
   UPDATE RESERVATION STATUS
========================= */

app.patch(
  '/api/reservations/:id/status',
  requireAuth,
  async (req, res) => {
    try {
      const { id } = req.params
      const { status } = req.body

      const reservationId = Number(id)

      if (
        !Number.isInteger(reservationId) ||
        reservationId < 1
      ) {
        return res.status(400).json({
          error: 'Invalid reservation ID',
        })
      }

      const allowedStatuses = [
        'pending',
        'confirmed',
        'cancelled',
      ]

      if (
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          error: 'Invalid status',
        })
      }

      const result = await pool.query(
        `
          UPDATE reservations
          SET status = $1
          WHERE id = $2
          RETURNING *
        `,
        [
          status,
          reservationId,
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          error:
            'Reservation not found',
        })
      }

      res.json({
        message:
          'Reservation status updated',
        reservation: result.rows[0],
      })
    } catch (error) {
      console.error(
        'Update reservation error:',
        error
      )

      res.status(500).json({
        error: 'Internal server error',
      })
    }
  }
)

/* =========================
   API 404
========================= */

app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
  })
})

/* =========================
   SERVER
========================= */

const PORT =
  Number(process.env.PORT) || 5000

const server = app.listen(
  PORT,
  '127.0.0.1',
  (error) => {
    if (error) {
      console.error(
        'Server start error:',
        error
      )
      return
    }

    console.log(
      `Server running on http://127.0.0.1:${PORT}`
    )
  }
)

server.on('error', (error) => {
  console.error(
    'Server error:',
    error
  )
})