import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import Settings from './pages/Settings'
import Analytics from './pages/Analytics'

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          <div className="container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  )
}

export default App