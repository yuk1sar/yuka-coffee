import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <main className="not-found">
      <div className="not-found-content">
        <p className="section-small-title">404 ERROR</p>

        <h1>
          Page not
          <br />
          found.
        </h1>

        <p className="not-found-text">
          The page you are looking for does not exist or may have been moved.
        </p>

        <Link to="/" className="not-found-button">
          Back to home
        </Link>
      </div>
    </main>
  )
}

export default NotFound