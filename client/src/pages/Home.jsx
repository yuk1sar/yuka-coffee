import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Menu from '../components/Menu'
import About from '../components/About'
import Reservation from '../components/Reservation'
import Contact from '../components/Contact'

function Home() {
  return (
    <div className="page">
      <Navbar />
      <Hero />
      <Menu />
      <About />
      <Reservation />
      <Contact />
    </div>
  )
}

export default Home