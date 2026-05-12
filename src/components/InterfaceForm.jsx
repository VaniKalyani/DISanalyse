import React, { useState } from 'react'
import { useStore } from '../hooks/useStore.js'
import {
  NATURE_OPTIONS, TIME_OPTIONS, TOOL_OPTIONS, FIXTURE_OPTIONS,
  ACCESS_OPTIONS, INSTRUCTION_OPTIONS, HAZARD_OPTIONS, FORCE_TYPE_OPTIONS,
  getForceOptions,
  TMU_EFFORT_OPTIONS, TMU_DISASSEMBLY_FORCE_OPTIONS, TMU_GRASPING_OPTIONS,
  TMU_WEIGHT_OPTIONS, TMU_SYMMETRY_OPTIONS, TMU_FORCE_EXERTION_OPTIONS,
  TMU_TORQUE_EXERTION_OPTIONS, TMU_VISIBILITY_OPTIONS, TMU_ACCESS_OPTIONS,
  TMU_ACCURACY_OPTIONS, TMU_POSTURE_OPTIONS,
  calcDEI, calcTMU, classifyDEI, OVERHEAD_COST_COEFF, LABOUR_COST_COEFF
} from '../utils/scoring.js'
import './InterfaceForm.css'

const Field = ({ label, value, onChange, options }) => (
  <div className="iform-field">
    <label>{label}</label>
    <select value={value || ''} onChange={e => onChange(e.target.value)}>
      <option value="" disabled>Select</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)

export default function InterfaceForm({ interfaceId }) {
  const { interfaces, parts, updateInterface, updateInterfaceErgonomics } = useStore()
  const [ergoOpen, setErgoOpen] = useState(false)
  const [natureOpen, setNatureOpen] = useState(true)
  const [deiOpen, setDeiOpen] = useState(true)
  const [saved, setSaved] = useState(false)

  const iface = interfaces.find(i => i.id === interfaceId)
  if (!iface) return null

  const upd  = (k, v) => { setSaved(false); updateInterface(interfaceId, { [k]: v }) }
  const updE = (k, v) => { setSaved(false); updateInterfaceErgonomics(interfaceId, { [k]: v }) }

  const dei   = calcDEI(iface)
  const tmu   = calcTMU(iface.ergonomics || {}, iface.repetitions)
  const deiCl = classifyDEI(dei.totalDEI)

  const dlc = tmu.adjustedTimeSec * LABOUR_COST_COEFF
  const doc = OVERHEAD_COST_COEFF
  const totalCost = dlc + doc

  return (
    <div className="iform">
      {/* ── Basic fields ── */}
      <div className="iform-section">
        <div className="iform-field">
          <label>Interface Name</label>
          <input
            type="text"
            value={iface.name}
            onChange={e => upd('name', e.target.value)}
            placeholder="e.g., Base-Cover Connection"
          />
        </div>
        <div className="iform-row-2">
          <div className="iform-field">
            <label>Part 1</label>
            <select value={iface.part1 || ''} onChange={e => upd('part1', e.target.value)}>
              <option value="" disabled>Select</option>
              {parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="iform-field">
            <label>Part 2</label>
            <select value={iface.part2 || ''} onChange={e => upd('part2', e.target.value)}>
              <option value="" disabled>Select</option>
              {parts.filter(p => p.id !== iface.part1).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="iform-field">
          <label>Repetitions</label>
          <div className="reps-row">
            <button className="reps-btn" onClick={() => upd('repetitions', Math.max(1, (iface.repetitions||1)-1))}>−</button>
            <input type="number" min="1" value={iface.repetitions||1}
              onChange={e => upd('repetitions', Math.max(1, parseInt(e.target.value)||1))}
              style={{ textAlign:'center' }} />
            <button className="reps-btn" onClick={() => upd('repetitions', (iface.repetitions||1)+1)}>+</button>
          </div>
        </div>
      </div>

      {/* ── Section 1: Nature ── */}
      <div className="iform-accordion">
        <button className="iform-accordion-hdr" onClick={() => setNatureOpen(!natureOpen)}>
          <div className="iform-section-num">1</div>
          <span>Nature of Disassembly</span>
          <svg className={`accordion-chevron ${natureOpen?'open':''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {natureOpen && (
          <div className="iform-accordion-body">
            <Field label="Select Type" value={iface.nature} onChange={v => upd('nature', v)} options={NATURE_OPTIONS} />
          </div>
        )}
      </div>

      {/* ── Section 2: DEI ── */}
      <div className="iform-accordion">
        <button className="iform-accordion-hdr" onClick={() => setDeiOpen(!deiOpen)}>
          <div className="iform-section-num">2</div>
          <span>DEI Parameters</span>
          <svg className={`accordion-chevron ${deiOpen?'open':''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {deiOpen && (
          <div className="iform-accordion-body">
            <Field label="Time"       value={iface.time}        onChange={v => upd('time', v)}        options={TIME_OPTIONS} />
            <Field label="Tool"       value={iface.tool}        onChange={v => upd('tool', v)}        options={TOOL_OPTIONS} />
            <Field label="Fixture"    value={iface.fixture}     onChange={v => upd('fixture', v)}     options={FIXTURE_OPTIONS} />
            <Field label="Access"     value={iface.access}      onChange={v => upd('access', v)}      options={ACCESS_OPTIONS} />
            <Field label="Training"   value={iface.instruction} onChange={v => upd('instruction', v)} options={INSTRUCTION_OPTIONS} />
            <Field label="Hazard"     value={iface.hazard}      onChange={v => upd('hazard', v)}      options={HAZARD_OPTIONS} />
            <Field label="Force Type" value={iface.forceType}   onChange={v => { upd('forceType', v); upd('force', '') }}  options={FORCE_TYPE_OPTIONS} />
            <Field label="Force"      value={iface.force}       onChange={v => upd('force', v)}       options={getForceOptions(iface.forceType)} />

            {/* DEI score card */}
            <div className={`dei-card ${deiCl.level.toLowerCase()}`}>
              <p className="dei-card-label">DEI per Interface</p>
              <p className="dei-card-value">{dei.totalDEI.toFixed(1)}</p>
              <span className="dei-card-badge">{deiCl.level} Effort</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: User Effort and Handling Metrics ── */}
      <div className="iform-accordion">
        <button className="iform-accordion-hdr" onClick={() => setErgoOpen(!ergoOpen)}>
          <div className="iform-section-num">3</div>
          <span>User Effort and Handling Metrics</span>
          <svg className={`accordion-chevron ${ergoOpen?'open':''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {ergoOpen && (
          <div className="iform-accordion-body">
            {/* Effort must come first — drives disassembly force score */}
            <Field label="Disassembly Effort" value={iface.ergonomics?.effort} onChange={v => updE('effort', v)} options={TMU_EFFORT_OPTIONS} />
            <Field label="Disassembly Force"  value={iface.ergonomics?.disassemblyForce} onChange={v => updE('disassemblyForce', v)} options={TMU_DISASSEMBLY_FORCE_OPTIONS} />
            <Field label="Grasping"           value={iface.ergonomics?.grasping}         onChange={v => updE('grasping', v)}         options={TMU_GRASPING_OPTIONS} />
            {/* Weight must come before symmetry — drives symmetry score */}
            <Field label="Weight"             value={iface.ergonomics?.weight}           onChange={v => updE('weight', v)}           options={TMU_WEIGHT_OPTIONS} />
            <Field label="Symmetry"           value={iface.ergonomics?.symmetry}         onChange={v => updE('symmetry', v)}         options={TMU_SYMMETRY_OPTIONS} />
            <Field label="Force Exertion"     value={iface.ergonomics?.forceExertion}    onChange={v => updE('forceExertion', v)}    options={TMU_FORCE_EXERTION_OPTIONS} />
            <Field label="Torque Exertion"    value={iface.ergonomics?.torqueExertion}   onChange={v => updE('torqueExertion', v)}   options={TMU_TORQUE_EXERTION_OPTIONS} />
            <Field label="Interface Visibility"    value={iface.ergonomics?.visibility}     onChange={v => updE('visibility', v)}     options={TMU_VISIBILITY_OPTIONS} />
            <Field label="Interface Accessibility" value={iface.ergonomics?.accessibility}  onChange={v => updE('accessibility', v)}  options={TMU_ACCESS_OPTIONS} />
            <Field label="Accuracy Required"  value={iface.ergonomics?.accuracy}         onChange={v => updE('accuracy', v)}         options={TMU_ACCURACY_OPTIONS} />
            <Field label="Posture Problems"   value={iface.ergonomics?.posture}          onChange={v => updE('posture', v)}          options={TMU_POSTURE_OPTIONS} />
          </div>
        )}
      </div>

      {/* ── Cost summary ── */}
      <div className="iform-cost-summary">
        <div className="cost-row">
          <span className="cost-label">Time Measurement Unit</span>
          <span className="cost-value">{tmu.totalTMUPerInterface.toFixed(2)}</span>
        </div>
        <div className="cost-row">
          <span className="cost-label">Disassembly Labour Cost</span>
          <span className="cost-value">{dlc.toFixed(2)}</span>
        </div>
        <div className="cost-row">
          <span className="cost-label">Disassembly Cost</span>
          <span className="cost-value">{totalCost.toFixed(2)}</span>
        </div>
      </div>

      {/* ── Save Details ── */}
      <div className="iform-save-row">
        <button
          className={`iform-save-btn ${saved ? 'saved' : ''}`}
          onClick={() => setSaved(true)}
        >
          {saved ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Saved
            </>
          ) : 'Save Details'}
        </button>
      </div>
    </div>
  )
}
