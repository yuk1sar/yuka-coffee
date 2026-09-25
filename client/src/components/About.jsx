function About() {
  return (
    <section className="about-section" id="about">
      <div className="about-label">
        <span>ABOUT</span>
      </div>

      <div className="about-content">
        <h2>
          More than
          <br />
          just coffee.
        </h2>

        <div className="about-text">
          <p>
            Yuka Coffee is a modern coffee space built around simplicity,
            quality and a calm atmosphere.
          </p>

          <p>
            We focus on good coffee, clean design and a comfortable place
            where people can work, meet or simply slow down.
          </p>

          <div className="about-stats">
            <div>
              <strong>2026</strong>
              <span>Founded</span>
            </div>

            <div>
              <strong>12+</strong>
              <span>Coffee drinks</span>
            </div>

            <div>
              <strong>7 days</strong>
              <span>Open weekly</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About