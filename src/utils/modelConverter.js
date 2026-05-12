/**
 * modelConverter.js
 *
 * Converts an OBJ file → GLB (in-browser, zero server needed) using
 * Three.js OBJLoader + GLTFExporter, and extracts named part meshes.
 *
 * STL is a single-mesh format with no part hierarchy — conversion is
 * technically possible but yields no part names, so we skip it.
 */

import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

// ── Shared name extractor (same logic as ModelViewer) ────────────
export function extractPartNamesFromObject(object) {
  const names = []
  const seen  = new Set()

  object.traverse((child) => {
    if (!child.isMesh) return

    let name = child.name?.trim()

    // Fall back to parent name if mesh itself has a generic/empty name
    if (!name || /^(mesh|object|unnamed|default|\d+)$/i.test(name)) {
      name = child.parent?.name?.trim()
    }

    // Discard top-level scene/group placeholders
    if (!name || /^(scene|root|group|object|mesh|\d+)$/i.test(name)) {
      name = null
    }

    if (name && !seen.has(name)) {
      seen.add(name)
      names.push(name)
    }
  })

  return names
}

// ── OBJ → GLB ────────────────────────────────────────────────────
/**
 * @param {File} file  — the .obj File object from the input
 * @param {(pct:number, msg:string)=>void} onProgress — progress callback
 * @returns {{ glbUrl: string, partNames: string[], partCount: number }}
 */
export async function convertObjToGlb(file, onProgress = () => {}) {

  onProgress(5, 'Reading OBJ file…')

  // 1. Read file text
  const text = await file.text()

  onProgress(25, 'Parsing OBJ scene graph…')

  // 2. Parse with OBJLoader (synchronous — works outside Canvas)
  const loader = new OBJLoader()
  const object = loader.parse(text)

  // 3. Pull part names before export (names survive the round-trip)
  const partNames = extractPartNamesFromObject(object)

  onProgress(55, `Found ${partNames.length} named part${partNames.length !== 1 ? 's' : ''}. Exporting to GLB…`)

  // 4. Ensure every mesh has a material so GLTFExporter doesn't drop it
  object.traverse((child) => {
    if (child.isMesh && !child.material) {
      child.material = new THREE.MeshStandardMaterial({ color: 0x888888 })
    }
    // MeshPhongMaterial from OBJLoader → convert to MeshStandardMaterial
    // so GLTF exporter emits valid PBR materials
    if (child.isMesh && child.material?.isMeshPhongMaterial) {
      const old = child.material
      child.material = new THREE.MeshStandardMaterial({
        color:     old.color,
        map:       old.map       || null,
        roughness: 0.6,
        metalness: 0.1,
      })
    }
  })

  onProgress(70, 'Encoding GLB binary…')

  // 5. Export to binary GLB
  const exporter = new GLTFExporter()
  const glbBuffer = await new Promise((resolve, reject) => {
    exporter.parse(
      object,
      (result) => resolve(result),
      (err)    => reject(err),
      { binary: true, forceIndices: true }
    )
  })

  onProgress(95, 'Finalising…')

  // 6. Wrap in a Blob URL the rest of the app can use as modelUrl
  const blob   = new Blob([glbBuffer], { type: 'model/gltf-binary' })
  const glbUrl = URL.createObjectURL(blob)

  onProgress(100, 'Done')

  return {
    glbUrl,
    partNames,
    partCount: partNames.length,
    originalName: file.name,
  }
}
