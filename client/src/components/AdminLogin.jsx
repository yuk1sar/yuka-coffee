import { useState } from 'react'

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    const cleanUsername = username.trim()

    if (!cleanUsername) {
      setError('Enter username.')
      return
    }

    if (!password) {
      setError('Enter password.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        'http://127.0.0.1:5000/api/admin/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: cleanUsername,
            password,
          }),
        }
      )

      const contentType = response.headers.get('content-type')

      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned an invalid response.')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Login failed.'
        )
      }

      if (!data.token) {
        throw new Error('Login token was not received.')
      }

      localStorage.setItem('adminToken', data.token)

      onLogin(data.token)
    } catch (error) {
      console.error('Admin login error:', error)

      setError(
        error.message || 'Could not connect to the server.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="admin-login-section">
      <div className="admin-login-card">
        <p className="section-small-title">
          ADMIN ACCESS
        </p>

        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>

            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Username"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Password"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Logging in...'
              : 'Login'}
          </button>

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}
        </form>
      </div>
    </section>
  )
}

export default AdminLogin