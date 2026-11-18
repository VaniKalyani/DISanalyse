import React, { useState } from 'react'
import { useStore } from './hooks/useStore.js'
import TopBar from './components/TopBar.jsx'
import SideDrawer from './components/SideDrawer.jsx'
import UploadPage from './pages/UploadPage.jsx'
import ModelPage from './pages/ModelPage.jsx'
import InterfacesPage from './pages/InterfacesPage.jsx'
import VisualizePage from './pages/VisualizePage.jsx'
import './styles/app.css'

export default function App() {
  const step = useStore(s => s.step)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activePanel, setActivePanel] = useState('main')

  const openMenu = () => { setDrawerOpen(true); setActivePanel('main') }
  const closeMenu = () => setDrawerOpen(false)

  return (
    <div className="app-shell">
      <SideDrawer
        open={drawerOpen}
        onClose={closeMenu}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
      />
      <TopBar onMenuOpen={openMenu} />
      <main className="app-content">
        {step === 'upload'     && <UploadPage />}
        {step === 'model'      && <ModelPage />}
        {step === 'interfaces' && <InterfacesPage />}
        {step === 'visualize'  && <VisualizePage />}
      </main>
    </div>
  )
}
