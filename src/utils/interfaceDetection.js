// ── Naming convention: partname_token1_token2_...
// e.g. "box_snap1_push2" → baseName="box", joints=["snap1","push2"]
// e.g. "lid_snap1"       → baseName="lid",  joints=["snap1"]
export function parseMeshName(rawName) {
  const idx = rawName.indexOf('_')
  if (idx === -1) return { baseName: rawName, joints: [] }
  return {
    baseName: rawName.slice(0, idx),
    joints:   rawName.slice(idx + 1).split('_').filter(Boolean),
  }
}

// Build a clean display name for a mesh, deduplicating same base names.
// baseCount map must be pre-computed before calling this.
export function displayNameFor(rawName, baseCount) {
  const { baseName } = parseMeshName(rawName)
  return baseCount[baseName] === 1 ? baseName : rawName
}

// Detect interfaces by matching joint tokens across mesh names.
// meshInfos: [{ name: string, bbox?: BboxData }]
// Returns:   [{ part1Name, part2Name, jointToken }]
export function detectNamedInterfaces(meshInfos) {
  const tokenMap = new Map() // jointToken → meshName[]
  for (const { name } of meshInfos) {
    for (const joint of parseMeshName(name).joints) {
      if (!tokenMap.has(joint)) tokenMap.set(joint, [])
      tokenMap.get(joint).push(name)
    }
  }

  const result = []
  const seen   = new Set()
  for (const [token, meshes] of tokenMap) {
    for (let i = 0; i < meshes.length; i++) {
      for (let j = i + 1; j < meshes.length; j++) {
        const key = [meshes[i], meshes[j]].sort().join('||')
        if (seen.has(key)) continue
        seen.add(key)
        result.push({ part1Name: meshes[i], part2Name: meshes[j], jointToken: token })
      }
    }
  }
  return result
}

// AABB gap distance — 0 when boxes touch or overlap
function bboxGap(a, b) {
  const dx = Math.max(0, Math.max(a.min.x - b.max.x, b.min.x - a.max.x))
  const dy = Math.max(0, Math.max(a.min.y - b.max.y, b.min.y - a.max.y))
  const dz = Math.max(0, Math.max(a.min.z - b.max.z, b.min.z - a.max.z))
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function bboxDiag(bbox) {
  const dx = bbox.max.x - bbox.min.x
  const dy = bbox.max.y - bbox.min.y
  const dz = bbox.max.z - bbox.min.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

// Returns a Set of sorted "nameA||nameB" keys for spatially adjacent pairs.
// threshold: max gap / avg-diagonal ratio to count as "close"
export function getProximityPairs(meshInfos, threshold = 0.15) {
  const withBox = meshInfos.filter(m => m.bbox)
  const close   = new Set()
  for (let i = 0; i < withBox.length; i++) {
    for (let j = i + 1; j < withBox.length; j++) {
      const a = withBox[i], b = withBox[j]
      const gap     = bboxGap(a.bbox, b.bbox)
      const avgDiag = (bboxDiag(a.bbox) + bboxDiag(b.bbox)) * 0.5
      if (avgDiag <= 0 || gap / avgDiag <= threshold) {
        close.add([a.name, b.name].sort().join('||'))
      }
    }
  }
  return close
}

// Full pipeline: name-based detection + proximity confirmation flag.
// Returns [] when no joint tokens present → caller should fall back to all-pairs.
export function detectInterfaces(meshInfos) {
  const named = detectNamedInterfaces(meshInfos)
  if (named.length === 0) return []

  const proxSet = getProximityPairs(meshInfos)
  return named.map(iface => ({
    ...iface,
    proximityConfirmed: proxSet.has([iface.part1Name, iface.part2Name].sort().join('||')),
  }))
}
