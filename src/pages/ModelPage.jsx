import React, { useState, useCallback, useRef } from 'react'
import { useStore } from '../hooks/useStore.js'
import ModelViewer from '../components/ModelViewer.jsx'
import './ModelPage.css'

// ── Level colours ─────────────────────────────────────────────────
const LEVEL_COLORS = ['#4caf50','#4fc3f7','#ffb74d','#f06292','#ba68c8','#4db6ac','#ff8a65','#dce775']
const lc = (l) => LEVEL_COLORS[(l || 0) % LEVEL_COLORS.length]

// ── Flatten entire tree to a list (for level-filter dropdown) ─────
function flattenTree(node, out = []) {
  out.push(node)
  for (const c of (node.children || [])) flattenTree(c, out)
  return out
}

// ── Collect all distinct levels in the tree ───────────────────────
function collectLevels(node, out = new Set()) {
  out.add(node.level || 0)
  for (const c of (node.children || [])) collectLevels(c, out)
  return out
}

// ── Count assemblies and parts in tree ───────────────────────────
function countTree(node) {
  let asm = 0, parts = 0
  const walk = (n) => {
    if (n.type === 'assembly') asm++; else parts++
    for (const c of (n.children || [])) walk(c)
  }
  walk(node)
  return { asm: asm - 1, parts } // exclude root from asm count
}

// ── Build breadcrumb path to a node ───────────────────────────────
function buildPath(root, targetId, path = []) {
  path.push(root)
  if (root.id === targetId) return [...path]
  for (const c of (root.children || [])) {
    const result = buildPath(c, targetId, path)
    if (result) return result
  }
  path.pop()
  return null
}

// ── Icons ─────────────────────────────────────────────────────────
const IcoAssembly = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="9" height="9" rx="1.5"/><rect x="13" y="2" width="9" height="9" rx="1.5"/>
    <rect x="13" y="13" width="9" height="9" rx="1.5"/><rect x="2" y="13" width="9" height="9" rx="1.5"/>
  </svg>
)
const IcoPart = ({ color, size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="8" fill={color || '#888'} opacity="0.9"/>
    <circle cx="12" cy="12" r="4" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
  </svg>
)
const IcoChevron = ({ open }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const IcoEdit   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoTrash  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
const IcoPlus   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoDrag   = () => <svg width="10" height="14" viewBox="0 0 10 16" fill="currentColor" opacity="0.4"><circle cx="3" cy="3" r="1.5"/><circle cx="7" cy="3" r="1.5"/><circle cx="3" cy="8" r="1.5"/><circle cx="7" cy="8" r="1.5"/><circle cx="3" cy="13" r="1.5"/><circle cx="7" cy="13" r="1.5"/></svg>

// ── Inline edit ───────────────────────────────────────────────────
function InlineEdit({ value, onSave, onCancel }) {
  const [v, setV] = useState(value)
  return (
    <input className="mp-inline-edit" value={v} autoFocus
      onChange={e => setV(e.target.value)}
      onBlur={() => v.trim() ? onSave(v.trim()) : onCancel()}
      onKeyDown={e => {
        if (e.key === 'Enter')  v.trim() ? onSave(v.trim()) : onCancel()
        if (e.key === 'Escape') onCancel()
      }}
    />
  )
}

// ── Add-child inline row ──────────────────────────────────────────
function AddRow({ placeholder, onAdd, onCancel }) {
  const [v, setV] = useState('')
  const go = () => v.trim() && (onAdd(v.trim()), onCancel())
  return (
    <div className="mp-add-row">
      <input className="mp-add-input" placeholder={placeholder} value={v} autoFocus
        onChange={e => setV(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') go(); if (e.key === 'Escape') onCancel() }}
      />
      <button className="mp-add-ok" onClick={go}>Add</button>
      <button className="mp-add-x"  onClick={onCancel}>✕</button>
    </div>
  )
}

// ── Single tree row ───────────────────────────────────────────────
function TreeRow({
  node, selectedId, onSelect,
  onRename, onDelete, onAddPart, onAddAssembly,
  onDragStart, onDragOver, onDrop,
  filterLevel, partColorMap,
}) {
  const [expanded, setExpanded] = useState(true)
  const [editing,  setEditing]  = useState(false)
  const [addMode,  setAddMode]  = useState(null) // 'part' | 'asm'
  const [dragOver, setDragOver] = useState(false)

  const isAsm      = node.type === 'assembly'
  const isSelected = node.id === selectedId
  const color      = lc(node.level || 0)
  const partColor  = partColorMap[node.id] || '#888'

  // Apply level filter — hide children if filterLevel is set and node.level > filterLevel
  const showChildren = expanded && (filterLevel === null || (node.level || 0) < filterLevel)
  const hasChildren  = (node.children || []).length > 0

  return (
    <div className="mp-tree-node">
      {/* ── Row ── */}
      <div
        className={`mp-row ${isSelected ? 'selected' : ''} ${dragOver ? 'drag-over' : ''} ${isAsm ? 'row-asm' : 'row-part'}`}
        style={{ '--lc': color, paddingLeft: `${(node.level || 0) * 18 + 8}px` }}
        onClick={() => onSelect(node)}
        draggable
        onDragStart={e => { e.stopPropagation(); onDragStart(node.id) }}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); e.stopPropagation(); setDragOver(false); onDrop(node.id) }}
      >
        {/* Drag handle */}
        <span className="mp-drag-handle"><IcoDrag /></span>

        {/* Chevron */}
        {isAsm
          ? <button className="mp-chevron" onClick={e => { e.stopPropagation(); setExpanded(x => !x) }}
              style={{ visibility: (hasChildren || addMode) ? 'visible' : 'hidden' }}>
              <IcoChevron open={expanded} />
            </button>
          : <span className="mp-chevron-space" />
        }

        {/* Icon */}
        <span className="mp-node-icon" style={{ color }}>
          {isAsm ? <IcoAssembly /> : <IcoPart color={partColor} />}
        </span>

        {/* Name */}
        {editing
          ? <InlineEdit value={node.name}
              onSave={n => { onRename(node.id, n); setEditing(false) }}
              onCancel={() => setEditing(false)} />
          : <span className={`mp-node-name ${isSelected ? 'sel' : ''}`}>{node.name}</span>
        }

        {/* Level badge */}
        <span className="mp-level-badge" style={{ background: color + '22', color }}>
          L{node.level || 0}
        </span>

        {/* Hover actions */}
        <div className="mp-row-actions">
          {isAsm && <>
            <button className="mp-act green" title="Add Part"
              onClick={e => { e.stopPropagation(); setAddMode('part'); setExpanded(true) }}>
              <IcoPlus /><span>Part</span>
            </button>
            <button className="mp-act blue" title="Add Sub-Assembly"
              onClick={e => { e.stopPropagation(); setAddMode('asm'); setExpanded(true) }}>
              <IcoPlus /><span>Asm</span>
            </button>
          </>}
          <button className="mp-act ghost" title="Rename"
            onClick={e => { e.stopPropagation(); setEditing(true) }}>
            <IcoEdit />
          </button>
          {node.level > 0 &&
            <button className="mp-act danger" title="Delete"
              onClick={e => { e.stopPropagation(); onDelete(node.id) }}>
              <IcoTrash />
            </button>
          }
        </div>
      </div>

      {/* ── Children ── */}
      {isAsm && (showChildren || addMode) && (
        <div className="mp-children">
          {(node.children || []).map(child => (
            <TreeRow key={child.id} node={child}
              selectedId={selectedId} onSelect={onSelect}
              onRename={onRename} onDelete={onDelete}
              onAddPart={onAddPart} onAddAssembly={onAddAssembly}
              onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
              filterLevel={filterLevel} partColorMap={partColorMap}
            />
          ))}
          {addMode === 'part' &&
            <div style={{ paddingLeft: `${((node.level || 0) + 1) * 18 + 8}px` }}>
              <AddRow placeholder="Part name, e.g. Body Shell"
                onAdd={n => onAddPart(node.id, n)} onCancel={() => setAddMode(null)} />
            </div>
          }
          {addMode === 'asm' &&
            <div style={{ paddingLeft: `${((node.level || 0) + 1) * 18 + 8}px` }}>
              <AddRow placeholder="Sub-assembly name, e.g. Shell + Neck"
                onAdd={n => onAddAssembly(node.id, n)} onCancel={() => setAddMode(null)} />
            </div>
          }
        </div>
      )}
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────
function DetailPanel({ node, onRename, onSetMaterial, onSetLevel, onSetType }) {
  const [editingName, setEditingName] = useState(false)
  const [matVal,      setMatVal]      = useState(node?.material || '')
  const [levelVal,    setLevelVal]    = useState(String(node?.level ?? 0))

  if (!node) return (
    <div className="mp-detail-empty">
      <IcoAssembly size={28} />
      <p>Select a part or assembly to view details</p>
    </div>
  )

  const isAsm  = node.type === 'assembly'
  const isRoot = (node.level || 0) === 0
  const color  = lc(node.level || 0)

  return (
    <div className="mp-detail">
      <div className="mp-detail-type">{isAsm ? (isRoot ? 'ASSEMBLY' : 'SUB-ASSEMBLY') : 'PART'}</div>
      <div className="mp-detail-name-row">
        {editingName
          ? <InlineEdit value={node.name}
              onSave={n => { onRename(node.id, n); setEditingName(false) }}
              onCancel={() => setEditingName(false)} />
          : <>
              <h3 className="mp-detail-name">{node.name}</h3>
              <button className="mp-act ghost" onClick={() => setEditingName(true)} title="Rename">
                <IcoEdit />
              </button>
            </>
        }
      </div>
      <div className="mp-detail-grid">
        <div className="mp-detail-row">
          <span className="mp-detail-key">ID</span>
          <span className="mp-detail-val code">{node.id.replace('id_','').padStart(4,'0')}</span>
        </div>
        <div className="mp-detail-row">
          <span className="mp-detail-key">LEVEL</span>
          <div className="mp-level-stepper">
            <button className="mp-level-btn"
              onClick={() => setLevelVal(String(Math.max(0, parseInt(levelVal || 0) - 1)))}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
            </button>
            <span className="mp-level-val">{levelVal}</span>
            <button className="mp-level-btn"
              onClick={() => setLevelVal(String(parseInt(levelVal || 0) + 1))}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="mp-detail-row">
          <span className="mp-detail-key">TYPE</span>
          {!isRoot ? (
            <select
              className="mp-detail-type-select"
              value={node.type}
              onChange={e => onSetType(node.id, e.target.value)}
            >
              <option value="part">Part</option>
              <option value="assembly">Sub-assembly</option>
            </select>
          ) : (
            <span className="mp-detail-val">Assembly</span>
          )}
        </div>
        {node.detected !== undefined && !isAsm && (
          <div className="mp-detail-row">
            <span className="mp-detail-key">SOURCE</span>
            <span className="mp-detail-val" style={{ color: node.detected ? '#4caf50' : '#ffb74d' }}>
              {node.detected ? 'Auto-detected' : 'Manual'}
            </span>
          </div>
        )}
        {isAsm && (
          <div className="mp-detail-row">
            <span className="mp-detail-key">CHILDREN</span>
            <span className="mp-detail-val">{(node.children || []).length}</span>
          </div>
        )}
        <div className="mp-detail-row">
          <span className="mp-detail-key">MATERIAL</span>
          <input
            className="mp-detail-mat-input"
            placeholder="e.g. Cast Iron A126-B"
            value={matVal}
            onChange={e => setMatVal(e.target.value)}
          />
        </div>
      </div>
      <button
        className="mp-detail-save-btn"
        onClick={() => { onSetLevel(node.id, levelVal); onSetMaterial(node.id, matVal) }}
      >
        Save Changes
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function ModelPage() {
  const {
    modelUrl, modelType, assemblyTree, parts,
    setPartsFromDetection, addAssembly, addPartToAssembly,
    renameNode, removeNode, moveNode, setNodeMaterial, setNodeLevel, setNodeType, setStep,
  } = useStore()

  const [detecting,    setDetecting]    = useState(!!modelUrl)
  const [selectedNode, setSelectedNode] = useState(null)
  const [filterLevel,  setFilterLevel]  = useState(null) // null = show all
  const [viewMode,     setViewMode]     = useState('Full Assembly')
  const [dragId,       setDragId]       = useState(null)

  const partColorMap = {}
  parts.forEach(p => { partColorMap[p.id] = p.color })

  // Sync selected node data when tree changes
  const selectedLive = selectedNode
    ? flattenTree(assemblyTree).find(n => n.id === selectedNode.id) || null
    : null

  const stats      = countTree(assemblyTree)
  const allLevels  = [...collectLevels(assemblyTree)].sort()
  const breadcrumb = selectedNode ? buildPath(assemblyTree, selectedNode.id) : null

  const handlePartsDetected = useCallback((meshInfos) => {
    setDetecting(false)
    if (meshInfos?.length > 0) setPartsFromDetection(meshInfos)
  }, [setPartsFromDetection])

  const handleSelect = (node) => setSelectedNode(node)

  // Click a mesh in the 3D viewer → select matching tree node
  const handleMeshClick = (meshName) => {
    const allNodes = flattenTree(assemblyTree)
    const node = allNodes.find(n => n.meshName === meshName)
    if (node) setSelectedNode(node)
  }

  // Drag handlers
  const handleDragStart = (id) => setDragId(id)
  const handleDrop = (targetId) => {
    if (dragId && dragId !== targetId) moveNode(dragId, targetId)
    setDragId(null)
  }

  // View mode options
  const viewOptions = ['Full Assembly', ...allLevels.map(l => `Level ${l} only`)]

  const effectiveFilter = viewMode.startsWith('Level ')
    ? parseInt(viewMode.replace('Level ', '').replace(' only', ''))
    : null

  return (
    <div className="mp-page">

      {/* ── LEFT: 3D viewer ── */}
      <div className="mp-viewer">
        {detecting && modelUrl ? (
          <div className="mp-detecting-overlay">
            <div className="mp-detecting-spin" />
            <p>Parsing 3D model…</p>
          </div>
        ) : null}
        <ModelViewer
          modelUrl={modelUrl} modelType={modelType}
          height="100%" onPartsDetected={handlePartsDetected}
          selectedMeshName={selectedLive?.meshName}
          onMeshClick={handleMeshClick}
        />
      </div>

      {/* ── CENTER: hierarchy panel ── */}
      <div className="mp-hierarchy">

        {/* Panel header */}
        <div className="mp-hier-header">
          <div className="mp-hier-title-row">
            <span className="mp-hier-label">ASSEMBLY HIERARCHY</span>
            <span className="mp-hier-stats">
              {stats.asm} asm · {stats.parts} part{stats.parts !== 1 ? 's' : ''}
            </span>
          </div>

          {/* VIEW dropdown */}
          <div className="mp-view-select-wrap">
            <span className="mp-view-label">VIEW</span>
            <select className="mp-view-select" value={viewMode}
              onChange={e => setViewMode(e.target.value)}>
              {viewOptions.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Breadcrumb */}
        {breadcrumb && breadcrumb.length > 1 && (
          <div className="mp-breadcrumb">
            {breadcrumb.map((n, i) => (
              <React.Fragment key={n.id}>
                {i > 0 && <span className="mp-bc-sep">›</span>}
                <button
                  className={`mp-bc-item ${i === breadcrumb.length - 1 ? 'active' : ''}`}
                  onClick={() => setSelectedNode(n)}
                  style={{ color: i === breadcrumb.length - 1 ? lc(n.level || 0) : undefined }}
                >
                  {n.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Tree */}
        <div className="mp-tree-scroll">
          {detecting && modelUrl ? (
            <div className="mp-no-parts">
              <div className="mp-spin" />
              <p>Detecting parts from model…</p>
            </div>
          ) : (
            <TreeRow
              node={assemblyTree}
              selectedId={selectedLive?.id}
              onSelect={handleSelect}
              onRename={renameNode}
              onDelete={removeNode}
              onAddPart={addPartToAssembly}
              onAddAssembly={addAssembly}
              onDragStart={handleDragStart}
              onDragOver={() => {}}
              onDrop={handleDrop}
              filterLevel={effectiveFilter}
              partColorMap={partColorMap}
            />
          )}
        </div>
      </div>

      {/* ── RIGHT: detail + nav ── */}
      <div className="mp-detail-panel">
        <DetailPanel
          key={selectedLive?.id}
          node={selectedLive}
          onRename={renameNode}
          onSetMaterial={setNodeMaterial}
          onSetLevel={setNodeLevel}
          onSetType={setNodeType}
        />

        <div className="mp-nav-footer">
          <button className="btn btn-green btn-nav" disabled={parts.length < 1}
            onClick={() => setStep('interfaces')}>
            Define Interfaces
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <button className="btn btn-dark btn-nav btn-nav-back" onClick={() => setStep('upload')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>
        </div>
      </div>
    </div>
  )
}
