import React, { useState, useRef, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, Legend,
  ComposedChart, Line, ReferenceLine,
} from 'recharts'
import { useStore } from '../hooks/useStore.js'
import { calcDEI, calcTMU, calcProjectSummary, classifyDEI, classifyTMU } from '../utils/scoring.js'
import './VisualizePage.css'

const CTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="ctip">
      <p className="ctip-label">{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.fill||p.color}}>
          {p.name}: <strong>{typeof p.value==='number'?p.value.toFixed(2):p.value}</strong>
        </p>
      ))}
    </div>
  )
}

const DEI_BANDS = [
  { label: 'Safe',     sub: '< 30',  color: '#22c55e' },
  { label: 'Moderate', sub: '30–70', color: '#eab308' },
  { label: 'Extreme',  sub: '> 70',  color: '#ef4444' },
]
const TMU_BANDS = [
  { label: 'Low',      sub: '< 15',  color: '#22c55e' },
  { label: 'Moderate', sub: '15–30', color: '#eab308' },
  { label: 'High',     sub: '> 30',  color: '#ef4444' },
]
const BAND_IDX = { Low: 0, Medium: 1, High: 2 }

const RangeIndicator = ({ bands, activeLevel }) => {
  const activeIndex = activeLevel != null ? (BAND_IDX[activeLevel] ?? -1) : -1
  return (
    <div className="range-indicator">
      {bands.map((b, i) => {
        const on = i === activeIndex
        return (
          <span key={i} className="range-band" style={{
            color:      on ? b.color : '#4b5568',
            background: on ? `${b.color}1a` : 'transparent',
            border:     `1px solid ${on ? b.color + '55' : '#252e3d'}`,
          }}>
            <span className="range-band-dot" style={{ background: on ? b.color : '#2e3a4a' }} />
            {b.label}
            <span className="range-band-sub"> {b.sub}</span>
          </span>
        )
      })}
    </div>
  )
}

const StatCard = ({ label, value, sub, color, icon, bands, activeLevel }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{color}}>{icon}</div>
    <div style={{flex:1, minWidth:0}}>
      <p className="stat-label">{label}</p>
      <p className="stat-val" style={{color}}>{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
      {bands && <RangeIndicator bands={bands} activeLevel={activeLevel} />}
    </div>
  </div>
)

// ── Tree layout helpers ───────────────────────────────────────────
const T_NODE_W = 162
const T_NODE_H = 52
const T_ROW_H  = 128
const T_UNIT_W = 200
const T_PAD_L  = 100
const T_PAD_T  = 48

function subtreeLeaves(node) {
  const kids = node.children || []
  if (kids.length === 0) return 1
  return kids.reduce((s, c) => s + subtreeLeaves(c), 0)
}

function buildLayout(node, xOffset, depth, parentId = null) {
  const w = subtreeLeaves(node)
  const x = T_PAD_L + (xOffset + w / 2) * T_UNIT_W
  const y = T_PAD_T + depth * T_ROW_H
  const entry = { id: node.id, name: node.name, type: node.type, x, y, depth, parentId }
  const rows = [entry]
  let cx = xOffset
  for (const child of (node.children || [])) {
    rows.push(...buildLayout(child, cx, depth + 1, node.id))
    cx += subtreeLeaves(child)
  }
  return rows
}

// ── DISASSEMBLY TREE — top-down hierarchical diagram ─────────────
function DisassemblyTreeDiagram({ assemblyTree, parts, interfaces, fos }) {
  const containerRef = useRef(null)
  const [cw, setCw] = useState(900)

  useEffect(() => {
    if (containerRef.current) setCw(containerRef.current.offsetWidth)
  }, [])

  const hasChildren = assemblyTree && (assemblyTree.children || []).length > 0
  if (!hasChildren) {
    return <div className="tree-empty">No assembly structure defined yet.</div>
  }

  const nodes    = buildLayout(assemblyTree, 0, 0)
  const leaves   = subtreeLeaves(assemblyTree)
  const maxDepth = Math.max(...nodes.map(n => n.depth))
  const depths   = [...new Set(nodes.map(n => n.depth))].sort((a, b) => a - b)

  const svgW = Math.max(cw, T_PAD_L + leaves * T_UNIT_W + 40)
  const svgH = T_PAD_T + (maxDepth + 1) * T_ROW_H + T_NODE_H

  // DEI summary per part node
  const getPartDEI = (nodeId) => {
    const part = parts.find(p => p.id === nodeId)
    if (!part) return null
    const ifaces = interfaces.filter(i => i.part1 === part.id || i.part2 === part.id)
    if (!ifaces.length) return null
    const total = ifaces.reduce((s, i) => s + calcDEI(i).totalDEI, 0)
    return { total, cl: classifyDEI(total / ifaces.length) }
  }

  return (
    <div ref={containerRef} className="tree-svg-container">
      <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: 'visible' }}>

        {/* Level label rows */}
        {depths.map(d => {
          const y = T_PAD_T + d * T_ROW_H
          return (
            <g key={d}>
              <text x={8} y={y + 6} fill="#4b5568" fontSize="11"
                fontStyle="italic" fontFamily="Inter,sans-serif">
                Level {d}
              </text>
              {d > 0 && (
                <line x1={0} y1={y - T_ROW_H / 2} x2={T_PAD_L - 12} y2={y - T_ROW_H / 2}
                  stroke="#1e2535" strokeWidth="1" />
              )}
            </g>
          )
        })}

        {/* Elbow connectors: parent bottom → child top */}
        {nodes.filter(n => n.parentId).map(n => {
          const parent = nodes.find(p => p.id === n.parentId)
          if (!parent) return null
          const py = parent.y + T_NODE_H / 2
          const cy = n.y - T_NODE_H / 2
          const my = (py + cy) / 2
          return (
            <path key={`${parent.id}-${n.id}`}
              d={`M ${parent.x} ${py} L ${parent.x} ${my} L ${n.x} ${my} L ${n.x} ${cy}`}
              fill="none" stroke="#2a3545" strokeWidth="1.5" />
          )
        })}

        {/* Nodes */}
        {nodes.map(n => {
          const nx = n.x - T_NODE_W / 2
          const ny = n.y - T_NODE_H / 2
          const isAsm  = n.type === 'assembly'
          const border = isAsm ? '#22c55e' : '#4fc3f7'
          const dei    = isAsm ? null : getPartDEI(n.id)

          return (
            <g key={n.id}>
              {/* Drop shadow */}
              <rect x={nx + 2} y={ny + 2} width={T_NODE_W} height={T_NODE_H} rx="7"
                fill="rgba(0,0,0,0.28)" />
              {/* Card */}
              <rect x={nx} y={ny} width={T_NODE_W} height={T_NODE_H} rx="7"
                fill="#161b22" stroke={border} strokeWidth="1.5" strokeOpacity="0.65" />
              {/* Name */}
              <text x={n.x} y={n.y - (isAsm ? 7 : 2)}
                fill="#f0f2f5" fontSize="12" fontWeight="700"
                textAnchor="middle" fontFamily="Inter,sans-serif">
                {n.name.length > 18 ? n.name.slice(0, 17) + '…' : n.name}
              </text>
              {/* Assembly subtitle */}
              {isAsm && (
                <text x={n.x} y={n.y + 9} fill="#4b5568" fontSize="9"
                  fontStyle="italic" textAnchor="middle" fontFamily="Inter,sans-serif">
                  Assembly {n.depth}
                </text>
              )}
              {/* DEI badge on parts */}
              {dei && (
                <g transform={`translate(${nx + T_NODE_W - 36}, ${ny + 5})`}>
                  <rect width="32" height="15" rx="7"
                    fill={dei.cl.color} opacity="0.18" />
                  <text x="16" y="10.5" fill={dei.cl.color} fontSize="9" fontWeight="700"
                    textAnchor="middle" fontFamily="Inter,sans-serif">
                    {dei.total.toFixed(0)}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="tree-legend">
        <span className="tree-legend-item">
          <span style={{width:10,height:10,borderRadius:3,border:'1.5px solid #22c55e',background:'#161b22',display:'inline-block'}}/>
          Assembly
        </span>
        <span className="tree-legend-item">
          <span style={{width:10,height:10,borderRadius:3,border:'1.5px solid #4fc3f7',background:'#161b22',display:'inline-block'}}/>
          Part
        </span>
        <span className="tree-legend-item">
          <span style={{width:8,height:8,borderRadius:'50%',background:'#22c55e',display:'inline-block'}}/>
          Low DEI
        </span>
        <span className="tree-legend-item">
          <span style={{width:8,height:8,borderRadius:'50%',background:'#eab308',display:'inline-block'}}/>
          Medium DEI
        </span>
        <span className="tree-legend-item">
          <span style={{width:8,height:8,borderRadius:'50%',background:'#ef4444',display:'inline-block'}}/>
          High DEI
        </span>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
const DEI_COLORS  = { Low:'#22c55e', Medium:'#eab308', High:'#ef4444' }
const TOOL_PAL    = ['#4fc3f7','#f5a623','#ef4444','#ba68c8','#81c784']

export default function VisualizePage() {
  const { parts, interfaces: allInterfaces, projectName, assemblyTree, setStep, fos, occ, lcc } = useStore()
  const [tab, setTab] = useState('overview')

  const hasModelInterfaces = allInterfaces.some(i => i.fromModel)
  const interfaces = hasModelInterfaces ? allInterfaces.filter(i => i.fromModel) : allInterfaces

  const scored = interfaces.map(iface => {
    const dei = calcDEI(iface)
    const tmu = calcTMU(iface.ergonomics || {}, iface.repetitions, fos)
    return {
      ...iface, dei, tmu,
      deiCl: classifyDEI(dei.totalDEI),
      tmuCl: classifyTMU(tmu.totalTMUPerInterface),
      part1obj: parts.find(p => p.id === iface.part1),
      part2obj: parts.find(p => p.id === iface.part2),
    }
  })

  const summary = calcProjectSummary(interfaces, parts, fos, occ, lcc)

  const avgDEI        = scored.length ? scored.reduce((a,s)=>a+s.dei.totalDEI,0)/scored.length : 0
  const avgTMUPerIface = scored.length ? scored.reduce((a,s)=>a+s.tmu.totalTMUPerInterface,0)/scored.length : 0
  const avgDEILevel   = scored.length ? classifyDEI(avgDEI).level   : undefined
  const avgTMULevel   = scored.length ? classifyTMU(avgTMUPerIface).level : undefined

  const deiData = scored.map((s,i) => ({
    name: s.name || `I-${i+1}`,
    DEI: +s.dei.totalDEI.toFixed(1),
    fill: DEI_COLORS[s.deiCl.level],
  }))

  const tmuData = scored.map((s,i) => ({
    name: s.name || `I-${i+1}`,
    TMU: +s.tmu.totalTMUPerInterface.toFixed(2),
    'Time(s)': +s.tmu.adjustedTimeSec.toFixed(1),
    fill: DEI_COLORS[s.tmuCl.level],
  }))

  const partIfaceData = Object.entries(summary.partInterfaceCount)
    .map(([pid, count]) => ({
      name: parts.find(p=>p.id===pid)?.name || pid,
      count,
      fill: parts.find(p=>p.id===pid)?.color || '#4fc3f7',
    })).sort((a,b)=>b.count-a.count)

  const toolData = Object.entries(summary.toolCounts)
    .map(([t,v],i) => ({ name:t, value:v, fill:TOOL_PAL[i%TOOL_PAL.length] }))

  const deiDist = Object.entries(
    scored.reduce((a,s)=>{ a[s.deiCl.level]=(a[s.deiCl.level]||0)+1; return a },{})
  ).map(([n,v])=>({ name:n, value:v, fill:DEI_COLORS[n] }))

  // ── Pareto histogram: frequency of interfaces per DEI bin (bin = 30) ──
  const DEI_BIN = 30
  const deiBinData = (() => {
    if (scored.length === 0) return []
    const maxDEI = Math.max(...scored.map(s => s.dei.totalDEI))
    const numRegBins = Math.max(Math.ceil(maxDEI / DEI_BIN) + 1, 6)
    const bins = []
    for (let i = 0; i < numRegBins; i++) {
      const lo = i * DEI_BIN
      const hi = lo + DEI_BIN
      const isLast = i === numRegBins - 1
      const count = scored.filter(s => isLast ? s.dei.totalDEI >= lo : (s.dei.totalDEI >= lo && s.dei.totalDEI < hi)).length
      bins.push({ range: isLast ? 'More' : String(lo), count })
    }
    let cum = 0
    const total = scored.length
    return bins.map(b => {
      cum += b.count
      return { ...b, cumulativePct: total > 0 ? +(cum / total * 100).toFixed(1) : 0 }
    })
  })()

  const radarData = scored.length > 0 ? (() => {
    const keys = ['disassemblyForce','grasping','weight','symmetry','forceExertion','torqueExertion','visibility','accessibility','accuracy','posture']
    const lbls = ['Force','Grasp','Weight','Symm','FExert','TExert','Vis','Access','Acc','Posture']
    return keys.map((k,i)=>({
      subject: lbls[i],
      avg: +(scored.reduce((a,s)=>a+(s.tmu.scores[k]||0),0)/scored.length).toFixed(2),
      fullMark: 6,
    }))
  })() : []

  const TABS = ['overview','dei','tmu','parts','ergonomics','tree','table']

  return (
    <div className="viz-page">
      <div className="viz-header">
        <div>
          <h2 className="viz-title">{projectName}</h2>
          <p className="viz-sub">Disassembly Analysis Report</p>
        </div>
        <div className="viz-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setStep('interfaces')}>← Edit</button>
          <button className="btn btn-outline-green btn-sm" onClick={() => {
            const saved = JSON.parse(localStorage.getItem('dis_saved') || '[]')
            saved.push({ id: Date.now(), name: projectName, date: new Date().toISOString().slice(0,10) })
            localStorage.setItem('dis_saved', JSON.stringify(saved))
            alert(`"${projectName}" saved to list.`)
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:5}}>
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Save to List
          </button>
          <button className="btn btn-green btn-sm" style={{width:'auto'}} onClick={() => window.print()}>Export PDF</button>
        </div>
      </div>

      <div className="viz-tabs">
        {TABS.map(t => (
          <button key={t} className={`viz-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
            {t === 'dei' ? 'DEI Scores' : t === 'tmu' ? 'TMU / Time' : t === 'ergonomics' ? 'User Effort & Handling' : t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      <div className="viz-body">

        {/* ── OVERVIEW ── */}
        {tab==='overview' && (
          <div className="vtab animate-fade-in">
            <div className="kpi-grid">
              <StatCard label="Total DEI" value={summary.totalDEI.toFixed(0)}
                sub={`${interfaces.length} interfaces · avg ${avgDEI.toFixed(0)}/iface`} color="#eab308"
                bands={DEI_BANDS} activeLevel={avgDEILevel}
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}/>
              <StatCard label="Total TMU" value={summary.totalTMU.toFixed(1)}
                sub="User effort & handling load" color="#4fc3f7"
                bands={TMU_BANDS} activeLevel={avgTMULevel}
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}/>
              <StatCard label="Est. Time" value={`${(summary.totalTimeSec/60).toFixed(1)} min`}
                sub={`${summary.totalTimeSec.toFixed(0)}s total`} color="#22c55e"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}/>
              <StatCard label="Disassembly Cost" value={`₹ ${summary.totalCost.toFixed(2)}`}
                sub="Labour + Overhead" color="#ba68c8"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}/>
              <StatCard label="Parts" value={parts.length} sub={`${interfaces.length} interfaces`} color="#81c784"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>}/>
              <StatCard label="Unique Tools" value={Object.keys(summary.toolCounts).length}
                sub={Object.keys(summary.toolCounts).join(', ')||'None'} color="#ff8a65"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>}/>
            </div>
            <div className="ov-charts">
              <div className="chart-card">
                <p className="chart-title">DEI by Interface</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={deiData} margin={{top:4,right:8,left:-20,bottom:32}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false}/>
                    <XAxis dataKey="name" tick={{fill:'#4b5568',fontSize:9}} angle={-35} textAnchor="end"/>
                    <YAxis tick={{fill:'#4b5568',fontSize:10}}/>
                    <Tooltip content={<CTIP/>}/>
                    <Bar dataKey="DEI" radius={[3,3,0,0]}>{deiData.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <p className="chart-title">DEI Distribution</p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={deiDist} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value">
                      {deiDist.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                    </Pie>
                    <Tooltip content={<CTIP/>}/><Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,color:'#8b95a9'}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <p className="chart-title">Tools Required</p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={toolData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value">
                      {toolData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                    </Pie>
                    <Tooltip content={<CTIP/>}/><Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,color:'#8b95a9'}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {tab==='dei' && (
          <div className="vtab animate-fade-in">

            {/* ── Summary stat row ── */}
            <div className="kpi-grid" style={{marginBottom:8}}>
              <StatCard label="Avg DEI / Interface"
                value={scored.length ? avgDEI.toFixed(1) : '—'}
                sub="Lower is better"
                color="#eab308"
                bands={DEI_BANDS} activeLevel={avgDEILevel}
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}/>
              <StatCard label="Avg TMU / Interface"
                value={scored.length ? avgTMUPerIface.toFixed(2) : '—'}
                sub="User effort load"
                color="#4fc3f7"
                bands={TMU_BANDS} activeLevel={avgTMULevel}
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}/>
              <StatCard label="Est. Disassembly Time"
                value={scored.length ? `${(scored.reduce((a,s)=>a+s.tmu.adjustedTimeSec,0)/60).toFixed(3)} min` : '—'}
                sub="Total across interfaces"
                color="#22c55e"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}/>
            </div>

            {/* ── Pareto histogram ── */}
            <div className="chart-card chart-full">
              <p className="chart-title">Number of Interfaces with Specific DEI Scores</p>
              <p className="chart-sub">Frequency histogram · Dashed line = 85% DEI threshold</p>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={deiBinData} margin={{top:10, right:20, left:0, bottom:60}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false}/>
                  <XAxis
                    dataKey="range"
                    tick={{fill:'#4b5568', fontSize:9}}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    label={{value:`DEI Score Range (Frequency Bin = ${DEI_BIN})`, position:'insideBottom', offset:-46, fill:'#8b95a9', fontSize:11}}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{fill:'#4b5568', fontSize:10}}
                    label={{value:'Number of Interfaces', angle:-90, position:'insideLeft', offset:14, fill:'#8b95a9', fontSize:11}}
                  />
                  <Tooltip content={<CTIP/>}/>
                  <ReferenceLine y={85} stroke="#94a3b8" strokeDasharray="7 4" strokeWidth={1.5}
                    label={{value:'85 DEI', position:'insideTopRight', fill:'#94a3b8', fontSize:10, fontFamily:'var(--font)'}}/>
                  <Bar dataKey="count" name="Frequency" fill="#4fc3f7" radius={[3,3,0,0]} maxBarSize={40}
                    label={{position:'top', fill:'#4b5568', fontSize:10}}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card chart-full">
              <p className="chart-title">DEI Score Breakdown</p>
              <div className="tbl-wrap"><table className="vtbl">
                <thead><tr><th>#</th><th>Interface</th><th>Time</th><th>Tool</th><th>Fixture</th><th>Access</th><th>Training</th><th>Hazard</th><th>Force</th><th>DEI/iface</th><th>×Reps</th><th>Total</th></tr></thead>
                <tbody>{scored.map((s,i)=>(
                  <tr key={s.id} className={s.deiCl.level==='High'?'row-hi':s.deiCl.level==='Medium'?'row-md':''}>
                    <td>{String(i+1).padStart(2,'0')}</td><td>{s.name}</td>
                    <td>{s.dei.timeScore}</td><td>{s.dei.toolScore}</td><td>{s.dei.fixtureScore}</td>
                    <td>{s.dei.accessScore}</td><td>{s.dei.instructScore}</td><td>{s.dei.hazardScore}</td>
                    <td>{s.dei.forceScore}</td><td>{s.dei.deiPerInterface}</td><td>{s.repetitions}</td>
                    <td><span className={`score-pill ${s.deiCl.class}`}>{s.dei.totalDEI.toFixed(0)}</span></td>
                  </tr>
                ))}</tbody>
              </table></div>
            </div>
          </div>
        )}

        {tab==='tmu' && (
          <div className="vtab animate-fade-in">
            <div className="chart-card chart-full">
              <p className="chart-title">TMU Score per Interface</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={tmuData} margin={{top:4,right:8,left:-20,bottom:50}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:'#4b5568',fontSize:10}} angle={-40} textAnchor="end"/>
                  <YAxis tick={{fill:'#4b5568',fontSize:10}}/>
                  <Tooltip content={<CTIP/>}/>
                  <Bar dataKey="TMU" radius={[3,3,0,0]}>{tmuData.map((e,i)=><Cell key={i} fill={scored[i]?.tmuCl.color||'#22c55e'}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card chart-full">
              <p className="chart-title">Estimated Disassembly Time per Interface (sec, ×{fos} safety factor)</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={tmuData} margin={{top:4,right:8,left:-20,bottom:50}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:'#4b5568',fontSize:10}} angle={-40} textAnchor="end"/>
                  <YAxis tick={{fill:'#4b5568',fontSize:10}}/>
                  <Tooltip content={<CTIP/>}/>
                  <Bar dataKey="Time(s)" fill="#22c55e" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab==='parts' && (
          <div className="vtab animate-fade-in">
            <div className="chart-card chart-full">
              <p className="chart-title">Number of Interfaces per Part</p>
              <p className="chart-sub">Parts with many interfaces are candidates for consolidation or redesign</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={partIfaceData} margin={{top:4,right:8,left:-20,bottom:50}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:'#4b5568',fontSize:11}} angle={-35} textAnchor="end"/>
                  <YAxis tick={{fill:'#4b5568',fontSize:10}} allowDecimals={false}/>
                  <Tooltip content={<CTIP/>}/>
                  <Bar dataKey="count" radius={[4,4,0,0]} label={{position:'top',fill:'#4b5568',fontSize:11}}>
                    {partIfaceData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card chart-full">
              <p className="chart-title">Parts Summary</p>
              <div className="tbl-wrap"><table className="vtbl">
                <thead><tr><th>Part</th><th>Interfaces</th><th>Total DEI</th><th>Avg DEI</th><th>Tools</th></tr></thead>
                <tbody>{parts.map(p=>{
                  const pi = scored.filter(s=>s.part1obj?.id===p.id||s.part2obj?.id===p.id)
                  const td = pi.reduce((a,s)=>a+s.dei.totalDEI,0)
                  const av = pi.length>0?td/pi.length:0
                  const cl = classifyDEI(av)
                  const tools = [...new Set(pi.map(s=>s.tool).filter(t=>t&&t!=='None'))]
                  return (
                    <tr key={p.id}>
                      <td><span style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:8,height:8,borderRadius:'50%',background:p.color,display:'inline-block'}}/>{p.name}</span></td>
                      <td>{pi.length}</td><td>{td.toFixed(0)}</td>
                      <td><span className={`score-pill ${cl.class}`}>{av.toFixed(0)}</span></td>
                      <td style={{fontSize:12,color:'#8b95a9'}}>{tools.join(', ')||'None'}</td>
                    </tr>
                  )
                })}</tbody>
              </table></div>
            </div>
          </div>
        )}

        {tab==='ergonomics' && (
          <div className="vtab animate-fade-in">
            <div className="ergo-two">
              <div className="chart-card">
                <p className="chart-title">Average User Effort & Handling Scores (Radar)</p>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1e2535"/>
                    <PolarAngleAxis dataKey="subject" tick={{fill:'#8b95a9',fontSize:11}}/>
                    <PolarRadiusAxis angle={30} domain={[0,6]} tick={{fill:'#4b5568',fontSize:9}}/>
                    <Radar name="Avg" dataKey="avg" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2}/>
                    <Tooltip content={<CTIP/>}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <p className="chart-title">TMU Score per Interface</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tmuData} layout="vertical" margin={{top:4,right:40,left:80,bottom:4}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" horizontal={false}/>
                    <XAxis type="number" tick={{fill:'#4b5568',fontSize:10}}/>
                    <YAxis type="category" dataKey="name" tick={{fill:'#8b95a9',fontSize:10}} width={76}/>
                    <Tooltip content={<CTIP/>}/>
                    <Bar dataKey="TMU" radius={[0,4,4,0]}>{tmuData.map((e,i)=><Cell key={i} fill={scored[i]?.tmuCl.color||'#22c55e'}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="chart-card chart-full">
              <p className="chart-title">User Effort & Handling Metrics Detail Table</p>
              <div className="tbl-wrap"><table className="vtbl">
                <thead><tr><th>Interface</th><th>Force</th><th>Grasp</th><th>Weight</th><th>Symm</th><th>FExert</th><th>TExert</th><th>Vis</th><th>Access</th><th>Acc</th><th>Posture</th><th>Total TMU</th><th>Time(s)</th></tr></thead>
                <tbody>{scored.map((s,i)=>(
                  <tr key={s.id} className={s.tmuCl.level==='High'?'row-hi':s.tmuCl.level==='Medium'?'row-md':''}>
                    <td>{s.name||`I-${i+1}`}</td>
                    <td>{s.tmu.scores.disassemblyForce?.toFixed(1)}</td>
                    <td>{s.tmu.scores.grasping?.toFixed(1)}</td>
                    <td>{s.tmu.scores.weight?.toFixed(1)}</td>
                    <td>{s.tmu.scores.symmetry?.toFixed(1)}</td>
                    <td>{s.tmu.scores.forceExertion?.toFixed(1)}</td>
                    <td>{s.tmu.scores.torqueExertion?.toFixed(1)}</td>
                    <td>{s.tmu.scores.visibility?.toFixed(1)}</td>
                    <td>{s.tmu.scores.accessibility?.toFixed(1)}</td>
                    <td>{s.tmu.scores.accuracy?.toFixed(1)}</td>
                    <td>{s.tmu.scores.posture?.toFixed(1)}</td>
                    <td><span className={`score-pill ${s.tmuCl.class}`}>{s.tmu.totalTMUPerInterface.toFixed(2)}</span></td>
                    <td>{s.tmu.adjustedTimeSec.toFixed(1)}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            </div>
          </div>
        )}

        {tab==='tree' && (
          <div className="vtab animate-fade-in">
            <div className="chart-card chart-full" style={{minHeight:600}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div>
                  <p className="chart-title">Disassembly Tree</p>
                  <p className="chart-sub">Node-link diagram — parts connected by interface type diamonds (inspired by reference layout)</p>
                </div>
              </div>
              <DisassemblyTreeDiagram assemblyTree={assemblyTree} parts={parts} interfaces={interfaces} fos={fos} />
            </div>
          </div>
        )}

        {tab==='table' && (
          <div className="vtab animate-fade-in">
            <div className="chart-card chart-full">
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                <p className="chart-title" style={{margin:0}}>Complete Interface Data</p>
                <span className="badge badge-gray">{interfaces.length} interfaces</span>
              </div>
              <div className="tbl-wrap"><table className="vtbl">
                <thead><tr><th>#</th><th>Name</th><th>Part 1</th><th>Part 2</th><th>Nature</th><th>Reps</th><th>Tool</th><th>Fixture</th><th>Hazard</th><th>Force</th><th>DEI</th><th>TMU</th><th>Time(s)</th><th>Risk</th></tr></thead>
                <tbody>{scored.map((s,i)=>(
                  <tr key={s.id} className={s.deiCl.level==='High'?'row-hi':s.deiCl.level==='Medium'?'row-md':''}>
                    <td>{String(i+1).padStart(2,'0')}</td>
                    <td>{s.name}</td>
                    <td style={{color:s.part1obj?.color}}>{s.part1obj?.name||'—'}</td>
                    <td style={{color:s.part2obj?.color}}>{s.part2obj?.name||'—'}</td>
                    <td>{s.nature}</td><td>{s.repetitions}</td>
                    <td>{s.tool}</td><td>{s.fixture}</td><td>{s.hazard}</td><td>{s.force}</td>
                    <td><span className={`score-pill ${s.deiCl.class}`}>{s.dei.totalDEI.toFixed(0)}</span></td>
                    <td><span className={`score-pill ${s.tmuCl.class}`}>{s.tmu.totalTMUPerInterface.toFixed(1)}</span></td>
                    <td>{s.tmu.adjustedTimeSec.toFixed(1)}</td>
                    <td><span className={`badge ${s.deiCl.level==='Low'?'badge-green':''}`} style={s.deiCl.level!=='Low'?{background:s.deiCl.color+'22',color:s.deiCl.color,border:`1px solid ${s.deiCl.color}55`}:{}}>{s.deiCl.level}</span></td>
                  </tr>
                ))}</tbody>
              </table></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
