import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import styles from './CarSelect.module.css'

const CARS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    make: 'Toyota / Subaru',
    model: 'GR86 / BRZ',
    generation: 'ZN8/ZD8 (2022+)',
    tags: ['RWD', 'Coupe', 'NA'],
  },
]


export function CarSelect() {
  usePageTitle('Cars')
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Choose your car</h1>
        <p>Select a car to open the 3D configurator.</p>
      </div>

      <div className={styles.grid}>
        {CARS.map(car => (
          <div key={car.id} className={styles.card}>
            <div className={styles.thumb}>
              <img src="/assets/cars/gr86_silhouette.svg" alt="GR86 / BRZ silhouette" className={styles.silhouette} />
            </div>
            <div className={styles.info}>
              <div>
                <p className={styles.make}>{car.make}</p>
                <h2 className={styles.model}>{car.model}</h2>
                <p className={styles.generation}>{car.generation}</p>
                <div className={styles.tags}>
                  {car.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
                </div>
              </div>
              <button className={styles.configure} onClick={() => navigate(`/configure/${car.id}`)}>
                Configure →
              </button>
            </div>
          </div>
        ))}

        {[
          { make: 'Honda', model: 'Civic Type R', generation: 'FL5 (2023+)', tags: ['FWD', 'Hatchback', 'Turbo'] },
          { make: 'Nissan', model: 'GT-R',        generation: 'R35 (2007+)',  tags: ['AWD', 'Coupe', 'Twin-Turbo'] },
        ].map(car => (
          <div key={car.model} className={`${styles.card} ${styles.cardComingSoon}`}>
            <div className={styles.thumb}>
              <img src="/assets/cars/gr86_silhouette.svg" alt={car.model} className={styles.silhouette} />
            </div>
            <div className={styles.info}>
              <div>
                <p className={styles.make}>{car.make}</p>
                <h2 className={styles.model}>{car.model}</h2>
                <p className={styles.generation}>{car.generation}</p>
                <div className={styles.tags}>
                  {car.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
                </div>
              </div>
              <button className={styles.configure} disabled>Coming soon</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
