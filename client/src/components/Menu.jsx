import menuItems from '../data/menu'

function Menu() {
  return (
    <section className="menu-section" id="menu">
      <div className="section-heading">
        <p>OUR MENU</p>
        <h2>
          Simple choices.
          <br />
          Good coffee.
        </h2>
      </div>

      <div className="menu-grid">
        {menuItems.map((item) => (
          <article className="menu-item" key={item.id}>
            <div>
              <span>0{item.id}</span>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </div>

            <strong>₼{item.price.toFixed(2)}</strong>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Menu