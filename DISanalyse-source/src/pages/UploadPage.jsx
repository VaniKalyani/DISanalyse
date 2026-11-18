import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useStore, DEFAULT_COST_PARAMS } from '../hooks/useStore.js'
import { convertObjToGlb } from '../utils/modelConverter.js'
import Icon from '../components/Icon.jsx'
import './UploadPage.css'

const asset = (p) => `${import.meta.env.BASE_URL}${p}`

// ── Conversion states ─────────────────────────────────────────────
const STATE = {
  IDLE:       'idle',
  CONVERTING: 'converting',
  DONE:       'done',
  ERROR:      'error',
  STL_WARN:   'stl_warn',
}

export default function UploadPage() {
  const { setModel, setStep, projectName, setProjectName, fos, occ, lcc, setFos, setOcc, setLcc } = useStore()

  const [useDefaults,  setUseDefaults]  = useState(true)
  const [dragging,     setDragging]     = useState(false)
  const [fileName,    setFileName]    = useState('')
  const [convState,   setConvState]   = useState(STATE.IDLE)
  const [progress,    setProgress]    = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [partCount,   setPartCount]   = useState(0)
  const [error,       setError]       = useState('')

  const fileInputRef = useRef(null)

  // "Use Default Values" is checked on load — make sure the store holds the defaults
  useEffect(() => {
    setFos(DEFAULT_COST_PARAMS.fos)
    setOcc(DEFAULT_COST_PARAMS.occ)
    setLcc(DEFAULT_COST_PARAMS.lcc)
  }, [setFos, setOcc, setLcc])

  const handleUseDefaults = (checked) => {
    setUseDefaults(checked)
    if (checked) {
      setFos(DEFAULT_COST_PARAMS.fos)
      setOcc(DEFAULT_COST_PARAMS.occ)
      setLcc(DEFAULT_COST_PARAMS.lcc)
    }
  }

  const handleFile = useCallback(async (file) => {
    if (!file) return
    setError('')
    setConvState(STATE.IDLE)

    const ext = file.name.split('.').pop().toLowerCase()

    // ── Unsupported ──────────────────────────────────────────────
    if (!['glb', 'gltf', 'obj', 'stl'].includes(ext)) {
      setError(`Unsupported format: .${ext}. Please use .OBJ, .GLB, .GLTF, or .STL`)
      return
    }

    setFileName(file.name)

    // ── GLB / GLTF: use as-is ─────────────────────────────────────
    if (ext === 'glb' || ext === 'gltf') {
      setModel(file, URL.createObjectURL(file), ext)
      setConvState(STATE.DONE)
      setPartCount(0) // will be detected in ModelViewer
      return
    }

    // ── STL: single-mesh, no part names possible ──────────────────
    if (ext === 'stl') {
      setModel(file, URL.createObjectURL(file), ext)
      setConvState(STATE.STL_WARN)
      return
    }

    // ── OBJ: convert → GLB in browser ────────────────────────────
    setConvState(STATE.CONVERTING)
    setProgress(0)

    try {
      const result = await convertObjToGlb(file, (pct, msg) => {
        setProgress(pct)
        setProgressMsg(msg)
      })

      // Store the converted GLB URL (type 'glb') so ModelViewer uses GLTFLoader
      setModel(file, result.glbUrl, 'glb')
      setPartCount(result.partCount)
      setConvState(STATE.DONE)
    } catch (err) {
      console.error('OBJ conversion failed:', err)
      setError(`Conversion failed: ${err.message || 'Unknown error'}`)
      setConvState(STATE.ERROR)
      // Fall back to raw OBJ
      setModel(file, URL.createObjectURL(file), 'obj')
    }
  }, [setModel])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const canContinue = fileName && convState !== STATE.CONVERTING && convState !== STATE.ERROR

  return (
    <div className="upload-page">
      <div className="upload-hero">
        <div className="upload-hero-left">
          <div className="hero-grid-bg" />
          <div className="hero-disassembly-art">
            <img src={asset('heroimage.png')} alt="Disassembled device components" />
          </div>
        </div>

        <div className="upload-hero-right">
          <div className="ssi-logo">
            <img src={asset('ssi.png')} alt="SSI Lab" />
          </div>
          <div className="upload-form-wrap animate-fade-in">
            <div className="upload-header-row">
              <h1 className="upload-title">Design for <span className="green">Disassembly</span></h1>
            </div>
            <p className="upload-sub">
              Upload your 3D model, define parts and interfaces, and analyze disassembly efficiency with advanced DEI scoring.
            </p>

            <div className="upload-field">
              <label>PROJECT NAME</label>
              <input
                type="text" value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="Untitled Product"
              />
            </div>

            <div className="upload-field">
              <div className="param-header-row">
                <label>ANALYSIS PARAMETERS</label>
                <div className="param-defaults-row">
                  <label className="param-default-check">
                    <input
                      type="checkbox"
                      checked={useDefaults}
                      onChange={e => handleUseDefaults(e.target.checked)}
                    />
                    Use Default Values
                  </label>
                  <div className="param-info-wrap">
                    <div className="param-info-icon" tabIndex={0} aria-label="Show default values"><Icon name="info" size={16} /></div>
                    <div className="param-info-tooltip">
                      <p className="tooltip-title">Default Values</p>
                      <div className="tooltip-row"><span>Factor of Safety</span><span>1.5</span></div>
                      <div className="tooltip-row"><span>Overhead Cost Coeff.</span><span>0.015</span></div>
                      <div className="tooltip-row"><span>Labour Cost Coeff.</span><span>1.666667</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="param-fields-row">
                <div className="param-field has-tip" tabIndex={-1}>
                  <label htmlFor="fos-input" className="param-label-tip">
                    Factor of Safety
                    <Icon name="help" size={13} className="param-label-tip-icon" />
                  </label>
                  <div className="param-field-tooltip" role="tooltip">
                    <p className="tooltip-title">Factor of Safety (FoS)</p>
                    <p className="tooltip-body">
                      A multiplier applied to the estimated disassembly time to allow for real-world
                      variation — operator fatigue, unfamiliarity with the product, corroded or worn
                      fasteners, and so on.
                    </p>
                    <p className="tooltip-formula">Adjusted time = Estimated time × FoS</p>
                    <p className="tooltip-body muted">1.0 = no allowance · default 1.5 (50% extra time)</p>
                  </div>
                  <input
                    id="fos-input"
                    type="number" step="0.01" min="0"
                    value={fos}
                    onChange={e => setFos(parseFloat(e.target.value) || 0)}
                    disabled={useDefaults}
                    placeholder="1.5"
                  />
                </div>
                <div className="param-field">
                  <label>Overhead Cost Coeff.</label>
                  <input
                    type="number" step="0.001" min="0"
                    value={occ}
                    onChange={e => setOcc(parseFloat(e.target.value) || 0)}
                    disabled={useDefaults}
                    placeholder="0.015"
                  />
                </div>
                <div className="param-field">
                  <label>Labour Cost Coeff.</label>
                  <input
                    type="number" step="0.000001" min="0"
                    value={lcc}
                    onChange={e => setLcc(parseFloat(e.target.value) || 0)}
                    disabled={useDefaults}
                    placeholder="1.666667"
                  />
                </div>
              </div>
            </div>

            {/* ── Naming convention guide ── */}
            <div className="naming-guide">
              <div className="naming-guide-header">
                <Icon name="info" size={13} />
                <span>Part Naming for Interface Detection</span>
              </div>
              <p className="naming-guide-text">
                Name parts with shared joint tokens — e.g. <code>partA_snap1</code> &amp; <code>partB_snap1</code>. For multiple interfaces, chain tokens: <code>partA_snap1_push2</code>.
              </p>
            </div>

            <div
              className={`upload-drop ${dragging ? 'drag' : ''} ${fileName ? 'filled' : ''} ${convState === STATE.CONVERTING ? 'converting' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={e => { if (convState !== STATE.CONVERTING && e.target !== fileInputRef.current && !e.target.closest('label')) fileInputRef.current?.click() }}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
            >
              {/* ── Idle / prompt ── */}
              {convState === STATE.IDLE && !fileName && (
                <>
                  <div className="drop-icon">
                    <Icon name="upload" size={26} />
                  </div>
                  <p className="drop-main">Drop your 3D model here</p>
                  <p className="drop-sub">or click to browse files</p>
                  <p className="drop-formats">Supports .OBJ, .GLTF, .GLB, .STL</p>
                  <p className="drop-formats" style={{color:'#4caf50', marginTop:4}}>
                    OBJ files are automatically converted to GLB for best part detection
                  </p>
                </>
              )}

              {/* ── Converting spinner ── */}
              {convState === STATE.CONVERTING && (
                <div className="conv-status">
                  <div className="conv-spinner" />
                  <p className="conv-file">{fileName}</p>
                  <p className="conv-msg">{progressMsg}</p>
                  <div className="conv-bar-track">
                    <div className="conv-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="conv-pct">{progress}%</p>
                </div>
              )}

              {/* ── Done (GLB/GLTF or converted OBJ) ── */}
              {convState === STATE.DONE && (
                <div className="conv-status">
                  <div className="conv-check">
                    <Icon name="check" size={22} />
                  </div>
                  <p className="conv-file">✓ {fileName}</p>
                  {partCount > 0 ? (
                    <p className="conv-success">
                      Converted to GLB — <strong>{partCount} named part{partCount !== 1 ? 's' : ''}</strong> detected
                    </p>
                  ) : (
                    <p className="conv-success">Model ready — parts will be detected on the next step</p>
                  )}
                </div>
              )}

              {/* ── STL warning ── */}
              {convState === STATE.STL_WARN && (
                <div className="conv-status">
                  <div className="conv-warn-icon">
                    <Icon name="warning" size={22} />
                  </div>
                  <p className="conv-file">✓ {fileName}</p>
                  <p className="conv-warn-msg">
                    STL is a single-mesh format — it stores geometry only, with no part names or hierarchy.
                    You can add parts manually on the next step.
                  </p>
                </div>
              )}

              {/* ── Error ── */}
              {convState === STATE.ERROR && (
                <div className="conv-status">
                  <p className="conv-file">{fileName}</p>
                  <p className="drop-error">{error}</p>
                  <p className="conv-warn-msg">Falling back to raw OBJ — part detection may be limited.</p>
                </div>
              )}

              {/* Browse button always available */}
              <label className="drop-browse-btn" htmlFor="fu" style={{ marginTop: 12 }}>
                <Icon name="description" size={13} />
                {fileName ? 'CHANGE FILE' : 'BROWSE FILES'}
              </label>
              <input
                ref={fileInputRef}
                id="fu" type="file" accept=".glb,.gltf,.obj,.stl"
                onChange={e => { handleFile(e.target.files[0]); e.target.value = '' }}
                style={{ display: 'none' }}
              />
              {error && convState !== STATE.ERROR && <p className="drop-error">{error}</p>}
            </div>

            <button
              className="btn btn-green btn-nav"
              disabled={!canContinue}
              onClick={() => setStep('model')}
            >
              {convState === STATE.CONVERTING ? 'Converting…' : 'Continue to Model Definition'}
              <Icon name="chevron_right" size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── WHY SECTION ── */}
      <div className="upload-why-section">
        <div className="why-inner">
          <div className="why-text-col">
            <h2 className="why-title">Why Design for <span className="green">Disassembly</span>?</h2>
            <p className="why-body">
              Design for disassembly (DfD) is essential to enable a circular economy by ensuring products and
              buildings can be taken apart non-destructively, allowing components to be reused, repaired, or
              recycled. It minimizes waste, cuts down on landfill contributions, conserves resources by
              reducing the need for new materials, and reduces energy consumption compared to traditional recycling.
            </p>
          </div>
          <div className="why-icon-col">
            <img src={asset('down.png')} alt="Disassembly" />
          </div>
        </div>
        <div className="upload-footer">
          <p className="footer-name">DISAnalyse</p>
          <p className="footer-meta">Version: 1.1.0</p>
          <p className="footer-meta">Date: 2026-04-30 10:26</p>
          <p className="footer-meta">Hash: f20e38d42216</p>
          <p className="footer-meta">Branch: main</p>
          <div className="footer-links-row">
            {["What's New","Credits","License","Store","Website"].map(l => (
              <a key={l} href="#" className="footer-link" onClick={e => e.preventDefault()}>
                <Icon name="language" size={11} />
                {l}
              </a>
            ))}
          </div>
          <p className="footer-copy">© Copyright Disanalyse 2026</p>
        </div>
      </div>
    </div>
  )
}
