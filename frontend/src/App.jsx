import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './utils/api' // Configure axios defaults
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import Settings from './pages/Settings'
import Analytics from './pages/Analytics'
import Landing from './pages/Landing'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

function AppContent() {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-muted">Initializing Mission Control...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Landing />;
  }

  return (
    <ErrorBoundary>
      <div className="App">
        <Navigation />
        <main style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          <div className="container">
            <Routes>
              <Route path="/" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/events" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Events />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Settings />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Analytics />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
