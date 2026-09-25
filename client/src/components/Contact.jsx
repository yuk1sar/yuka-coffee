function Contact() {
  return (
    <section className="contact-section" id="contact">
      <div>
        <p className="section-small-title">VISIT US</p>

        <h2>
          Coffee is
          <br />
          waiting.
        </h2>
      </div>

      <div className="contact-grid">
        <div className="contact-item">
          <span>Address</span>
          <p>Baku, Azerbaijan</p>
        </div>

        <div className="contact-item">
          <span>Opening hours</span>
          <p>
            Mon — Sun
            <br />
            08:00 — 23:00
          </p>
        </div>

        <div className="contact-item">
          <span>Phone</span>
          <p>+994 50 000 00 00</p>
        </div>

        <div className="contact-item">
          <span>Email</span>
          <p>hello@yukacoffee.az</p>
        </div>
      </div>

      <footer className="footer">
        <strong>Yuka Coffee</strong>
        <span>© 2026 Yuka Coffee</span>
      </footer>
    </section>
  )
}

export default Contact