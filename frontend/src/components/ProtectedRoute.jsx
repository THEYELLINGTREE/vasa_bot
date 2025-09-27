import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-muted">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    // This component won't actually render because App.jsx will handle the routing
    // But we include this as a fallback
    return null;
  }

  return children;
}

export default ProtectedRoute;