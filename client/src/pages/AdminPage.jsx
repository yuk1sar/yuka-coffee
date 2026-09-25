import { useCallback, useState } from 'react'
import AdminLogin from '../components/AdminLogin'
import Admin from '../components/Admin'

function AdminPage() {
  const [token, setToken] = useState(
    localStorage.getItem('adminToken')
  )
  const handleLogout = useCallback(() => setToken(null), [])

  return (
    <div className="page">
      {token ? (
        <Admin
          token={token}
          onLogout={handleLogout}
        />
      ) : (
        <AdminLogin
          onLogin={(newToken) => setToken(newToken)}
        />
      )}
    </div>
  )
}

export default AdminPage
