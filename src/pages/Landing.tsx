import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div className="app-shell auth-only">
      <section className="hero-screen">
        <h1 className="brand-mark">
          CSG <span className="accent">Celebrate</span>
        </h1>
        <p>Share wins, events, and culture with your CSG teammates — feed-first, mobile-ready.</p>
        <div className="hero-actions">
          <Link to="/login" className="btn btn-primary">
            Sign in
          </Link>
          <Link to="/register" className="btn btn-secondary">
            Create account
          </Link>
        </div>
      </section>
    </div>
  )
}
