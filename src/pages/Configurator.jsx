import { useState, useRef } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Disc3, PanelTop, PanelBottom, ArrowUpDown, Palette, Camera, Bookmark, Image, Pipette, Sun } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { CarViewer } from '../components/Viewer/CarViewer'
import { supabase } from '../lib/supabase'
import styles from './Configurator.module.css'

const CAR_ID = '00000000-0000-0000-0000-000000000001'

const CATEGORIES = [
  { key: 'wheels',       label: 'Wheels',       icon: <Disc3 size={15} /> },
  { key: 'front_bumper', label: 'Front Bumper',  icon: <PanelTop size={15} /> },
  { key: 'rear_bumper',  label: 'Rear Bumper',   icon: <PanelBottom size={15} /> },
  { key: 'ride_height',  label: 'Ride Height',   icon: <ArrowUpDown size={15} /> },
  { key: 'paint',        label: 'Paint',         icon: <Palette size={15} /> },
  { key: 'window_tint',  label: 'Window Tint',   icon: <Sun size={15} /> },
]

const TINT_ZONES = [
  { id: 'all',   label: 'All' },
  { id: 'front', label: 'Front' },
  { id: 'rear',  label: 'Rear' },
  { id: 'sides', label: 'Sides' },
]

const CAMERA_ANGLES = ['Front', 'Side', 'Rear']

// Pearlescent: lower metalness — diffuse sheen, not mirror-like
// Metallic:    higher metalness — strong reflectivity, environment-dependent
const PAINT_GROUPS = [
  {
    label: 'GR86 / BRZ',
    colors: [
      { id: 'pearl_white',    label: 'Pearl White',         finish: 'Pearlescent', hex: '#E6E5E0', roughness: 0.2,  metalness: 0.4  },
      { id: 'ignition_red',   label: 'Ignition Red',        finish: 'Pearlescent', hex: '#C0192C', roughness: 0.2,  metalness: 0.4  },
      { id: 'crystal_black',  label: 'Crystal Black',       finish: 'Metallic',    hex: '#131414', roughness: 0.15, metalness: 0.85 },
      { id: 'electric_blue',  label: 'Electric Blue',       finish: 'Pearlescent', hex: '#2060B0', roughness: 0.2,  metalness: 0.4  },
      { id: 'ice_silver',     label: 'Ice Silver',          finish: 'Metallic',    hex: '#B0B3B5', roughness: 0.15, metalness: 0.85 },
      { id: 'magnetite_gray', label: 'Magnetite Gray',      finish: 'Metallic',    hex: '#3C3C3C', roughness: 0.15, metalness: 0.85 },
      { id: 'sapphire_blue',  label: 'Sapphire Blue Pearl', finish: 'Pearlescent', hex: '#1B2F60', roughness: 0.2,  metalness: 0.4  },
    ],
  },
]

const DEFAULT_PAINT = PAINT_GROUPS[0].colors[0]

const RIDE_HEIGHT_PRESETS = [
  { id: 'stock',   label: 'Stock',   offset: 0     },
  { id: 'low',     label: 'Low',     offset: -0.04 },
  { id: 'slammed', label: 'Slammed', offset: -0.08 },
]

const RIM_COLORS = [
  { id: 'gloss_black',  label: 'Gloss Black',  hex: '#111111', roughness: 0.2,  metalness: 0.7  },
  { id: 'gunmetal',     label: 'Gunmetal',      hex: '#3A3D3F', roughness: 0.2,  metalness: 0.85 },
  { id: 'chrome',       label: 'Chrome',        hex: '#C8CACB', roughness: 0.05, metalness: 1.0  },
  { id: 'gold',         label: 'Gold',          hex: '#C8A85A', roughness: 0.1,  metalness: 0.9  },
  { id: 'bronze',       label: 'Bronze',        hex: '#8B6914', roughness: 0.15, metalness: 0.85 },
  { id: 'white',        label: 'White',         hex: '#E0E0E0', roughness: 0.25, metalness: 0.5  },
  { id: 'matte_black',  label: 'Matte Black',   hex: '#1A1A1A', roughness: 0.8,  metalness: 0.3  },
  { id: 'hyper_silver', label: 'Hyper Silver',  hex: '#B8BABB', roughness: 0.1,  metalness: 1.0  },
]

const BACKGROUNDS = [
  { id: 'dark',     type: 'color', value: '#0d0d0d', label: 'Dark' },
  { id: 'light',    type: 'color', value: '#e8e8e8', label: 'Light' },
  { id: 'city',     type: 'scene', skyColor: '#080812', label: 'City' },
  { id: 'bg1',      type: 'image', value: '/assets/backgrounds/bg1.jpg', label: 'Scene 1' },
  { id: 'bg2',      type: 'image', value: '/assets/backgrounds/bg2.jpg', label: 'Scene 2' },
  { id: 'bg3',      type: 'image', value: '/assets/backgrounds/bg3.jpg', label: 'Scene 3' },
]

export function Configurator() {
  usePageTitle('Configurator')
  useParams()
  const { state } = useLocation()
  const saved = state?.build // populated when navigating from Profile "Load build"
  const savedCfg = saved?.config ?? {}

  const [activeTab, setActiveTab] = useState('wheels')
  const [cameraAngle, setCameraAngle] = useState('Side')
  const [activeBg, setActiveBg] = useState(
    () => BACKGROUNDS.find(b => b.id === savedCfg.backgroundId) ?? BACKGROUNDS[0]
  )

  // Paint — restore preset by id, fall back to custom swatch
  const allPaintColors = PAINT_GROUPS.flatMap(g => g.colors)
  const savedPaint = savedCfg.paintColor
  const initialPaint = savedPaint
    ? allPaintColors.find(c => c.id === savedPaint.id) ?? { id: 'custom' }
    : DEFAULT_PAINT
  const [activePaint, setActivePaint] = useState(initialPaint)
  const [customHex, setCustomHex] = useState(savedPaint?.id === 'custom' ? savedPaint.hex : '#3b82f6')
  const [hexInput, setHexInput] = useState(savedPaint?.id === 'custom' ? savedPaint.hex : '#3b82f6')
  const colorInputRef = useRef()

  // Ride height — prefer config.rideHeight (full float) over ride_height_mm (numeric(6,1) truncates)
  const [rideHeight, setRideHeight] = useState(savedCfg.rideHeight ?? saved?.ride_height_mm ?? 0)
  const activePreset = RIDE_HEIGHT_PRESETS.find(p => p.offset === rideHeight)

  // Camber
  const [camber, setCamber] = useState(savedCfg.camber ?? 0)

  // Window tint
  const [windowTint, setWindowTint] = useState(savedCfg.windowTint ?? 0)
  const [tintTarget, setTintTarget] = useState(savedCfg.tintTarget ?? 'all')

  // Wheels / rim color — restore preset by id, fall back to custom
  const savedRim = savedCfg.rimColor
  const initialRim = savedRim
    ? RIM_COLORS.find(r => r.id === savedRim.id) ?? { id: 'custom' }
    : RIM_COLORS[0]
  const [activeRim, setActiveRim] = useState(initialRim)
  const [customRimHex, setCustomRimHex] = useState(savedRim?.id === 'custom' ? savedRim.hex : '#ffffff')
  const [rimHexInput, setRimHexInput] = useState(savedRim?.id === 'custom' ? savedRim.hex : '#ffffff')
  const rimColorInputRef = useRef()
  const isCustomRim = activeRim.id === 'custom'
  const effectiveRim = isCustomRim
    ? { id: 'custom', label: 'Custom', hex: customRimHex, roughness: 0.2, metalness: 0.8 }
    : activeRim

  const isCustom = activePaint.id === 'custom'
  const effectivePaint = isCustom
    ? { id: 'custom', label: 'Custom', hex: customHex, roughness: 0.25, metalness: 0.7 }
    : activePaint

  // Save state
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'saved' | 'error' | 'unauthenticated'

  async function handleSave() {
    setSaveStatus('saving')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaveStatus('unauthenticated'); return }

    const payload = {
      ride_height_mm: rideHeight,
      config: {
        paintColor: effectivePaint,
        rimColor: effectiveRim,
        mirrorCustom,
        mirrorColor: mirrorCustom ? effectiveMirrorColor : null,
        windowTint,
        tintTarget,
        rideHeight,
        camber,
        backgroundId: activeBg.id,
      },
    }

    const { error } = saved?.id
      ? await supabase.from('saved_configurations').update(payload).eq('id', saved.id)
      : await supabase.from('saved_configurations').insert({ ...payload, user_id: user.id, car_id: CAR_ID })

    if (error) console.error('Save build failed:', error)
    setSaveStatus(error ? 'error' : 'saved')
    if (!error) setTimeout(() => setSaveStatus(null), 2500)
  }

  // Mirror color — must come after effectivePaint since it may reference it
  const savedMirrorHex = savedCfg.mirrorColor?.hex ?? '#131414'
  const [mirrorCustom, setMirrorCustom] = useState(savedCfg.mirrorCustom ?? false)
  const [customMirrorHex, setCustomMirrorHex] = useState(savedMirrorHex)
  const [mirrorHexInput, setMirrorHexInput] = useState(savedMirrorHex)
  const mirrorColorInputRef = useRef()
  const effectiveMirrorColor = mirrorCustom
    ? { id: 'custom_mirror', label: 'Custom', hex: customMirrorHex, roughness: 0.2, metalness: 0.7 }
    : effectivePaint

  function selectCustom() {
    setActivePaint({ id: 'custom' })
  }

  function handleHexInput(e) {
    const val = e.target.value
    setHexInput(val)
    if (/^#[0-9a-fA-F]{6}$/.test(val)) setCustomHex(val)
  }

  function handleColorPicker(e) {
    const val = e.target.value
    setCustomHex(val)
    setHexInput(val)
  }

  return (
    <div className={styles.page}>
      <div className={styles.viewport}>
        <CarViewer
          cameraAngle={cameraAngle}
          activeTab={activeTab}
          background={activeBg}
          paintColor={effectivePaint}
          rimColor={effectiveRim}
          mirrorColor={effectiveMirrorColor}
          windowTint={windowTint}
          tintTarget={tintTarget}
          rideHeight={rideHeight}
          camber={camber}
        />

        <div className={styles.bgPicker}>
          {BACKGROUNDS.map(bg => (
            <button
              key={bg.id}
              title={bg.label}
              className={`${styles.bgSwatch} ${activeBg.id === bg.id ? styles.bgSwatchActive : ''}`}
              onClick={() => setActiveBg(bg)}
            >
              {bg.type === 'color' ? (
                <span className={styles.bgSwatchColor} style={{ background: bg.value }} />
              ) : bg.type === 'scene' ? (
                <span className={styles.bgSwatchColor} style={{ background: 'linear-gradient(to bottom, #0d0d12 50%, #1c1c1c 50%)' }} />
              ) : (
                <span
                  className={styles.bgSwatchImage}
                  style={{ backgroundImage: `url(${bg.value})` }}
                >
                  <Image size={10} />
                </span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.cameraControls}>
          {CAMERA_ANGLES.map(angle => (
            <button
              key={angle}
              className={`${styles.cameraBtn} ${cameraAngle === angle ? styles.cameraBtnActive : ''}`}
              onClick={() => setCameraAngle(angle)}
            >
              <Camera size={12} />
              {angle}
            </button>
          ))}
        </div>
      </div>

      <aside className={styles.sidebar}>
        <div className={styles.tabs}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              className={`${styles.tab} ${activeTab === cat.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(cat.key)}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        <div className={styles.options}>
          {activeTab === 'paint' ? (
            <>
              {PAINT_GROUPS.map(group => (
                <div key={group.label} className={styles.paintGroup}>
                  <p className={styles.paintGroupLabel}>{group.label}</p>
                  <div className={styles.paintGrid}>
                    {group.colors.map(paint => (
                      <button
                        key={paint.id}
                        title={`${paint.label} — ${paint.finish}`}
                        className={`${styles.paintSwatch} ${activePaint.id === paint.id ? styles.paintSwatchActive : ''}`}
                        onClick={() => setActivePaint(paint)}
                      >
                        <span className={styles.paintSwatchColor} style={{ background: paint.hex }} />
                        <span className={styles.paintSwatchLabel}>{paint.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className={styles.paintGroup}>
                <p className={styles.paintGroupLabel}>Custom</p>
                <button
                  className={`${styles.paintCustomBtn} ${isCustom ? styles.paintSwatchActive : ''}`}
                  onClick={selectCustom}
                >
                  <span
                    className={styles.paintSwatchColor}
                    style={{ background: customHex }}
                    onClick={e => { e.stopPropagation(); selectCustom(); colorInputRef.current?.click() }}
                  />
                  <Pipette size={12} />
                  Pick color
                </button>

                {isCustom && (
                  <div className={styles.paintCustomControls}>
                    <div className={styles.hexInputWrap}>
                      <span className={styles.hexHash}>#</span>
                      <input
                        className={styles.hexInput}
                        value={hexInput.replace('#', '')}
                        onChange={e => handleHexInput('#' + e.target.value)}
                        maxLength={6}
                        spellCheck={false}
                      />
                    </div>
                    <input
                      ref={colorInputRef}
                      type="color"
                      className={styles.nativeColorInput}
                      value={customHex}
                      onChange={handleColorPicker}
                    />
                  </div>
                )}
              </div>

              <div className={styles.paintGroup}>
                <label className={styles.mirrorToggleRow}>
                  <input
                    type="checkbox"
                    checked={mirrorCustom}
                    onChange={e => setMirrorCustom(e.target.checked)}
                  />
                  <span className={styles.paintGroupLabel} style={{ margin: 0 }}>Custom mirror color</span>
                </label>
                {mirrorCustom && (
                  <>
                    <button
                      className={`${styles.paintCustomBtn} ${styles.paintSwatchActive}`}
                      onClick={() => mirrorColorInputRef.current?.click()}
                    >
                      <span className={styles.paintSwatchColor} style={{ background: customMirrorHex }} />
                      <Pipette size={12} />
                      Pick color
                    </button>
                    <div className={styles.paintCustomControls}>
                      <div className={styles.hexInputWrap}>
                        <span className={styles.hexHash}>#</span>
                        <input
                          className={styles.hexInput}
                          value={mirrorHexInput.replace('#', '')}
                          onChange={e => {
                            const val = '#' + e.target.value
                            setMirrorHexInput(val)
                            if (/^#[0-9a-fA-F]{6}$/.test(val)) setCustomMirrorHex(val)
                          }}
                          maxLength={6}
                          spellCheck={false}
                        />
                      </div>
                      <input
                        ref={mirrorColorInputRef}
                        type="color"
                        className={styles.nativeColorInput}
                        value={customMirrorHex}
                        onChange={e => { setCustomMirrorHex(e.target.value); setMirrorHexInput(e.target.value) }}
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          ) : activeTab === 'window_tint' ? (
            <div className={styles.rideHeightPanel}>
              <div className={styles.ridePresets}>
                {TINT_ZONES.map(z => (
                  <button
                    key={z.id}
                    className={`${styles.ridePresetBtn} ${tintTarget === z.id ? styles.ridePresetActive : ''}`}
                    onClick={() => setTintTarget(z.id)}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
              <div className={styles.sliderRow}>
                <span className={styles.sliderLabel}>Clear</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={windowTint}
                  className={styles.slider}
                  onChange={e => setWindowTint(parseFloat(e.target.value))}
                />
                <span className={styles.sliderLabel}>Dark</span>
              </div>
            </div>
          ) : activeTab === 'ride_height' ? (
            <div className={styles.rideHeightPanel}>
              <div className={styles.ridePresets}>
                {RIDE_HEIGHT_PRESETS.map(p => (
                  <button
                    key={p.id}
                    className={`${styles.ridePresetBtn} ${activePreset?.id === p.id ? styles.ridePresetActive : ''}`}
                    onClick={() => setRideHeight(p.offset)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className={styles.sliderRow}>
                <span className={styles.sliderLabel}>Raise</span>
                <input
                  type="range"
                  min="-0.08"
                  max="0.02"
                  step="0.005"
                  value={rideHeight}
                  className={styles.slider}
                  onChange={e => setRideHeight(parseFloat(e.target.value))}
                />
                <span className={styles.sliderLabel}>Lower</span>
              </div>
            </div>
          ) : activeTab === 'wheels' ? (
            <>
              <div className={styles.paintGroup}>
                <p className={styles.paintGroupLabel}>Rim Color</p>
                <div className={styles.paintGrid}>
                  {RIM_COLORS.map(rim => (
                    <button
                      key={rim.id}
                      title={rim.label}
                      className={`${styles.paintSwatch} ${activeRim.id === rim.id ? styles.paintSwatchActive : ''}`}
                      onClick={() => setActiveRim(rim)}
                    >
                      <span className={styles.paintSwatchColor} style={{ background: rim.hex }} />
                      <span className={styles.paintSwatchLabel}>{rim.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.paintGroup}>
                <p className={styles.paintGroupLabel}>Custom</p>
                <button
                  className={`${styles.paintCustomBtn} ${isCustomRim ? styles.paintSwatchActive : ''}`}
                  onClick={() => setActiveRim({ id: 'custom' })}
                >
                  <span
                    className={styles.paintSwatchColor}
                    style={{ background: customRimHex }}
                    onClick={e => { e.stopPropagation(); setActiveRim({ id: 'custom' }); rimColorInputRef.current?.click() }}
                  />
                  <Pipette size={12} />
                  Pick color
                </button>
                {isCustomRim && (
                  <div className={styles.paintCustomControls}>
                    <div className={styles.hexInputWrap}>
                      <span className={styles.hexHash}>#</span>
                      <input
                        className={styles.hexInput}
                        value={rimHexInput.replace('#', '')}
                        onChange={e => {
                          const val = '#' + e.target.value
                          setRimHexInput(val)
                          if (/^#[0-9a-fA-F]{6}$/.test(val)) setCustomRimHex(val)
                        }}
                        maxLength={6}
                        spellCheck={false}
                      />
                    </div>
                    <input
                      ref={rimColorInputRef}
                      type="color"
                      className={styles.nativeColorInput}
                      value={customRimHex}
                      onChange={e => { setCustomRimHex(e.target.value); setRimHexInput(e.target.value) }}
                    />
                  </div>
                )}
              </div>
              <div className={styles.paintGroup}>
                <p className={styles.paintGroupLabel}>Camber</p>
                <div className={styles.sliderRow}>
                  <span className={styles.sliderLabel}>0°</span>
                  <input
                    type="range"
                    min="0"
                    max="0.20"
                    step="0.005"
                    value={camber}
                    className={styles.slider}
                    onChange={e => setCamber(parseFloat(e.target.value))}
                  />
                  <span className={styles.sliderLabel}>{(camber * (180 / Math.PI)).toFixed(1)}°</span>
                </div>
              </div>
            </>
          ) : (
            [1, 2, 3].map(i => (
              <div key={i} className={styles.optionCard}>
                <div className={styles.optionThumb} />
                <div className={styles.optionInfo}>
                  <p className={styles.optionName}>Option {i}</p>
                  <p className={styles.optionBrand}>Brand</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.detail}>
          {activeTab === 'window_tint' ? (
            <>
              <p className={styles.detailName}>{windowTint === 0 ? 'Clear' : `${Math.round(windowTint * 100)}% Tint`}</p>
              <p className={styles.detailBrand}>{TINT_ZONES.find(z => z.id === tintTarget)?.label} windows</p>
            </>
          ) : activeTab === 'paint' ? (
            <>
              <p className={styles.detailName}>{effectivePaint.label}</p>
              <p className={styles.detailBrand}>{effectivePaint.finish ?? 'Custom'}</p>
            </>
          ) : activeTab === 'ride_height' ? (
            <>
              <p className={styles.detailName}>{activePreset ? activePreset.label : 'Custom'}</p>
              <p className={styles.detailBrand}>Ride Height</p>
            </>
          ) : activeTab === 'wheels' ? (
            <>
              <p className={styles.detailName}>{effectiveRim.label}</p>
              <p className={styles.detailBrand}>Rim Color</p>
            </>
          ) : (
            <>
              <p className={styles.detailName}>—</p>
              <p className={styles.detailBrand}>Select a part above</p>
            </>
          )}
          <div className={styles.detailActions}>
            <button
              className={styles.saveBtn}
              style={{ flex: 1 }}
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
            >
              <Bookmark size={14} />
              {saveStatus === 'saving'        ? 'Saving…'
                : saveStatus === 'saved'      ? 'Saved!'
                : saveStatus === 'error'      ? 'Error — try again'
                : saveStatus === 'unauthenticated' ? 'Sign in to save'
                : saved?.id                   ? 'Update Build'
                : 'Save Build'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
