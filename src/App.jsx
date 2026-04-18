import { Routes, Route, Link } from 'react-router-dom'
import { Nav } from './components/Nav/Nav'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Home } from './pages/Home'
import { CarSelect } from './pages/CarSelect'
import { Configurator } from './pages/Configurator'
import { Profile } from './pages/Profile'
import { SharedBuild } from './pages/SharedBuild'
import { PartsBrowser } from './pages/PartsBrowser'
import { Credits } from './pages/Credits'
import styles from './App.module.css'

function App() {
  return (
    <div className={styles.app}>
      <Nav />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cars" element={<CarSelect />} />
          <Route path="/configure/:carId" element={<Configurator />} />
          <Route path="/parts" element={<PartsBrowser />} />
          <Route path="/builds/:id" element={<SharedBuild />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
        </Routes>
      </main>
      <footer className={styles.footer}>
        <Link to="/credits" className={styles.footerLink}>Credits &amp; Attributions</Link>
      </footer>
    </div>
  )
}

export default App
