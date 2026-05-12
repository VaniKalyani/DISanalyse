import React from 'react'
import { useStore } from '../hooks/useStore.js'
import './TopBar.css'

const STEPS = [
  { key: 'upload',     num: 1, label: 'Upload' },
  { key: 'model',      num: 2, label: 'Model' },
  { key: 'interfaces', num: 3, label: 'Interfaces' },
  { key: 'visualize',  num: 4, label: 'Analyse' },
]

export default function TopBar({ onMenuOpen }) {
  const { step, setStep, parts, interfaces } = useStore()

  const stepIdx = STEPS.findIndex(s => s.key === step)

  const canNav = (key) => {
    const idx = STEPS.findIndex(s => s.key === key)
    if (idx <= stepIdx) return true
    if (idx === 1) return true
    if (idx === 2) return parts.length >= 1
    if (idx === 3) return interfaces.length > 0
    return false
  }

  const getStepState = (s, i) => {
    if (i < stepIdx) return 'done'
    if (i === stepIdx) return 'active'
    return 'pending'
  }

  return (
    <header className="topbar">
      {/* Hamburger + Logo grouped on the left */}
      <div className="topbar-left">
        <button className="topbar-hamburger" onClick={onMenuOpen} aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 -960 960 960" fill="currentColor">
            <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
          </svg>
        </button>

        <button className="topbar-logo" onClick={() => setStep('upload')} title="Go to home">
          <div className="logo-icon">
            <img src="/logo.png" alt="DISanalyse logo" width="46" height="46" style={{borderRadius:'var(--radius-md)',display:'block'}} />
          </div>
          <div>
            <div className="logo-name">DISanalyse</div>
            <div className="logo-sub">Design for Disassembly</div>
          </div>
        </button>
      </div>

      {/* Step indicators */}
      <nav className="topbar-steps">
        {STEPS.map((s, i) => {
          const state = getStepState(s, i)
          return (
            <React.Fragment key={s.key}>
              <button
                className={`step-item ${state}`}
                onClick={() => canNav(s.key) && setStep(s.key)}
                disabled={!canNav(s.key)}
              >
                <div className="step-circle">
                  {state === 'done'
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    : s.num
                  }
                </div>
                <span className="step-label">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`step-line ${i < stepIdx ? 'done' : ''}`} />
              )}
            </React.Fragment>
          )
        })}
      </nav>
    </header>
  )
}
