import { useState } from 'react'
import { SlidersHorizontal, ExternalLink, Search } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import styles from './PartsBrowser.module.css'

const CATEGORIES = ['All', 'Wheels', 'Front Bumper', 'Rear Bumper', 'Paint']

export function PartsBrowser() {
  usePageTitle('Parts')
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <div className={styles.searchWrapper}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.search}
            type="text"
            placeholder="Search parts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <p className={styles.filterLabel}>
          <SlidersHorizontal size={12} />
          Category
        </p>
        <div className={styles.filterList}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className={styles.filterLabel}>
          <SlidersHorizontal size={12} />
          Car
        </p>
        <div className={styles.filterList}>
          <button className={`${styles.filterBtn} ${styles.filterActive}`}>GR86 / BRZ</button>
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.toolbar}>
          <h1>Parts</h1>
          <span className={styles.resultCount}>12 parts</span>
        </div>

        <div className={styles.grid}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={styles.partCard}>
              <div className={styles.partThumb} />
              <div className={styles.partInfo}>
                <p className={styles.partCategory}>Wheels</p>
                <p className={styles.partName}>Part name</p>
                <p className={styles.partBrand}>Brand</p>
                <div className={styles.partFooter}>
                  <span className={styles.partPrice}>—</span>
                  <button className={styles.buyLink} disabled>
                    <ExternalLink size={12} />
                    Buy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
