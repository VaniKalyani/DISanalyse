import React, { useCallback, useState } from 'react'
import { useStore, DEFAULT_COST_PARAMS } from '../hooks/useStore.js'
import { convertObjToGlb } from '../utils/modelConverter.js'
import './UploadPage.css'

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

  const [useDefaults,  setUseDefaults]  = useState(false)
  const [dragging,     setDragging]     = useState(false)
  const [fileName,    setFileName]    = useState('')
  const [convState,   setConvState]   = useState(STATE.IDLE)
  const [progress,    setProgress]    = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [partCount,   setPartCount]   = useState(0)
  const [error,       setError]       = useState('')

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
            <img src="/public/heroimage.png" alt="Heroimage" />
          </div>
        </div>

        <div className="upload-hero-right">
          <div className="ssi-logo">
            <img src="/public/ssi.png" alt="SSI Lab" />
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
                    <div className="param-info-icon">i</div>
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
                <div className="param-field">
                  <label>Factor of Safety</label>
                  <input
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
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
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
            >
              {/* ── Idle / prompt ── */}
              {convState === STATE.IDLE && !fileName && (
                <>
                  <div className="drop-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p className="drop-main">Drop your 3D model here</p>
                  <p className="drop-sub">or click to browse files</p>
                  <p className="drop-formats">Supports .OBJ, .GLTF, .GLB</p>
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
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
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
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
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
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                {fileName ? 'CHANGE FILE' : 'BROWSE FILES'}
              </label>
              <input
                id="fu" type="file" accept=".glb,.gltf,.obj,.stl"
                onChange={e => handleFile(e.target.files[0])}
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
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
            <img src="/public/down.png" alt="Disassembly" />
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
              <a key={l} href="#" className="footer-link">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
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
