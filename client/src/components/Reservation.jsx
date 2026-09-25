import { useState } from 'react'

function Reservation() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    guests: '2',
  })

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setMessage('')

    const name = form.name.trim()
    const phone = form.phone.trim().replace(/\s/g, '')
    const guestsNumber = Number(form.guests)

    // NAME
    if (name.length < 2) {
      setMessage('Name is too short.')
      return
    }

    if (name.length > 100) {
      setMessage('Name is too long.')
      return
    }

    // PHONE
    const phoneRegex = /^\+994(10|50|51|55|60|70|77|99)[0-9]{7}$/

    if (!phoneRegex.test(phone)) {
      setMessage(
        'Enter a valid Azerbaijan phone number, for example +994501234567.'
      )
      return
    }

    // DATE
    if (!form.date) {
      setMessage('Choose a reservation date.')
      return
    }

    const selectedDate = new Date(`${form.date}T00:00:00`)
    const today = new Date()

    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      setMessage('Reservation date cannot be in the past.')
      return
    }

    // TIME
    if (!form.time) {
      setMessage('Choose a reservation time.')
      return
    }

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

    if (!timeRegex.test(form.time)) {
      setMessage('Choose a valid reservation time.')
      return
    }

    // GUESTS
    if (
      !Number.isInteger(guestsNumber) ||
      guestsNumber < 1 ||
      guestsNumber > 10
    ) {
      setMessage('Guests must be between 1 and 10.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        'http://127.0.0.1:5000/api/reservations',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            name,
            phone,
            date: form.date,
            time: form.time,
            guests: guestsNumber,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Could not create reservation.'
        )
      }

      setMessage('Reservation sent successfully.')

      setForm({
        name: '',
        phone: '',
        date: '',
        time: '',
        guests: '2',
      })
    } catch (error) {
      console.error('Reservation error:', error)

      setMessage(
        error.message || 'Could not send reservation.'
      )
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <section
      className="reservation-section"
      id="reservation"
    >
      <div className="reservation-info">
        <p className="section-small-title">
          RESERVATION
        </p>

        <h2>
          Save your
          <br />
          table.
        </h2>

        <p>
          Choose a date and time and leave your contact
          information. We will confirm your reservation.
        </p>
      </div>

      <form
        className="reservation-form"
        onSubmit={handleSubmit}
      >
        <div className="form-group">
          <label>Name</label>

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
            minLength="2"
            maxLength="100"
            required
          />
        </div>

        <div className="form-group">
          <label>Phone</label>

          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+994501234567"
            maxLength="13"
            autoComplete="tel"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date</label>

            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              min={today}
              required
            />
          </div>

          <div className="form-group">
            <label>Time</label>

            <input
              type="time"
              name="time"
              value={form.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Guests</label>

          <select
            name="guests"
            value={form.guests}
            onChange={handleChange}
          >
            <option value="1">1 guest</option>
            <option value="2">2 guests</option>
            <option value="3">3 guests</option>
            <option value="4">4 guests</option>
            <option value="5">5 guests</option>
            <option value="6">6 guests</option>
            <option value="7">7 guests</option>
            <option value="8">8 guests</option>
            <option value="9">9 guests</option>
            <option value="10">10 guests</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? 'Sending...'
            : 'Reserve table'}
        </button>

        {message && (
          <p className="form-message">
            {message}
          </p>
        )}
      </form>
    </section>
  )
}

export default Reservation