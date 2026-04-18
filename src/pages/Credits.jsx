import { ExternalLink, Box, User, Scale } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import styles from './Credits.module.css'

const CREDITS = [
  {
    id: 1,
    title: '2022 Toyota GR86',
    author: 'Maroi Mister Let Me Think Official 3D Studio',
    url: 'https://skfb.ly/pFBC7',
    platform: 'Sketchfab',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
]

export function Credits() {
  usePageTitle('Credits')

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Credits &amp; Attributions</h1>
        <p>
          3D models used in this project are sourced from{' '}
          <a href="https://sketchfab.com" target="_blank" rel="noreferrer" className={styles.platformLink}>
            Sketchfab
            <ExternalLink size={12} />
          </a>{' '}
          and licensed under Creative Commons. Authors are credited below.
        </p>
      </div>

      <div className={styles.list}>
        {CREDITS.map(item => (
          <div key={item.id} className={styles.card}>
            <div className={styles.icon}>
              <Box size={18} />
            </div>
            <div className={styles.body}>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className={styles.title}
              >
                {item.title}
                <ExternalLink size={13} />
              </a>
              <div className={styles.meta}>
                <span className={styles.metaItem}>
                  <User size={12} />
                  {item.author}
                </span>
                <span className={styles.metaItem}>
                  <Scale size={12} />
                  <a
                    href={item.licenseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.licenseLink}
                  >
                    {item.license}
                  </a>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
