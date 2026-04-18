import { Suspense, useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useGLTF, CameraControls, Grid, Html, useProgress, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import styles from './CarViewer.module.css'

const MODEL_PATH = '/assets/cars/2022_toyota_gr86.glb'

// Car is normalized to 4 units long at load time, so these are stable.
const CAMERA_PRESETS = {
  Front: { pos: [0, 1.5, 6],  target: [0, 0.8, 0] },
  Side:  { pos: [7, 1.5, 0],  target: [0, 0.8, 0] },
  Rear:  { pos: [0, 1.5, -6], target: [0, 0.8, 0] },
}

// Zoom into the relevant part of the car when a config tab is selected.
const TAB_CAMERA_PRESETS = {
  wheels:       { pos: [4.5, 0.5, 0],    target: [0, 0.25, 0]  },  // low side — shows all 4 wheels
  front_bumper: { pos: [1.2, 0.7, 3.8],  target: [0, 0.5, 1.8] },  // close 3/4 front
  rear_bumper:  { pos: [1.2, 0.7, -3.8], target: [0, 0.5, -1.8] }, // close 3/4 rear
  ride_height:  { pos: [5.5, 0.3, 0],    target: [0, 0.15, 0]  },  // very low side — shows clearance
  paint:        { pos: [4.5, 2.2, 3.5],  target: [0, 0.8, 0]   },  // elevated 3/4 — shows body panels
  window_tint:  { pos: [5.5, 1.4, 1.5],  target: [0, 0.9, 0]   },  // angled side — shows all windows
}

const TARGET_LENGTH = 4 // normalize longest axis to 4 units

// All meshes that use the CAR_Paint material (mirrors handled separately)
const PAINT_MESH_NAMES = new Set([
  'Object_107', // Front bumper
  'Object_89',  // Rear bumper
  'Object_119', // Driver door
  'Object_149', // Passenger door
  'Object_197', // Hood
  'Object_244', // Trunk
  'Object_182', // Rear quarter panels
  'Object_191', // Front quarter panels
  'Object_223', // Roof
  'Object_238', // Side skirts
  //'Object_47',  // Interior stitching, accent, pedels, and cover colors
])

// Glass meshes grouped by tint zone. GLASS_MESH_NAMES is derived for fast lookup.
const GLASS_ZONES = {
  front: new Set(['Object_23']),                                       // Front windshield
  rear:  new Set(['Object_26']),                                       // Rear windshield
  sides: new Set(['Object_125', 'Object_128', 'Object_155', 'Object_158']), // Door windows
}
const GLASS_MESH_NAMES = new Set([
  ...GLASS_ZONES.front, ...GLASS_ZONES.rear, ...GLASS_ZONES.sides,
])
const GLASS_BASE_OPACITY = 0.18
const GLASS_MAX_OPACITY  = 0.88

// Side mirrors — optionally a different color from body paint
const MIRROR_MESH_NAMES = new Set([
  'Object_226', // Driver mirror
  'Object_232', // Passenger mirror
])

// X offset that shifts the road right so the car (at x=0) sits in the left lane
// against the left curb (left curb ends up at x ≈ -1.3, car left edge ≈ -0.83)
const ROAD_X = 3.8

// Main rim face mesh for each wheel
const RIM_MESH_NAMES = new Set([
  'Object_316', // Front driver wheel
  'Object_370', // Front passenger wheel
  'Object_439', // Rear driver wheel
  'Object_517', // Rear passenger wheel
])

function LoadingIndicator() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className={styles.loader}>
        <div className={styles.loaderBar}>
          <div className={styles.loaderFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.loaderText}>{Math.round(progress)}%</span>
      </div>
    </Html>
  )
}

// Prefix-match the 4 wheel group nodes regardless of Sketchfab-appended index
const WHEEL_GROUP_PREFIXES = ['tire_1', 'tyre_2', 'tire_3', 'tire_4']

function CarModel({ paintColor, rimColor, mirrorColor, windowTint, tintTarget, rideHeight, camber }) {
  const { scene } = useGLTF(MODEL_PATH)

  const ref = useRef()
  const paintMatsRef = useRef([])
  const rimMatsRef = useRef([])
  const mirrorMatsRef = useRef([])
  const glassMatsRef = useRef({ front: [], rear: [], sides: [] })
  const baseYRef = useRef(0)
  const wheelGroupsRef = useRef([]) // { node, baseLocalY }[]

  const cloned = useMemo(() => {
    const clone = scene.clone(true)
    clone.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)

    if (maxDim > 0) {
      const scaleFactor = TARGET_LENGTH / maxDim
      clone.scale.setScalar(scaleFactor)
      clone.updateMatrixWorld(true)
      box.setFromObject(clone)

      const center = new THREE.Vector3()
      box.getCenter(center)
      clone.position.x -= center.x
      clone.position.z -= center.z
      clone.position.y -= box.min.y
    }

    baseYRef.current = clone.position.y
    return clone
  }, [scene])

  // Collect paint/rim/mirror/glass materials and wheel group nodes once attached
  useEffect(() => {
    if (!ref.current) return
    paintMatsRef.current = []
    rimMatsRef.current = []
    mirrorMatsRef.current = []
    glassMatsRef.current = { front: [], rear: [], sides: [] }
    wheelGroupsRef.current = []

    // Pass 1 — record which material objects belong to paint meshes so we can
    // neutralize any other mesh that shares the same material (e.g. glass panels).
    const paintMatSet = new Set()
    ref.current.traverse(node => {
      if (node.isMesh && PAINT_MESH_NAMES.has(node.name)) paintMatSet.add(node.material)
    })

    ref.current.traverse((node) => {
      if (node.isMesh) {
        if (PAINT_MESH_NAMES.has(node.name)) {
          node.material = node.material.clone()
          paintMatsRef.current.push(node.material)
        } else if (MIRROR_MESH_NAMES.has(node.name)) {
          node.material = node.material.clone()
          mirrorMatsRef.current.push(node.material)
        } else if (RIM_MESH_NAMES.has(node.name)) {
          node.material = node.material.clone()
          rimMatsRef.current.push(node.material)
        } else if (GLASS_MESH_NAMES.has(node.name)) {
          // Glass panes have their own red-tinted material in the original model.
          // transparent=true + depthWrite=false prevents them occluding interior geo.
          node.material = node.material.clone()
          node.material.color.set('#050a0c')
          node.material.roughness = 0.0
          node.material.metalness = 0.0
          node.material.transparent = true
          node.material.opacity = GLASS_BASE_OPACITY
          node.material.depthWrite = false
          node.material.side = THREE.DoubleSide
          node.material.needsUpdate = true
          // Slot into the correct tint zone
          for (const [zone, names] of Object.entries(GLASS_ZONES)) {
            if (names.has(node.name)) {
              glassMatsRef.current[zone].push(node.material)
              break
            }
          }
        } else if (paintMatSet.has(node.material)) {
          // Shares the paint material but shouldn't be painted — neutralize to avoid
          // the model's original red bleeding onto interior panels.
          node.material = node.material.clone()
          node.material.color.set('#0a0e10')
          node.material.depthWrite = false
          node.material.needsUpdate = true
        }
      }
    })

    // Find wheel groups as direct children of RootNode only — avoids
    // matching child nodes like tire_1_tyre_0_* that share the same prefix
    ref.current.traverse(node => {
      if (node.name.startsWith('RootNode')) {
        node.children.forEach(child => {
          if (WHEEL_GROUP_PREFIXES.some(p => child.name.startsWith(p))) {
            wheelGroupsRef.current.push({ node: child, baseLocalY: child.position.y, camberSign: child.position.x > 0 ? 1 : -1 })
          }
        })
      }
    })
  }, [cloned])

  // Paint color
  useEffect(() => {
    if (!paintColor || paintMatsRef.current.length === 0) return
    paintMatsRef.current.forEach(mat => {
      mat.color.set(paintColor.hex)
      mat.roughness = paintColor.roughness
      mat.metalness = paintColor.metalness
      mat.needsUpdate = true
    })
  }, [paintColor])

  // Rim color
  useEffect(() => {
    if (!rimColor || rimMatsRef.current.length === 0) return
    rimMatsRef.current.forEach(mat => {
      mat.map = null              // clear texture so color isn't tinted dark
      mat.color.set(rimColor.hex)
      mat.roughness = rimColor.roughness
      mat.metalness = rimColor.metalness
      mat.envMapIntensity = 1    // ensure studio env contributes reflections
      mat.needsUpdate = true
    })
  }, [rimColor])

  // Mirror color
  useEffect(() => {
    if (!mirrorColor || mirrorMatsRef.current.length === 0) return
    mirrorMatsRef.current.forEach(mat => {
      mat.map = null
      mat.color.set(mirrorColor.hex)
      mat.roughness = mirrorColor.roughness
      mat.metalness = mirrorColor.metalness
      mat.needsUpdate = true
    })
  }, [mirrorColor])

  // Window tint
  useEffect(() => {
    const targeted = tintTarget === 'all'
      ? ['front', 'rear', 'sides']
      : [tintTarget]
    const allZones = ['front', 'rear', 'sides']
    allZones.forEach(zone => {
      const opacity = targeted.includes(zone)
        ? GLASS_BASE_OPACITY + windowTint * (GLASS_MAX_OPACITY - GLASS_BASE_OPACITY)
        : GLASS_BASE_OPACITY
      glassMatsRef.current[zone].forEach(mat => {
        mat.opacity = opacity
        mat.needsUpdate = true
      })
    })
  }, [windowTint, tintTarget])

  // Ride height — move body root, counter-move wheels so they stay grounded
  useEffect(() => {
    if (!ref.current) return
    ref.current.position.y = baseYRef.current + rideHeight
    wheelGroupsRef.current.forEach(({ node, baseLocalY }) => {
      node.position.y = baseLocalY - rideHeight
    })
  }, [rideHeight])

  // Camber — tilt wheel tops inward (negative camber)
  useEffect(() => {
    wheelGroupsRef.current.forEach(({ node, camberSign }) => {
      node.rotation.z = camberSign * camber
    })
  }, [camber])

  return <primitive ref={ref} object={cloned} />
}

function SceneBackground({ background }) {
  const { scene } = useThree()

  useEffect(() => {
    if (background.type === 'color') {
      scene.background = new THREE.Color(background.value)
    } else if (background.type === 'scene') {
      scene.background = new THREE.Color(background.skyColor)
    } else {
      new THREE.TextureLoader().load(background.value, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        scene.background = texture
      })
    }
  }, [background, scene])

  return null
}

function CityscapeScene({ skyColor, onReady }) {
  const warmWindowsRef = useRef()
  const coolWindowsRef = useRef()

  const { buildingData, warmWindows, coolWindows } = useMemo(() => {
    let s = 0xdeadbeef
    const rnd = () => {
      s ^= s >>> 15; s = Math.imul(s, 0x9e3779b9 | 1); s ^= s >>> 13
      return (s >>> 0) / 0xffffffff
    }

    const buildingData = []
    const warmWindows = []
    const coolWindows = []

    const addBuilding = (bx, bz, bw, bh, bd, face) => {
      buildingData.push({ pos: [bx, bh / 2, bz], args: [bw, bh, bd] })

      // Which face of the building is visible from the road
      let faceCoord, rotY, colSpan, colBase
      if (face === 'bg') {
        faceCoord = bz + bd / 2 + 0.01
        rotY = 0
        colSpan = bw
        colBase = bx - bw / 2
      } else if (face === 'left') {
        faceCoord = bx + bw / 2 + 0.01  // +X face
        rotY = Math.PI / 2
        colSpan = bd
        colBase = bz - bd / 2
      } else {
        faceCoord = bx - bw / 2 - 0.01  // -X face
        rotY = -Math.PI / 2
        colSpan = bd
        colBase = bz - bd / 2
      }

      const numCols = Math.max(1, Math.floor(colSpan / 0.4))
      const colStep = colSpan / numCols
      const totalFloors = Math.max(1, Math.floor(bh / 0.5) - 1)

      for (let floor = 0; floor < totalFloors; floor++) {
        const wy = floor * 0.5 + 0.3
        const r = rnd()
        // 12% floors fully dark, 10% very busy, rest scattered
        const prob = r < 0.12 ? 0 : r < 0.22 ? 0.9 : rnd() * 0.45 + 0.1

        for (let col = 0; col < numCols; col++) {
          if (prob > 0 && rnd() < prob) {
            const offset = colBase + (col + 0.5) * colStep
            const entry = face === 'bg'
              ? [offset, wy, faceCoord, 0]
              : [faceCoord, wy, offset, rotY]
            if (rnd() < 0.25) coolWindows.push(entry)
            else warmWindows.push(entry)
          }
        }
      }
    }

    // Left flanking buildings — z capped at -8 so none appear right beside the car
    for (let i = 0; i < 14; i++) {
      const h = 3 + rnd() * 13, w = 1.5 + rnd() * 2.5, d = 1.5 + rnd() * 2.5
      addBuilding(ROAD_X - (10 + rnd() * 4 + w / 2), -8 - rnd() * 42, w, h, d, 'left')
    }
    // Right flanking buildings — z capped at -8
    for (let i = 0; i < 14; i++) {
      const h = 3 + rnd() * 13, w = 1.5 + rnd() * 2.5, d = 1.5 + rnd() * 2.5
      addBuilding(ROAD_X + 10 + rnd() * 4 + w / 2, -8 - rnd() * 42, w, h, d, 'right')
    }
    // Deep background towers — split left/right of road so none land on the tarmac
    for (let i = 0; i < 9; i++) {
      const h = 10 + rnd() * 22, w = 2 + rnd() * 4, d = 2 + rnd() * 4
      addBuilding(ROAD_X - (9 + rnd() * 16), -25 - rnd() * 30, w, h, d, 'bg')
    }
    for (let i = 0; i < 9; i++) {
      const h = 10 + rnd() * 22, w = 2 + rnd() * 4, d = 2 + rnd() * 4
      addBuilding(ROAD_X + (9 + rnd() * 16), -25 - rnd() * 30, w, h, d, 'bg')
    }

    return { buildingData, warmWindows, coolWindows }
  }, [])

  // Upload warm window instance matrices
  useEffect(() => {
    const mesh = warmWindowsRef.current
    if (!mesh || warmWindows.length === 0) return
    const m4 = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const yAxis = new THREE.Vector3(0, 1, 0)
    const scl = new THREE.Vector3(1, 1, 1)
    warmWindows.forEach(([x, y, z, ry], i) => {
      pos.set(x, y, z); quat.setFromAxisAngle(yAxis, ry)
      m4.compose(pos, quat, scl); mesh.setMatrixAt(i, m4)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [warmWindows])

  // Upload cool window instance matrices, then signal ready
  useEffect(() => {
    const mesh = coolWindowsRef.current
    if (!mesh || coolWindows.length === 0) return
    const m4 = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const yAxis = new THREE.Vector3(0, 1, 0)
    const scl = new THREE.Vector3(1, 1, 1)
    coolWindows.forEach(([x, y, z, ry], i) => {
      pos.set(x, y, z); quat.setFromAxisAngle(yAxis, ry)
      m4.compose(pos, quat, scl); mesh.setMatrixAt(i, m4)
    })
    mesh.instanceMatrix.needsUpdate = true
    onReady?.()
  }, [coolWindows, onReady])

  const laneDashes = useMemo(() => {
    const out = []; for (let z = -80; z < 30; z += 6) out.push(z); return out
  }, [])

  return (
    <>
      <fog attach="fog" color={skyColor} near={24} far={62} />

      {/* Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROAD_X, -0.005, 0]} receiveShadow>
        <planeGeometry args={[10, 400]} />
        <meshStandardMaterial color="#111114" roughness={0.96} metalness={0.02} />
      </mesh>

      {/* Sidewalks */}
      {[-7, 7].map(x => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[ROAD_X + x, -0.004, 0]}>
          <planeGeometry args={[8, 400]} />
          <meshStandardMaterial color="#18181c" roughness={0.92} />
        </mesh>
      ))}

      {/* Curbs */}
      {[-5.1, 5.1].map(x => (
        <mesh key={x} position={[ROAD_X + x, 0.025, 0]}>
          <boxGeometry args={[0.18, 0.05, 400]} />
          <meshStandardMaterial color="#242428" roughness={0.85} />
        </mesh>
      ))}

      {/* Centre line dashes */}
      {laneDashes.map(z => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[ROAD_X, -0.003, z]}>
          <planeGeometry args={[0.1, 3]} />
          <meshStandardMaterial color="#c8b400" emissive="#c8b400" emissiveIntensity={0.2} roughness={0.9} />
        </mesh>
      ))}

      {/* Building shells */}
      {buildingData.map((b, i) => (
        <mesh key={i} position={b.pos} castShadow receiveShadow>
          <boxGeometry args={b.args} />
          <meshStandardMaterial
            color={['#0b0b14', '#0d0d10', '#090c14', '#0c0c0e'][i % 4]}
            roughness={0.55} metalness={0.45}
            emissive={['#0a1228', '#060810', '#08101e', '#060808'][i % 4]}
            emissiveIntensity={0.7}
          />
        </mesh>
      ))}

      {/* Warm windows — yellow office light */}
      {warmWindows.length > 0 && (
        <instancedMesh ref={warmWindowsRef} args={[null, null, warmWindows.length]} frustumCulled={false}>
          <planeGeometry args={[0.18, 0.26]} />
          <meshStandardMaterial color="#ffcc44" emissive="#ffcc44" emissiveIntensity={2.2} />
        </instancedMesh>
      )}

      {/* Cool windows — blue-white fluorescent light */}
      {coolWindows.length > 0 && (
        <instancedMesh ref={coolWindowsRef} args={[null, null, coolWindows.length]} frustumCulled={false}>
          <planeGeometry args={[0.18, 0.26]} />
          <meshStandardMaterial color="#c8e4ff" emissive="#c8e4ff" emissiveIntensity={1.8} />
        </instancedMesh>
      )}
    </>
  )
}

function Scene({ cameraAngle, activeTab, background, paintColor, rimColor, mirrorColor, windowTint, tintTarget, rideHeight, camber, onCityReady }) {
  const controlsRef = useRef()

  useEffect(() => {
    if (!controlsRef.current || !cameraAngle) return
    const { pos, target } = CAMERA_PRESETS[cameraAngle]
    controlsRef.current.setLookAt(
      pos[0], pos[1], pos[2],
      target[0], target[1], target[2],
      true
    )
  }, [cameraAngle])

  useEffect(() => {
    if (!controlsRef.current || !activeTab) return
    const preset = TAB_CAMERA_PRESETS[activeTab]
    if (!preset) return
    controlsRef.current.setLookAt(
      preset.pos[0], preset.pos[1], preset.pos[2],
      preset.target[0], preset.target[1], preset.target[2],
      true
    )
  }, [activeTab])

  return (
    <>
      <SceneBackground background={background} />
      <CameraControls
        ref={controlsRef}
        minDistance={2}
        maxDistance={20}
        polarAngleRange={[0.25, Math.PI / 2.1]}
      />

      {/* IBL — essential for metallic paint to reflect light correctly */}
      <Environment preset="studio" background={false} />

      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 8, 5]}   intensity={2.5} castShadow />
      <directionalLight position={[-5, 5, 3]}   intensity={1.2} />
      <directionalLight position={[0, 4, -6]}   intensity={0.8} />
      <directionalLight position={[0, 8, 0]}    intensity={0.6} />

      {background.type === 'scene' && (
        <CityscapeScene skyColor={background.skyColor} onReady={onCityReady} />
      )}

      {background.type === 'color' && (
        <Grid
          position={[0, -0.01, 0]}
          args={[40, 40]}
          cellSize={0.5}
          cellThickness={0.4}
          cellColor="#1e1e1e"
          sectionSize={2}
          sectionThickness={0.8}
          sectionColor="#2a2a2a"
          fadeDistance={18}
          fadeStrength={1.5}
          infiniteGrid
        />
      )}

      <ContactShadows
        position={[0, 0, 0]}
        opacity={background.type === 'image' ? 0.55 : 0.3}
        scale={12}
        blur={2.5}
        far={1.2}
        resolution={512}
      />

      <Suspense fallback={<LoadingIndicator />}>
        <CarModel paintColor={paintColor} rimColor={rimColor} mirrorColor={mirrorColor} windowTint={windowTint} tintTarget={tintTarget} rideHeight={rideHeight} camber={camber} />
      </Suspense>
    </>
  )
}

export function CarViewer({ cameraAngle, activeTab, background, paintColor, rimColor, mirrorColor, windowTint, tintTarget, rideHeight, camber }) {
  const [cityLoading, setCityLoading] = useState(false)

  useEffect(() => {
    if (background.type === 'scene') setCityLoading(true)
    else setCityLoading(false)
  }, [background.id])

  const handleCityReady = useCallback(() => setCityLoading(false), [])

  return (
    <div className={styles.canvasWrap}>
      {cityLoading && (
        <div className={styles.cityLoader}>
          <div className={styles.cityLoaderBar}>
            <div className={styles.cityLoaderFill} />
          </div>
          <span className={styles.cityLoaderText}>Building scene…</span>
        </div>
      )}
      <Canvas
        camera={{ position: [7, 1.4, 0], fov: 45 }}
        shadows
        gl={{ antialias: true }}
      >
        <Scene cameraAngle={cameraAngle} activeTab={activeTab} background={background} paintColor={paintColor} rimColor={rimColor} mirrorColor={mirrorColor} windowTint={windowTint} tintTarget={tintTarget} rideHeight={rideHeight} camber={camber} onCityReady={handleCityReady} />
      </Canvas>
    </div>
  )
}

useGLTF.preload(MODEL_PATH)
