function Hero() {
  return (
    <main className="hero">
      <div className="hero-content">
        <p className="eyebrow">SPECIALTY COFFEE • BAKU</p>

        <h1>
          Coffee made
          <br />
          simple.
        </h1>

        <p className="hero-text">
          Fresh coffee, calm atmosphere and a clean experience.
          Discover your new favorite place.
        </p>

        <div className="hero-buttons">
          <a className="primary-button" href="#menu">
            View Menu
          </a>

          <a className="secondary-button" href="#contact">
            Visit Us
          </a>
        </div>
      </div>

      <div className="hero-card">
        <span>01</span>

        <div>
          <p>Today's choice</p>
          <h2>Iced Latte</h2>
        </div>

        <strong>₼6.50</strong>
      </div>
    </main>
  )
}

export default Hero