import React, { useState } from 'react'
import './SideDrawer.css'
import Icon from './Icon.jsx'

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
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="DISanalyse logo" width="46" height="46" style={{borderRadius:'var(--radius-md)',display:'block'}} />
            </div>
            <div>
              <div className="drawer-logo-name">DISanalyse</div>
              <div className="drawer-logo-sub">Design for Disassembly</div>
            </div>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close menu">
            <Icon name="close" size={18} />
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
              <Icon name="account_circle" size={28} />
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
                <Icon name="save" size={18} />
                Saved Analysis
              </button>
            )}
            <button className="drawer-nav-item" onClick={() => setActivePanel('learn')}>
              <Icon name="info" size={20} />
              Learn More
            </button>
            <button className="drawer-nav-item" onClick={() => setActivePanel('help')}>
              <Icon name="help" size={20} />
              Help &amp; Support
            </button>
            <button className="drawer-nav-item" onClick={() => setActivePanel('settings')}>
              <Icon name="settings" size={20} />
              Settings
            </button>
          </nav>
        )}

        {/* ── Saved Analysis Panel ── */}
        {activePanel === 'saved' && (
          <div className="drawer-panel">
            <div className="panel-back-hdr">
              <button className="panel-back-btn" onClick={() => setActivePanel('main')}>
                <Icon name="chevron_left" size={16} />
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
                <Icon name="chevron_left" size={16} />
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
                <Icon name="chevron_left" size={16} />
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
                  <Icon name="mail" size={16} />
                  support@disanalyse.com
                </div>
                <div className="help-contact-item">
                  <Icon name="language" size={16} />
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
                <Icon name="chevron_left" size={16} />
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
