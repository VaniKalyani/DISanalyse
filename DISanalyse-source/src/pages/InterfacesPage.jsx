import React, { useState } from 'react'
import { useStore } from '../hooks/useStore.js'
import ModelViewer from '../components/ModelViewer.jsx'
import InterfaceForm from '../components/InterfaceForm.jsx'
import { calcDEI, classifyDEI } from '../utils/scoring.js'
import './InterfacesPage.css'
import './InterfacesPagePopup.css'
import Icon from '../components/Icon.jsx'

// Check whether an interface has all required sections filled
function isInterfaceComplete(iface) {
  const hasNature = !!iface.nature
  const hasDEI = iface.time && iface.tool && iface.fixture &&
    iface.access && iface.instruction && iface.hazard &&
    iface.forceType && iface.force
  const ergo = iface.ergonomics || {}
  const hasErgo = ergo.effort && ergo.disassemblyForce && ergo.grasping &&
    ergo.weight && ergo.symmetry && ergo.forceExertion &&
    ergo.torqueExertion && ergo.visibility && ergo.accessibility &&
    ergo.accuracy && ergo.posture
  return { hasNature, hasDEI, hasErgo, complete: !!(hasNature && hasDEI && hasErgo) }
}

export default function InterfacesPage() {
  const { modelUrl, modelType, parts, interfaces, activeInterfaceId,
    setActiveInterface, addInterface, updateInterface, removeInterface, setStep } = useStore()

  const [addPart1, setAddPart1] = useState('')
  const [addPart2, setAddPart2] = useState('')
  const [addName,  setAddName]  = useState('')
  const [addReps,  setAddReps]  = useState(1)

  // Popup state
  const [showPopup, setShowPopup] = useState(false)
  const [incompleteList, setIncompleteList] = useState([])

  const getPartName = (id) => parts.find(p => p.id === id)?.name || '—'

  const hasModelInterfaces = interfaces.some(i => i.fromModel)
  const displayedInterfaces = hasModelInterfaces ? interfaces.filter(i => i.fromModel) : interfaces

  const handleAddInterface = () => {
    const id = addInterface(addPart1, addPart2)
    if (addReps > 1) updateInterface(id, { repetitions: addReps })
    setAddPart1(''); setAddPart2(''); setAddName(''); setAddReps(1)
  }

  const handleViewAnalysis = () => {
    const incomplete = displayedInterfaces.filter(i => !isInterfaceComplete(i).complete)
    if (incomplete.length > 0) {
      setIncompleteList(incomplete)
      setShowPopup(true)
    } else {
      setStep('visualize')
    }
  }

  const activeIface = interfaces.find(i => i.id === activeInterfaceId)

  // Highlighted meshes and approach config for the active interface
  const activePart1 = parts.find(p => p.id === activeIface?.part1)
  const activePart2 = parts.find(p => p.id === activeIface?.part2)
  const highlightedMeshNames = [activePart1?.meshName, activePart2?.meshName].filter(Boolean)
  const approachParts = (activePart1?.meshName && activePart2?.meshName)
    ? { part1: activePart1.meshName, part2: activePart2.meshName }
    : null

  // Click a mesh in the 3D viewer → select the first interface involving that part
  const handleMeshClick = (meshName) => {
    const part = parts.find(p => p.meshName === meshName)
    if (!part) return
    const iface = displayedInterfaces.find(i => i.part1 === part.id || i.part2 === part.id)
    if (iface) setActiveInterface(iface.id)
  }

  return (
    <div className="ifaces-page">

      {/* ── Confirmation Popup ──────────────────────── */}
      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-modal" onClick={e => e.stopPropagation()}>
            <div className="popup-icon">
              <Icon name="info" size={28} />
            </div>
            <h3 className="popup-title">Incomplete Interface Inputs</h3>
            <p className="popup-desc">
              Kindly check if you have given inputs for all the interfaces.<br/>
              The following {incompleteList.length === 1 ? 'interface is' : 'interfaces are'} missing required fields:
            </p>
            <ul className="popup-incomplete-list">
              {incompleteList.map(i => {
                const status = isInterfaceComplete(i)
                return (
                  <li key={i.id}>
                    <span className="popup-iface-name">{i.name || `${getPartName(i.part1)} → ${getPartName(i.part2)}`}</span>
                    <span className="popup-missing-tags">
                      {!status.hasNature && <span className="missing-tag">Nature</span>}
                      {!status.hasDEI   && <span className="missing-tag">DEI Inputs</span>}
                      {!status.hasErgo  && <span className="missing-tag">User Effort & Handling</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
            <div className="popup-actions">
              <button className="popup-btn popup-btn-secondary" onClick={() => setShowPopup(false)}>
                Go Back &amp; Complete
              </button>
              <button className="popup-btn popup-btn-primary" onClick={() => { setShowPopup(false); setStep('visualize') }}>
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LEFT: Add + auto-generated list ──────────── */}
      <div className="ifaces-left">
        <div className="add-iface-panel">
          <h3 className="add-iface-title">Add Interface</h3>
          <div className="add-iface-field">
            <label>Interface Name</label>
            <input type="text" placeholder="e.g., Snap fit"
              value={addName} onChange={e => setAddName(e.target.value)} />
          </div>
          <div className="add-iface-parts-row">
            <div className="add-iface-field">
              <label>Part 1</label>
              <select value={addPart1} onChange={e => setAddPart1(e.target.value)}>
                <option value="" disabled>Select</option>
                {parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="add-iface-field">
              <label>Part 2</label>
              <select value={addPart2} onChange={e => setAddPart2(e.target.value)}>
                <option value="" disabled>Select</option>
                {parts.filter(p => p.id !== addPart1).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="add-iface-reps-row">
            <label>Repetitions</label>
            <div className="reps-stepper">
              <button className="reps-btn" onClick={() => setAddReps(r => Math.max(1, r - 1))}>−</button>
              <span className="reps-display">{addReps}</span>
              <button className="reps-btn" onClick={() => setAddReps(r => r + 1)}>+</button>
            </div>
          </div>
          <button className="btn btn-green" style={{marginTop:4}} onClick={handleAddInterface}>
            Add to list
          </button>
        </div>

        <div className="divider" />

        {/* Interface list */}
        <div className="ifaces-list-section">
          <p className="section-label" style={{padding:'8px 14px 4px'}}>
            LIST OF INTERFACES
            {displayedInterfaces.length > 0 && <span className="iface-count-badge">{displayedInterfaces.length}</span>}
          </p>
          {hasModelInterfaces && (
            <p className="ifaces-model-note">
              Showing interfaces detected from your model. Add more above if needed.
            </p>
          )}
          <div className="ifaces-list">
            {displayedInterfaces.length === 0 ? (
              <p className="ifaces-empty">
                {parts.length >= 2
                  ? 'No interfaces yet.'
                  : 'Add at least 2 parts in the Model step.'}
              </p>
            ) : (
              displayedInterfaces.map((iface, i) => {
                const dei = calcDEI(iface)
                const cl  = classifyDEI(dei.totalDEI)
                const isActive = iface.id === activeInterfaceId
                const complete = isInterfaceComplete(iface).complete
                return (
                  <div key={iface.id}
                    className={`iface-list-row ${isActive ? 'active' : ''} animate-slide-in`}
                    style={{animationDelay:`${i*0.03}s`}}
                    onClick={() => setActiveInterface(iface.id)}>
                    <div className="iface-list-info">
                      <span className="iface-list-joint">
                        {iface.jointToken || `${getPartName(iface.part1)} → ${getPartName(iface.part2)}`}
                      </span>
                      {iface.jointToken && (
                        <span className="iface-list-parts">
                          {getPartName(iface.part1)} → {getPartName(iface.part2)}
                        </span>
                      )}
                      {!complete && (
                        <span className="iface-list-hint">
                          Add DEI &amp; User Handling details to finish
                        </span>
                      )}
                    </div>
                    {iface.jointToken && (
                      <span
                        className={`proximity-dot ${iface.proximityConfirmed ? 'confirmed' : 'unconfirmed'}`}
                        title={iface.proximityConfirmed ? 'Parts are spatially adjacent' : 'Parts may not be adjacent — verify'}
                      />
                    )}
                    <span className={`iface-complete-dot ${complete ? 'done' : 'pending'}`} title={complete ? 'Complete' : 'Incomplete'} />
                    <button className="iface-remove-btn"
                      onClick={e => { e.stopPropagation(); removeInterface(iface.id) }}>×</button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── CENTER: 3D Model ── */}
      <div className="ifaces-center">
        <ModelViewer
          modelUrl={modelUrl} modelType={modelType} height="100%"
          selectedMeshName={highlightedMeshNames}
          onMeshClick={handleMeshClick}
          approachParts={approachParts}
        />
      </div>

      {/* ── RIGHT: Interface Details ── */}
      <div className="ifaces-right">
        <div className="ifaces-right-header">
          <h3 className="ifaces-right-title">Interface Details</h3>
        </div>

        <div className="ifaces-right-scroll">
          {!activeIface ? (
            <div className="no-iface-selected">
              <Icon name="arrow_forward" size={32} />
              <p>Select an interface from the list to fill in details</p>
            </div>
          ) : (
            <InterfaceForm key={activeIface.id} interfaceId={activeIface.id} />
          )}
        </div>

        <div className="ifaces-right-footer">
          <button className="btn btn-green btn-nav" disabled={displayedInterfaces.length === 0}
            onClick={handleViewAnalysis}>
            View Analysis
            <Icon name="chevron_right" size={15} />
          </button>
          <button className="btn btn-dark btn-nav btn-nav-back" onClick={() => setStep('model')}>
            <Icon name="chevron_left" size={15} />
            Back
          </button>
        </div>
      </div>
    </div>
  )
}
