import React, { useState } from 'react'
import './SideDrawer.css'

export default function SideDrawer({ open, onClose, activePanel, setActivePanel }) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' })
  const [authMode, setAuthMode] = useState('login') // 'login' | 'signup'
  const [authError, setAuthError] = useState('')
  const [savedAnalyses] = useState([
    { id: 1, name: 'Laptop Disassembly', date: '2026-04-18', dei: 42 },
    { id: 2, name: 'Phone Battery Swap', date: '2026-04-15', dei: 27 },
  ])

  const handleLogin = (e) => {
    e.preventDefault()
    if (!loginForm.email || !loginForm.password) {
      setAuthError('Please fill in all fields.')
      return
    }
    setLoggedIn(true)
    setAuthError('')
    setActivePanel('main')
  }

  const handleSignup = (e) => {
    e.preventDefault()
    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      setAuthError('Please fill in all fields.')
      return
    }
    setLoggedIn(true)
    setAuthError('')
    setActivePanel('main')
  }

  const handleLogout = () => {
    setLoggedIn(false)
    setLoginForm({ email: '', password: '' })
    setSignupForm({ name: '', email: '', password: '' })
    setActivePanel('main')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`drawer-backdrop ${open ? 'visible' : ''}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside className={`side-drawer ${open ? 'open' : ''}`}>

        {/* Drawer header */}
        <div className="drawer-header">
          <div className="drawer-logo">
            <div className="drawer-logo-icon">
              <img src="/logo.png" alt="DISanalyse logo" width="46" height="46" style={{borderRadius:'var(--radius-md)',display:'block'}} />
            </div>
            <div>
              <div className="drawer-logo-name">DISanalyse</div>
              <div className="drawer-logo-sub">Design for Disassembly</div>
            </div>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* User section */}
        <div className="drawer-user-section">
          <div className="drawer-avatar">
            {loggedIn ? (
              <span className="avatar-initials">
                {(signupForm.name || loginForm.email || 'U')[0].toUpperCase()}
              </span>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            )}
          </div>
          {loggedIn ? (
            <div className="drawer-user-info">
              <span className="drawer-user-name">{signupForm.name || loginForm.email}</span>
              <button className="drawer-logout-btn" onClick={handleLogout}>Log Out</button>
            </div>
          ) : (
            <div className="drawer-auth-btns">
              <button
                className={`drawer-auth-btn ${activePanel === 'login' ? 'active' : ''}`}
                onClick={() => { setActivePanel('login'); setAuthMode('login'); setAuthError('') }}
              >Log In</button>
              <span className="drawer-auth-sep">/</span>
              <button
                className={`drawer-auth-btn ${activePanel === 'signup' ? 'active' : ''}`}
                onClick={() => { setActivePanel('signup'); setAuthMode('signup'); setAuthError('') }}
              >Sign Up</button>
            </div>
          )}
        </div>

        {/* ── Auth panels ── */}
        {!loggedIn && (activePanel === 'login' || activePanel === 'signup') && (
          <div className="drawer-panel drawer-auth-panel">
            <div className="auth-tabs">
              <button
                className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => { setAuthMode('login'); setAuthError('') }}
              >Log In</button>
              <button
                className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
                onClick={() => { setAuthMode('signup'); setAuthError('') }}
              >Sign Up</button>
            </div>

            {authMode === 'login' ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <label>Email</label>
                <input
                  type="email" placeholder="your@email.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                />
                <label>Password</label>
                <input
                  type="password" placeholder="••••••••"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                />
                {authError && <p className="auth-error">{authError}</p>}
                <button type="submit" className="auth-submit-btn">Log In</button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleSignup}>
                <label>Full Name</label>
                <input
                  type="text" placeholder="Jane Smith"
                  value={signupForm.name}
                  onChange={e => setSignupForm(f => ({ ...f, name: e.target.value }))}
                />
                <label>Email</label>
                <input
                  type="email" placeholder="your@email.com"
                  value={signupForm.email}
                  onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                />
                <label>Password</label>
                <input
                  type="password" placeholder="••••••••"
                  value={signupForm.password}
                  onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                />
                {authError && <p className="auth-error">{authError}</p>}
                <button type="submit" className="auth-submit-btn">Create Account</button>
              </form>
            )}
          </div>
        )}

        {/* ── Main nav ── */}
        {activePanel === 'main' && (
          <nav className="drawer-nav">
            {loggedIn && (
              <button className="drawer-nav-item" onClick={() => setActivePanel('saved')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                Saved Analysis
              </button>
            )}
            <button className="drawer-nav-item" onClick={() => setActivePanel('learn')}>
              <svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor">
                <path d="M508.5-291.5Q520-303 520-320t-11.5-28.5Q497-360 480-360t-28.5 11.5Q440-337 440-320t11.5 28.5Q463-280 480-280t28.5-11.5ZM440-440h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
              </svg>
              Learn More
            </button>
            <button className="drawer-nav-item" onClick={() => setActivePanel('help')}>
              <svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor">
                <path d="M513.5-254.5Q528-269 528-290t-14.5-35.5Q499-340 478-340t-35.5 14.5Q428-311 428-290t14.5 35.5Q457-240 478-240t35.5-14.5ZM442-394h74q0-33 7.5-52t42.5-52q26-26 41-49.5t15-56.5q0-56-41-86t-97-30q-57 0-92.5 30T342-618l66 26q5-18 22.5-39t53.5-21q32 0 48 17.5t16 38.5q0 20-12 37.5T506-526q-44 39-54 59t-10 73Zm38 314q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
              </svg>
              Help &amp; Support
            </button>
            <button className="drawer-nav-item" onClick={() => setActivePanel('settings')}>
              <svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor">
                <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/>
              </svg>
              Settings
            </button>
          </nav>
        )}

        {/* ── Saved Analysis Panel ── */}
        {activePanel === 'saved' && (
          <div className="drawer-panel">
            <div className="panel-back-hdr">
              <button className="panel-back-btn" onClick={() => setActivePanel('main')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back
              </button>
              <h3 className="panel-title">Saved Analysis</h3>
            </div>
            {savedAnalyses.length === 0 ? (
              <p className="panel-empty">No saved analyses yet.</p>
            ) : (
              <div className="saved-list">
                {savedAnalyses.map(a => (
                  <div key={a.id} className="saved-item">
                    <div className="saved-item-name">{a.name}</div>
                    <div className="saved-item-meta">
                      <span>{a.date}</span>
                      <span className="saved-dei">DEI: {a.dei}</span>
                    </div>
                    <button className="saved-open-btn">Open</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Learn More Panel ── */}
        {activePanel === 'learn' && (
          <div className="drawer-panel">
            <div className="panel-back-hdr">
              <button className="panel-back-btn" onClick={() => setActivePanel('main')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back
              </button>
              <h3 className="panel-title">Learn More</h3>
            </div>
            <div className="panel-content">
              <h4>What is Design for Disassembly?</h4>
              <p>Design for Disassembly (DfD) is an approach that ensures products can be efficiently taken apart at the end of their life cycle, enabling reuse, repair, and recycling of components.</p>
              <h4>DEI Score</h4>
              <p>The Disassembly Effort Index (DEI) quantifies the complexity of disassembly interfaces. Lower scores indicate easier, more sustainable disassembly.</p>
              <h4>TMU (Time Measurement Unit)</h4>
              <p>TMU is used to estimate the time required for disassembly operations, helping calculate labour costs and overall disassembly efficiency.</p>
              <div className="learn-link-row">
                <a href="#" className="learn-link">🌐 Visit Website</a>
                <a href="#" className="learn-link">📄 Documentation</a>
              </div>
            </div>
          </div>
        )}

        {/* ── Help & Support Panel ── */}
        {activePanel === 'help' && (
          <div className="drawer-panel">
            <div className="panel-back-hdr">
              <button className="panel-back-btn" onClick={() => setActivePanel('main')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back
              </button>
              <h3 className="panel-title">Help &amp; Support</h3>
            </div>
            <div className="panel-content">
              <h4>Getting Started</h4>
              <p>Upload a 3D model in .OBJ or .GLTF format, define your parts, set up interfaces, and run the DEI analysis.</p>
              <h4>Supported Formats</h4>
              <p>Currently supports <strong>.OBJ</strong> and <strong>.GLTF</strong> 3D model files.</p>
              <h4>Contact Support</h4>
              <p>For technical assistance, please reach out via:</p>
              <div className="help-contacts">
                <div className="help-contact-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  support@disanalyse.com
                </div>
                <div className="help-contact-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  disanalyse.com/support
                </div>
              </div>
              <h4>FAQ</h4>
              <div className="faq-item">
                <p className="faq-q">How is DEI calculated?</p>
                <p className="faq-a">DEI is the sum of scores for Time, Tool, Fixture, Access, Training, Hazard, and Force, multiplied by the number of repetitions.</p>
              </div>
              <div className="faq-item">
                <p className="faq-q">What does a High DEI score mean?</p>
                <p className="faq-a">A DEI ≥ 70 indicates high disassembly effort — the interface is complex and may need redesign.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Settings Panel ── */}
        {activePanel === 'settings' && (
          <div className="drawer-panel">
            <div className="panel-back-hdr">
              <button className="panel-back-btn" onClick={() => setActivePanel('main')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back
              </button>
              <h3 className="panel-title">Settings</h3>
            </div>
            <div className="panel-content">
              <div className="settings-section">
                <h4>Application</h4>
                <div className="settings-row">
                  <span>Version</span>
                  <span className="settings-val">1.1.0</span>
                </div>
                <div className="settings-row">
                  <span>Branch</span>
                  <span className="settings-val">main</span>
                </div>
              </div>
              <div className="settings-section">
                <h4>Units</h4>
                <div className="settings-row">
                  <span>Force Unit</span>
                  <select className="settings-select">
                    <option>kg</option>
                    <option>lbs</option>
                    <option>N</option>
                  </select>
                </div>
                <div className="settings-row">
                  <span>Time Unit</span>
                  <select className="settings-select">
                    <option>seconds</option>
                    <option>minutes</option>
                  </select>
                </div>
              </div>
              <div className="settings-section">
                <h4>Links</h4>
                <div className="settings-links">
                  <a href="#" className="settings-link">What's New</a>
                  <a href="#" className="settings-link">Credits</a>
                  <a href="#" className="settings-link">License</a>
                  <a href="#" className="settings-link">Store</a>
                  <a href="#" className="settings-link">Website</a>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
