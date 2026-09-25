import { API_URL } from '../api'
import { useEffect, useState } from 'react'

function Admin({ token, onLogout }) {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const loadReservations = async () => {
    try {

      const response = await fetch(
        `${API_URL}/api/reservations`,
        {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        onLogout()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Could not load reservations'
        )
      }

      setReservations(data)
    } catch (error) {
      if (!controller.signal.aborted) setError(error.message)
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
    }
    loadReservations()
    return () => controller.abort()
  }, [token, onLogout])

  const updateStatus = async (id, status) => {
    try {
      setError('')
      setSuccess('')

      const response = await fetch(
        `${API_URL}/api/reservations/${id}/status`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            status,
          }),
        }
      )

      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        onLogout()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Could not update reservation'
        )
      }

      setReservations((currentReservations) =>
        currentReservations.map((reservation) =>
          reservation.id === id
            ? data.reservation
            : reservation
        )
      )

      if (status === 'confirmed') {
        setSuccess('Reservation confirmed successfully.')
      }

      if (status === 'cancelled') {
        setSuccess('Reservation cancelled successfully.')
      }
    } catch (error) {
      console.error(error)
      setError(error.message)
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    onLogout()
  }

  if (loading) {
    return (
      <section className="admin-section">
        <p className="admin-state-message">
          Loading reservations...
        </p>
      </section>
    )
  }

  return (
    <section className="admin-section" id="admin">
      <div className="admin-heading admin-heading-row">
        <div>
          <p className="section-small-title">
            ADMIN
          </p>

          <h2>
            Reservations
          </h2>
        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="admin-message admin-message-error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-message admin-message-success">
          {success}
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="admin-empty">
          No reservations yet.
        </div>
      ) : (
        <div className="admin-table">
          <div className="admin-row admin-header">
            <span>Name</span>
            <span>Phone</span>
            <span>Date</span>
            <span>Time</span>
            <span>Guests</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {reservations.map((reservation) => (
            <div
              className="admin-row"
              key={reservation.id}
            >
              <span>
                {reservation.name}
              </span>

              <span>
                {reservation.phone}
              </span>

              <span>
                {new Date(
                  reservation.reservation_date
                ).toLocaleDateString()}
              </span>

              <span>
                {reservation.reservation_time}
              </span>

              <span>
                {reservation.guests}
              </span>

              <span
                className={`status ${reservation.status}`}
              >
                {reservation.status}
              </span>

              <div className="admin-actions">
                <button
                  className="confirm-button"
                  disabled={
                    reservation.status === 'confirmed'
                  }
                  onClick={() =>
                    updateStatus(
                      reservation.id,
                      'confirmed'
                    )
                  }
                >
                  Confirm
                </button>

                <button
                  className="cancel-button"
                  disabled={
                    reservation.status === 'cancelled'
                  }
                  onClick={() =>
                    updateStatus(
                      reservation.id,
                      'cancelled'
                    )
                  }
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default Admin
