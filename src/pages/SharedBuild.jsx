import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Link2, Check } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { supabase } from '../lib/supabase'
import { CarViewer } from '../components/Viewer/CarViewer'
import styles from './SharedBuild.module.css'

const BACKGROUNDS = [
  { id: 'dark',  type: 'color', value: '#0d0d0d',  skyColor: undefined,  label: 'Dark'   },
  { id: 'light', type: 'color', value: '#e8e8e8',  skyColor: undefined,  label: 'Light'  },
  { id: 'city',  type: 'scene', value: undefined,  skyColor: '#080812',  label: 'City'   },
  { id: 'bg1',   type: 'image', value: '/assets/backgrounds/bg1.jpg', label: 'Scene 1' },
  { id: 'bg2',   type: 'image', value: '/assets/backgrounds/bg2.jpg', label: 'Scene 2' },
  { id: 'bg3',   type: 'image', value: '/assets/backgrounds/bg3.jpg', label: 'Scene 3' },
]
const DEFAULT_BG = BACKGROUNDS[0]

export function SharedBuild() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [build, setBuild] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  usePageTitle(build ? build.name : 'Shared Build')

  useEffect(() => {
    supabase
      .from('saved_configurations')
      .select('id, name, config, ride_height_mm')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setBuild(data)
        setLoading(false)
      })
  }, [id])

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    })
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.viewport}>
          <div className={styles.viewportPlaceholder}><p>Loading…</p></div>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className={styles.page}>
        <div className={styles.viewport}>
          <div className={styles.viewportPlaceholder}><p>Build not found.</p></div>
        </div>
      </div>
    )
  }

  const cfg = build.config ?? {}
  const background = BACKGROUNDS.find(b => b.id === cfg.backgroundId) ?? DEFAULT_BG
  // Snap to nearest preset — ride_height_mm is numeric(6,1) so -0.08 becomes -0.1 in old saves
  const PRESET_OFFSETS = [0, -0.04, -0.08]
  const rawRideHeight = cfg.rideHeight ?? build.ride_height_mm ?? 0
  const rideHeight = cfg.rideHeight != null ? cfg.rideHeight : (() => {
    const nearest = PRESET_OFFSETS.reduce((a, b) => Math.abs(b - rawRideHeight) < Math.abs(a - rawRideHeight) ? b : a)
    return Math.abs(nearest - rawRideHeight) < 0.025 ? nearest : rawRideHeight
  })()
  const mirrorColor = cfg.mirrorCustom ? cfg.mirrorColor : cfg.paintColor

  const RIDE_LABELS = { 0: 'Stock', '-0.04': 'Low', '-0.08': 'Slammed' }
  const rideLabel = RIDE_LABELS[String(rideHeight)] ?? 'Custom'
  const tintLabel = cfg.windowTint ? `${Math.round(cfg.windowTint * 100)}%` : 'None'

  return (
    <div className={styles.page}>
      {copied && <div className={styles.toast}>Link copied to clipboard</div>}
      <div className={styles.viewport}>
        <CarViewer
          background={background}
          paintColor={cfg.paintColor}
          rimColor={cfg.rimColor}
          mirrorColor={mirrorColor}
          windowTint={cfg.windowTint ?? 0}
          tintTarget={cfg.tintTarget ?? 'all'}
          rideHeight={rideHeight}
          camber={cfg.camber ?? 0}
        />
      </div>

      <div className={styles.panel}>
        <div className={styles.buildMeta}>
          <p className={styles.carName}>Toyota GR86 / Subaru BRZ</p>
          <h1 className={styles.buildName}>{build.name}</h1>
        </div>

        <div className={styles.partsList}>
          <div className={styles.partRow}>
            <span className={styles.partCategory}>Paint</span>
            <span className={styles.partValue} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {cfg.paintColor?.hex && (
                <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: cfg.paintColor.hex, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
              )}
              {cfg.paintColor?.label ?? '—'}
            </span>
          </div>
          <div className={styles.partRow}>
            <span className={styles.partCategory}>Rims</span>
            <span className={styles.partValue} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {cfg.rimColor?.hex && (
                <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: cfg.rimColor.hex, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
              )}
              {cfg.rimColor?.label ?? '—'}
            </span>
          </div>
          <div className={styles.partRow}>
            <span className={styles.partCategory}>Ride Height</span>
            <span className={styles.partValue}>{rideLabel}</span>
          </div>
          <div className={styles.partRow}>
            <span className={styles.partCategory}>Camber</span>
            <span className={styles.partValue}>
              {cfg.camber ? `${(cfg.camber * (180 / Math.PI)).toFixed(1)}°` : 'Stock'}
            </span>
          </div>
          <div className={styles.partRow}>
            <span className={styles.partCategory}>Window Tint</span>
            <span className={styles.partValue}>{tintLabel}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.copyBtn} onClick={copyLink}>
            {copied ? <Check size={14} /> : <Link2 size={14} />}
            Copy link
          </button>
          <button className={styles.configureBtn} onClick={() => navigate('/cars')}>
            Configure yours →
          </button>
        </div>
      </div>
    </div>
  )
}
