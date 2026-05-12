import React, { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useLoader, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, useGLTF, Center, Bounds, GizmoHelper, GizmoViewport } from '@react-three/drei'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { Box3, Vector3 } from 'three'

// ── Part detection: traverse scene graph, collect mesh names + bboxes ──
export function extractPartsFromScene(object) {
  const parts = []
  const seen  = new Set()

  object.traverse((child) => {
    if (child.isMesh) {
      let name = child.name?.trim()
      if (!name || name === '' || /^(mesh|object|unnamed|default|\d+)$/i.test(name)) {
        name = child.parent?.name?.trim()
      }
      if (!name || name === '' || /^(scene|root|group|object|mesh|\d+)$/i.test(name)) {
        name = null
      }
      if (name && !seen.has(name)) {
        seen.add(name)
        const box = new Box3().setFromObject(child)
        parts.push({
          name,
          bbox: box.isEmpty() ? null : {
            min: { x: box.min.x, y: box.min.y, z: box.min.z },
            max: { x: box.max.x, y: box.max.y, z: box.max.z },
          },
        })
      }
    }
  })

  return parts
}

// ── Resolve the effective mesh name (same logic as extractPartsFromScene) ──
function resolveMeshName(mesh) {
  let name = mesh.name?.trim()
  if (!name || /^(mesh|object|unnamed|default|\d+)$/i.test(name)) {
    name = mesh.parent?.name?.trim()
  }
  if (!name || /^(scene|root|group|object|mesh|\d+)$/i.test(name)) return null
  return name
}

// ── Clone all mesh materials once so we never mutate shared ones ──
function cloneMaterials(scene) {
  scene.traverse((child) => {
    if (child.isMesh && child.material && !child.userData.matReady) {
      child.material = child.material.clone()
      child.userData.matReady = true
    }
  })
}

// ── Apply / remove green emissive highlight — accepts string or string[] ──
function applyHighlight(scene, selected) {
  const names = Array.isArray(selected)
    ? new Set(selected.filter(Boolean))
    : selected ? new Set([selected]) : new Set()

  scene.traverse((child) => {
    if (!child.isMesh || !child.userData.matReady) return
    const mat = child.material
    if (!mat?.emissive) return
    const name = resolveMeshName(child)
    const isHit = name && names.has(name)
    mat.emissive.setHex(isHit ? 0x22c55e : 0x000000)
    mat.emissiveIntensity = isHit ? 0.9 : 0
  })
}

// ── Move two named parts toward each other by FACTOR of their separation ──
function computeApproach(scene, part1Name, part2Name) {
  if (!part1Name || !part2Name) return []

  const meshes1 = [], meshes2 = []
  scene.traverse((child) => {
    if (!child.isMesh) return
    const name = resolveMeshName(child)
    if (name === part1Name) meshes1.push(child)
    if (name === part2Name) meshes2.push(child)
  })
  if (!meshes1.length || !meshes2.length) return []

  const box1 = new Box3(), box2 = new Box3()
  meshes1.forEach(m => box1.expandByObject(m))
  meshes2.forEach(m => box2.expandByObject(m))

  const center1 = new Vector3(), center2 = new Vector3()
  box1.getCenter(center1)
  box2.getCenter(center2)

  const midpoint = new Vector3().addVectors(center1, center2).multiplyScalar(0.5)
  const FACTOR = 0.35

  const delta1 = new Vector3().subVectors(midpoint, center1).multiplyScalar(FACTOR)
  const delta2 = new Vector3().subVectors(midpoint, center2).multiplyScalar(FACTOR)

  const originals = []

  const moveGroup = (meshes, meshName, delta) => {
    const owners = new Set()
    meshes.forEach(m => {
      const owner = m.parent?.name?.trim() === meshName ? m.parent : m
      owners.add(owner)
    })
    owners.forEach(owner => {
      originals.push({ obj: owner, pos: owner.position.clone() })
      owner.position.add(delta)
    })
  }

  moveGroup(meshes1, part1Name, delta1)
  moveGroup(meshes2, part2Name, delta2)

  return originals
}

// ── Build explosion items: one {obj, orig, tgt} per moveable owner ──
function buildExplosionItems(root) {
  const partMap = new Map() // resolvedName → Set<owner>

  root.traverse(child => {
    if (!child.isMesh) return
    const name = resolveMeshName(child)
    if (!name) return
    const owner = (
      child.parent &&
      child.parent !== root &&
      child.parent.name?.trim() &&
      !/^(scene|root|RootNode|AuxScene|Armature)$/i.test(child.parent.name)
    ) ? child.parent : child

    if (!partMap.has(name)) partMap.set(name, new Set())
    partMap.get(name).add(owner)
  })

  if (partMap.size <= 1) return []

  const sceneBbox = new Box3()
  root.traverse(c => { if (c.isMesh) sceneBbox.expandByObject(c) })
  if (sceneBbox.isEmpty()) return []

  const sceneCenter = new Vector3()
  sceneBbox.getCenter(sceneCenter)
  const diag = sceneBbox.min.distanceTo(sceneBbox.max)
  const explodeDist = Math.max(diag * 0.42, 0.5)

  const items = []
  const seenUUIDs = new Set()

  for (const [, owners] of partMap) {
    const partBbox = new Box3()
    owners.forEach(o => partBbox.expandByObject(o))
    const partCenter = new Vector3()
    partBbox.getCenter(partCenter)

    const dir = new Vector3().subVectors(partCenter, sceneCenter)
    if (dir.length() < 0.001) dir.set(0, 1, 0)
    dir.normalize()

    const offset = dir.clone().multiplyScalar(explodeDist)

    owners.forEach(owner => {
      if (seenUUIDs.has(owner.uuid)) return
      seenUUIDs.add(owner.uuid)
      const orig = owner.position.clone()
      items.push({ obj: owner, orig, tgt: orig.clone().add(offset) })
    })
  }

  return items
}

// ── Click handler: fire the effective mesh name upward ──
function handleMeshPointer(e, onMeshClick) {
  e.stopPropagation()
  const name = resolveMeshName(e.object)
  if (name) onMeshClick?.(name)
}

// ── GLB/GLTF model ──────────────────────────────────────────────
function GLTFModel({ url, onPartsDetected, selectedMeshName, onMeshClick, approachParts, exploded }) {
  const { scene } = useGLTF(url)
  const reported    = useRef(false)
  const approachRef = useRef([])
  const explodeItemsRef  = useRef([])
  const explodeProgressRef = useRef(0)

  useEffect(() => {
    if (!reported.current && scene && onPartsDetected) {
      reported.current = true
      onPartsDetected(extractPartsFromScene(scene))
    }
  }, [scene, onPartsDetected])

  useEffect(() => { if (scene) cloneMaterials(scene) }, [scene])
  useEffect(() => { if (scene) applyHighlight(scene, selectedMeshName) }, [scene, selectedMeshName])

  // Record explosion targets once on load
  useEffect(() => {
    if (!scene) return
    explodeItemsRef.current = buildExplosionItems(scene)
    explodeProgressRef.current = 0
  }, [scene])

  // Approach — disabled while exploded
  useEffect(() => {
    if (!scene) return
    approachRef.current.forEach(({ obj, pos }) => obj.position.copy(pos))
    approachRef.current = []
    if (!exploded && approachParts?.part1 && approachParts?.part2) {
      approachRef.current = computeApproach(scene, approachParts.part1, approachParts.part2)
    }
    return () => {
      approachRef.current.forEach(({ obj, pos }) => obj.position.copy(pos))
      approachRef.current = []
    }
  }, [scene, approachParts?.part1, approachParts?.part2, exploded])

  // Smooth explosion animation
  useFrame((_, delta) => {
    if (explodeItemsRef.current.length === 0) return
    const target = exploded ? 1 : 0
    explodeProgressRef.current += (target - explodeProgressRef.current) * Math.min(delta * 4.5, 1)
    const p = explodeProgressRef.current
    for (const { obj, orig, tgt } of explodeItemsRef.current) {
      obj.position.lerpVectors(orig, tgt, p)
    }
  })

  return (
    <primitive
      object={scene}
      onClick={e => handleMeshPointer(e, onMeshClick)}
    />
  )
}

// ── OBJ model ────────────────────────────────────────────────────
function OBJModel({ url, onPartsDetected, selectedMeshName, onMeshClick, approachParts, exploded }) {
  const obj = useLoader(OBJLoader, url)
  const reported    = useRef(false)
  const approachRef = useRef([])
  const explodeItemsRef  = useRef([])
  const explodeProgressRef = useRef(0)

  useEffect(() => {
    if (!reported.current && obj && onPartsDetected) {
      reported.current = true
      onPartsDetected(extractPartsFromScene(obj))
    }
  }, [obj, onPartsDetected])

  useEffect(() => { if (obj) cloneMaterials(obj) }, [obj])
  useEffect(() => { if (obj) applyHighlight(obj, selectedMeshName) }, [obj, selectedMeshName])

  useEffect(() => {
    if (!obj) return
    explodeItemsRef.current = buildExplosionItems(obj)
    explodeProgressRef.current = 0
  }, [obj])

  useEffect(() => {
    if (!obj) return
    approachRef.current.forEach(({ obj: o, pos }) => o.position.copy(pos))
    approachRef.current = []
    if (!exploded && approachParts?.part1 && approachParts?.part2) {
      approachRef.current = computeApproach(obj, approachParts.part1, approachParts.part2)
    }
    return () => {
      approachRef.current.forEach(({ obj: o, pos }) => o.position.copy(pos))
      approachRef.current = []
    }
  }, [obj, approachParts?.part1, approachParts?.part2, exploded])

  useFrame((_, delta) => {
    if (explodeItemsRef.current.length === 0) return
    const target = exploded ? 1 : 0
    explodeProgressRef.current += (target - explodeProgressRef.current) * Math.min(delta * 4.5, 1)
    const p = explodeProgressRef.current
    for (const { obj: o, orig, tgt } of explodeItemsRef.current) {
      o.position.lerpVectors(orig, tgt, p)
    }
  })

  return (
    <primitive
      object={obj}
      onClick={e => handleMeshPointer(e, onMeshClick)}
    />
  )
}

// ── STL model ────────────────────────────────────────────────────
function STLModel({ url, onPartsDetected }) {
  const geo = useLoader(STLLoader, url)
  const reported = useRef(false)

  useEffect(() => {
    if (!reported.current && onPartsDetected) {
      reported.current = true
      onPartsDetected([])
    }
  }, [geo, onPartsDetected])

  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color="#4fc3f7" roughness={0.4} metalness={0.2} />
    </mesh>
  )
}

function ModelSwitch({ url, type, onPartsDetected, selectedMeshName, onMeshClick, approachParts, exploded }) {
  if (type === 'glb' || type === 'gltf') return <GLTFModel url={url} onPartsDetected={onPartsDetected} selectedMeshName={selectedMeshName} onMeshClick={onMeshClick} approachParts={approachParts} exploded={exploded} />
  if (type === 'obj')  return <OBJModel  url={url} onPartsDetected={onPartsDetected} selectedMeshName={selectedMeshName} onMeshClick={onMeshClick} approachParts={approachParts} exploded={exploded} />
  if (type === 'stl')  return <STLModel  url={url} onPartsDetected={onPartsDetected} />
  return null
}

// ── Placeholder when no model is loaded ──────────────────────────
function PlaceholderModel() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.4, 1, 0.8]} />
        <meshStandardMaterial color="#1c2130" roughness={0.3} metalness={0.3} wireframe />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.2, 32]} />
        <meshStandardMaterial color="#22c55e" roughness={0.5} opacity={0.4} transparent />
      </mesh>
      <mesh position={[0.6, 0.5, 0]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#22c55e" roughness={0.4} opacity={0.3} transparent />
      </mesh>
    </group>
  )
}

// ── Isometric home reset — lives inside Canvas to access useThree ──
function CameraHome({ resetRef }) {
  const { camera, controls } = useThree()
  useEffect(() => {
    resetRef.current = () => {
      camera.position.set(5, 5, 5)
      camera.updateProjectionMatrix()
      if (controls) {
        controls.target.set(0, 0, 0)
        controls.update()
      }
    }
  }, [camera, controls])
  return null
}

function ModelLoader() {
  return (
    <mesh>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshStandardMaterial color="#22c55e" wireframe />
    </mesh>
  )
}

// ── Explode toggle icon ──────────────────────────────────────────
function ExplodeIcon({ active }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Center dot */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
      {/* 4 diagonal arrows pointing outward */}
      <line x1="12" y1="12" x2="5"  y2="5"/>
      <polyline points="3,3 5,3 5,5"/>
      <line x1="12" y1="12" x2="19" y2="5"/>
      <polyline points="21,3 19,3 19,5"/>
      <line x1="12" y1="12" x2="5"  y2="19"/>
      <polyline points="3,21 5,21 5,19"/>
      <line x1="12" y1="12" x2="19" y2="19"/>
      <polyline points="21,21 19,21 19,19"/>
    </svg>
  )
}

// ── Main exported viewer ─────────────────────────────────────────
export default function ModelViewer({
  modelUrl, modelType, height = '100%',
  onPartsDetected, selectedMeshName, onMeshClick, approachParts,
}) {
  const resetRef   = useRef(null)
  const [exploded, setExploded] = useState(false)

  const btnBase = {
    position: 'absolute', right: 14,
    width: 28, height: 28,
    background: 'rgba(10,13,18,0.85)',
    border: '1px solid #1e2535',
    borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s, background 0.15s',
    padding: 0,
  }

  return (
    <div style={{ width: '100%', height, background: '#0a0d12', overflow: 'hidden', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [4, 3, 5], fov: 45 }}
        gl={{ antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-4, 2, -3]} intensity={0.3} color="#4fc3f7" />
        <pointLight position={[0, 5, 0]} intensity={0.4} color="#22c55e" />

        <Environment preset="city" />

        <Bounds fit clip observe margin={1.3}>
          <Center>
            <Suspense fallback={<ModelLoader />}>
              {modelUrl
                ? <ModelSwitch url={modelUrl} type={modelType} onPartsDetected={onPartsDetected} selectedMeshName={selectedMeshName} onMeshClick={onMeshClick} approachParts={approachParts} exploded={exploded} />
                : <PlaceholderModel />
              }
            </Suspense>
          </Center>
        </Bounds>

        <Grid
          position={[0, -1.5, 0]}
          args={[30, 30]}
          cellSize={0.5}
          cellThickness={0.4}
          cellColor="#1a2030"
          sectionSize={2}
          sectionThickness={0.8}
          sectionColor="#222c40"
          fadeDistance={15}
          fadeStrength={1}
          infiniteGrid
        />

        <GizmoHelper alignment="top-right" margin={[80, 80]}>
          <GizmoViewport
            axisColors={['#ef4444', '#22c55e', '#4fc3f7']}
            labelColor="#f0f2f5"
          />
        </GizmoHelper>

        <CameraHome resetRef={resetRef} />
        <OrbitControls enablePan enableZoom enableRotate minDistance={0.5} maxDistance={25} makeDefault />
      </Canvas>

      {/* Home / isometric reset button */}
      <button
        onClick={() => resetRef.current?.()}
        title="Reset to isometric view"
        style={{ ...btnBase, top: 170, color: '#8b95a9' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#22c55e'; e.currentTarget.style.borderColor = '#22c55e' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#8b95a9'; e.currentTarget.style.borderColor = '#1e2535' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
          <polyline points="9 21 9 12 15 12 15 21"/>
        </svg>
      </button>

      {/* Exploded view toggle — only when a multi-part model is loaded */}
      {modelUrl && (
        <button
          onClick={() => setExploded(v => !v)}
          title={exploded ? 'Collapse exploded view' : 'Exploded view'}
          style={{
            ...btnBase,
            bottom: 36,
            color: exploded ? '#22c55e' : '#8b95a9',
            borderColor: exploded ? '#22c55e' : '#1e2535',
            background: exploded ? 'rgba(34,197,94,0.12)' : 'rgba(10,13,18,0.85)',
          }}
          onMouseEnter={e => {
            if (!exploded) {
              e.currentTarget.style.color = '#22c55e'
              e.currentTarget.style.borderColor = '#22c55e'
            }
          }}
          onMouseLeave={e => {
            if (!exploded) {
              e.currentTarget.style.color = '#8b95a9'
              e.currentTarget.style.borderColor = '#1e2535'
            }
          }}
        >
          <ExplodeIcon active={exploded} />
        </button>
      )}

      {/* Control hints */}
      <div style={{
        position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 8, pointerEvents: 'none',
      }}>
        {['Orbit: Drag', 'Zoom: Scroll', 'Pan: Right-drag'].map(h => (
          <span key={h} style={{
            background: 'rgba(10,13,18,0.8)', color: '#4b5568',
            fontSize: 10, fontFamily: 'var(--font)',
            padding: '3px 8px', borderRadius: 4,
            border: '1px solid #1e2535',
          }}>{h}</span>
        ))}
      </div>
    </div>
  )
}
