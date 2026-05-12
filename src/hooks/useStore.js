import { create } from 'zustand'
import { DEFAULT_INTERFACE, DEFAULT_ERGONOMICS } from '../utils/scoring.js'
import { detectInterfaces, parseMeshName, displayNameFor } from '../utils/interfaceDetection.js'

let nextId = 1
const uid = () => `id_${nextId++}`

const PART_COLORS = [
  '#4fc3f7','#81c784','#ffb74d','#f06292',
  '#ba68c8','#4db6ac','#ff8a65','#a1a8b0',
  '#4dd0e1','#dce775','#aed581','#90a4ae',
]

// ── Flatten all leaf-part nodes from the assembly tree ────────────
function flattenParts(node, colors, out = [], colorIdx = { i: 0 }) {
  if (!node) return out
  if (node.type === 'part') {
    out.push({
      id:       node.id,
      name:     node.name,
      meshName: node.meshName || node.name,
      color:    colors[colorIdx.i++ % colors.length],
      detected: node.detected || false,
    })
  }
  for (const child of (node.children || [])) {
    flattenParts(child, colors, out, colorIdx)
  }
  return out
}

// ── Generate pair interfaces from a flat parts list ───────────────
function generateInterfacesForParts(parts) {
  const interfaces = []
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const p1 = parts[i], p2 = parts[j]
      interfaces.push({
        ...DEFAULT_INTERFACE,
        id: uid(),
        name: `${p1.name} → ${p2.name}`,
        part1: p1.id,
        part2: p2.id,
        ergonomics: { ...DEFAULT_ERGONOMICS },
      })
    }
  }
  return interfaces
}

// ── Deep-clone a tree node ────────────────────────────────────────
function cloneNode(n) {
  return { ...n, children: (n.children || []).map(cloneNode) }
}

// ── Find a node by id (returns reference in the cloned tree) ──────
function findNode(node, id) {
  if (node.id === id) return node
  for (const c of (node.children || [])) {
    const found = findNode(c, id)
    if (found) return found
  }
  return null
}

// ── Remove a node by id, returning true if removed ────────────────
function removeNodeFromTree(node, id) {
  node.children = (node.children || []).filter(c => c.id !== id)
  for (const c of node.children) removeNodeFromTree(c, id)
}

// ── Sync parts + interfaces from updated tree ─────────────────────
function syncFromTree(tree, existingInterfaces, existingParts) {
  const parts = flattenParts(tree, PART_COLORS)

  // Preserve any interface that still has both parts in the new tree
  const partSet = new Set(parts.map(p => p.id))
  const kept = existingInterfaces.filter(
    i => partSet.has(i.part1) && partSet.has(i.part2)
  )

  // Add new interfaces for newly-added pairs
  const existingPairs = new Set(kept.map(i => `${i.part1}__${i.part2}`))
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const key = `${parts[i].id}__${parts[j].id}`
      if (!existingPairs.has(key)) {
        kept.push({
          ...DEFAULT_INTERFACE,
          id: uid(),
          name: `${parts[i].name} → ${parts[j].name}`,
          part1: parts[i].id,
          part2: parts[j].id,
          ergonomics: { ...DEFAULT_ERGONOMICS },
        })
        existingPairs.add(key)
      }
    }
  }

  return { parts, interfaces: kept, activeInterfaceId: kept[0]?.id || null }
}

// ── Default blank root ─────────────────────────────────────────────
const blankTree = () => ({
  id:       uid(),
  name:     'Product Assembly',
  type:     'assembly',
  level:    0,
  children: [],
})

export const DEFAULT_COST_PARAMS = { fos: 1.5, occ: 0.015, lcc: 1.666667 }

export const useStore = create((set, get) => ({
  projectName:       'Untitled Product',
  step:              'upload',
  modelFile:         null,
  modelUrl:          null,
  modelType:         null,
  assemblyTree:      blankTree(),
  parts:             [],
  interfaces:        [],
  activeInterfaceId: null,
  fos:               DEFAULT_COST_PARAMS.fos,
  occ:               DEFAULT_COST_PARAMS.occ,
  lcc:               DEFAULT_COST_PARAMS.lcc,

  setProjectName: (name) => set({ projectName: name }),
  setStep:        (step) => set({ step }),
  setModel:       (file, url, type) => set({ modelFile: file, modelUrl: url, modelType: type }),
  clearModel:     () => set({ modelFile: null, modelUrl: null, modelType: null }),
  setFos:         (v) => set({ fos: v }),
  setOcc:         (v) => set({ occ: v }),
  setLcc:         (v) => set({ lcc: v }),

  // ── Called by ModelViewer when it detects named meshes ──────────
  // meshInfos: [{ name: string, bbox: { min, max } | null }]
  setPartsFromDetection: (meshInfos) => {
    const projectName = get().projectName || 'Product Assembly'

    // Compute base-name frequencies to decide clean display names
    const baseCount = {}
    for (const { name } of meshInfos) {
      const { baseName } = parseMeshName(name)
      baseCount[baseName] = (baseCount[baseName] || 0) + 1
    }

    const tree = {
      id:       uid(),
      name:     projectName,
      type:     'assembly',
      level:    0,
      children: meshInfos.map(({ name }) => ({
        id:       uid(),
        name:     displayNameFor(name, baseCount),
        meshName: name,
        type:     'part',
        level:    1,
        detected: true,
        children: [],
      })),
    }

    const parts = flattenParts(tree, PART_COLORS)

    // meshName → part id lookup
    const meshToId = {}
    for (const child of tree.children) meshToId[child.meshName] = child.id

    // Run smart detection
    const detected = detectInterfaces(meshInfos)
    let interfaces

    if (detected.length > 0) {
      interfaces = detected
        .map(({ part1Name, part2Name, jointToken, proximityConfirmed }) => {
          const p1Id = meshToId[part1Name]
          const p2Id = meshToId[part2Name]
          if (!p1Id || !p2Id) return null
          return {
            ...DEFAULT_INTERFACE,
            id:                 uid(),
            name:               jointToken,
            jointToken:         jointToken,
            fromModel:          true,
            proximityConfirmed: !!proximityConfirmed,
            part1:              p1Id,
            part2:              p2Id,
            ergonomics:         { ...DEFAULT_ERGONOMICS },
          }
        })
        .filter(Boolean)
    } else {
      // No joint tokens → fall back to all-pairs
      interfaces = []
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          interfaces.push({
            ...DEFAULT_INTERFACE,
            id:         uid(),
            name:       `${parts[i].name} → ${parts[j].name}`,
            jointToken: '',
            part1:      parts[i].id,
            part2:      parts[j].id,
            ergonomics: { ...DEFAULT_ERGONOMICS },
          })
        }
      }
    }

    set({ assemblyTree: tree, parts, interfaces, activeInterfaceId: interfaces[0]?.id || null })
  },

  // ── Rename the root assembly (synced with projectName) ──────────
  renameRootAssembly: (name) => set(s => {
    const tree = cloneNode(s.assemblyTree)
    tree.name = name
    return { assemblyTree: tree }
  }),

  // ── Add a child assembly under parentId ─────────────────────────
  addAssembly: (parentId, name = '') => set(s => {
    const tree = cloneNode(s.assemblyTree)
    const parent = findNode(tree, parentId)
    if (!parent) return {}
    const parentLevel = parent.level ?? 0
    parent.children = parent.children || []
    parent.children.push({
      id:       uid(),
      name:     name || `Sub-Assembly ${parent.children.filter(c => c.type === 'assembly').length + 1}`,
      type:     'assembly',
      level:    parentLevel + 1,
      children: [],
    })
    const synced = syncFromTree(tree, s.interfaces, s.parts)
    return { assemblyTree: tree, ...synced }
  }),

  // ── Add a part leaf under parentId ──────────────────────────────
  addPartToAssembly: (parentId, name = '') => set(s => {
    const tree = cloneNode(s.assemblyTree)
    const parent = findNode(tree, parentId)
    if (!parent) return {}
    const parentLevel = parent.level ?? 0
    parent.children = parent.children || []
    const partCount = flattenParts(tree, PART_COLORS).length
    parent.children.push({
      id:       uid(),
      name:     name || `Part ${partCount + 1}`,
      type:     'part',
      level:    parentLevel + 1,
      detected: false,
      children: [],
    })
    const synced = syncFromTree(tree, s.interfaces, s.parts)
    return { assemblyTree: tree, ...synced }
  }),

  // ── Rename any node ──────────────────────────────────────────────
  renameNode: (nodeId, newName) => set(s => {
    const tree = cloneNode(s.assemblyTree)
    const node = findNode(tree, nodeId)
    if (!node || !newName.trim()) return {}
    node.name = newName.trim()
    // Update interface names that reference this part
    const interfaces = s.interfaces.map(iface => {
      const p1 = s.parts.find(p => p.id === iface.part1)
      const p2 = s.parts.find(p => p.id === iface.part2)
      if ((iface.part1 === nodeId || iface.part2 === nodeId) && p1 && p2) {
        const n1 = iface.part1 === nodeId ? newName.trim() : p1.name
        const n2 = iface.part2 === nodeId ? newName.trim() : p2.name
        return { ...iface, name: `${n1} → ${n2}` }
      }
      return iface
    })
    const parts = s.parts.map(p => p.id === nodeId ? { ...p, name: newName.trim() } : p)
    return { assemblyTree: tree, parts, interfaces }
  }),

  // ── Remove any node (and its subtree) ───────────────────────────
  removeNode: (nodeId) => set(s => {
    if (nodeId === s.assemblyTree.id) return {} // can't delete root
    const tree = cloneNode(s.assemblyTree)
    removeNodeFromTree(tree, nodeId)
    const synced = syncFromTree(tree, s.interfaces, s.parts)
    return { assemblyTree: tree, ...synced }
  }),

  // ── Legacy helpers (used by InterfacesPage) ──────────────────────
  addPart: (name) => {
    get().addPartToAssembly(get().assemblyTree.id, name)
  },
  updatePart: (id, updates) => {
    if (updates.name) get().renameNode(id, updates.name)
  },
  removePart: (id) => get().removeNode(id),

  // ── Interfaces ───────────────────────────────────────────────────
  addInterface: (part1Id = '', part2Id = '') => {
    const state = get()
    const p1 = state.parts.find(p => p.id === part1Id)
    const p2 = state.parts.find(p => p.id === part2Id)
    const id = uid()
    const name = p1 && p2 ? `${p1.name} → ${p2.name}` : `Interface ${state.interfaces.length + 1}`
    set(s => ({
      interfaces: [...s.interfaces, {
        ...DEFAULT_INTERFACE,
        id, name,
        part1: part1Id, part2: part2Id,
        ergonomics: { ...DEFAULT_ERGONOMICS },
      }],
      activeInterfaceId: id,
    }))
    return id
  },

  updateInterface: (id, updates) => set(s => ({
    interfaces: s.interfaces.map(i => i.id === id ? { ...i, ...updates } : i)
  })),

  updateInterfaceErgonomics: (id, ergoUpdates) => set(s => ({
    interfaces: s.interfaces.map(i =>
      i.id === id ? { ...i, ergonomics: { ...i.ergonomics, ...ergoUpdates } } : i
    )
  })),

  removeInterface: (id) => set(s => {
    const interfaces = s.interfaces.filter(i => i.id !== id)
    return {
      interfaces,
      activeInterfaceId: s.activeInterfaceId === id ? (interfaces[0]?.id || null) : s.activeInterfaceId,
    }
  }),

  setActiveInterface: (id) => set({ activeInterfaceId: id }),


  // ── Move a node to a new parent (drag-and-drop) ──────────────────
  moveNode: (nodeId, targetParentId) => set(s => {
    if (nodeId === s.assemblyTree.id) return {}
    if (nodeId === targetParentId)    return {}
    const tree = cloneNode(s.assemblyTree)
    // find the node first
    const movingNode = findNode(tree, nodeId)
    if (!movingNode) return {}
    // make sure target isn't a descendant of movingNode
    if (findNode(movingNode, targetParentId)) return {}
    const targetParent = findNode(tree, targetParentId)
    if (!targetParent || targetParent.type !== 'assembly') return {}
    // remove from current parent
    removeNodeFromTree(tree, nodeId)
    // re-attach under new parent, update level recursively
    const reLevel = (n, lv) => { n.level = lv; (n.children||[]).forEach(c => reLevel(c, lv+1)) }
    reLevel(movingNode, (targetParent.level || 0) + 1)
    targetParent.children = targetParent.children || []
    targetParent.children.push(movingNode)
    const synced = syncFromTree(tree, s.interfaces, s.parts)
    return { assemblyTree: tree, ...synced }
  }),

  // ── Update material on a node ─────────────────────────────────────
  setNodeMaterial: (nodeId, material) => set(s => {
    const tree = cloneNode(s.assemblyTree)
    const node = findNode(tree, nodeId)
    if (!node) return {}
    node.material = material
    return { assemblyTree: tree }
  }),

  // ── Update type on a node ─────────────────────────────────────────
  setNodeType: (nodeId, type) => set(s => {
    if (nodeId === s.assemblyTree.id) return {}
    const tree = cloneNode(s.assemblyTree)
    const node = findNode(tree, nodeId)
    if (!node) return {}
    node.type = type
    if (type === 'assembly') node.children = node.children || []
    const synced = syncFromTree(tree, s.interfaces, s.parts)
    return { assemblyTree: tree, ...synced }
  }),

  // ── Update level on a node ────────────────────────────────────────
  setNodeLevel: (nodeId, level) => set(s => {
    const tree = cloneNode(s.assemblyTree)
    const node = findNode(tree, nodeId)
    if (!node) return {}
    node.level = Math.max(0, parseInt(level) || 0)
    return { assemblyTree: tree }
  }),

  reset: () => set({
    projectName: 'Untitled Product', step: 'upload',
    modelFile: null, modelUrl: null, modelType: null,
    assemblyTree: blankTree(), parts: [], interfaces: [], activeInterfaceId: null,
    ...DEFAULT_COST_PARAMS,
  }),
}))
