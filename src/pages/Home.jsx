import { useNavigate } from 'react-router-dom'
import { Box, Layers, ExternalLink } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import styles from './Home.module.css'

export function Home() {
  usePageTitle(null) // root page — just "Stance.io"
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.dotGrid} />
        <div className={styles.heroContent}>
          <h1 className={styles.headline}>Build your vision.<br />Before you buy.</h1>
          <p className={styles.sub}>
            Visualize aftermarket mods on a real-time 3D model of your car — wheels,
            bumpers, stance, paint — then buy directly from the builder.
          </p>
          <button className={styles.cta} onClick={() => navigate('/cars')}>
            Configure your car
          </button>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.iconWrap}><Box size={18} className={styles.icon} /></div>
          <h3>Real-time 3D</h3>
          <p>Rotate, zoom, and inspect every angle before committing.</p>
        </div>
        <div className={styles.feature}>
          <div className={styles.iconWrap}><Layers size={18} className={styles.icon} /></div>
          <h3>Mod catalog</h3>
          <p>Wheels, bumpers, stance, paint — curated parts from top brands.</p>
        </div>
        <div className={styles.feature}>
          <div className={styles.iconWrap}><ExternalLink size={18} className={styles.icon} /></div>
          <h3>Buy direct</h3>
          <p>Every mod links straight to where you can purchase it.</p>
        </div>
      </section>
    </div>
  )
}
