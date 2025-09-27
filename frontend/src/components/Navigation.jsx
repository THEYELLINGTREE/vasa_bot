import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Calendar, Settings, BarChart3, Rocket, LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="nav">
      <div className="container">
        <div className="nav-content">
          <NavLink to="/" className="nav-brand">
            <Rocket size={24} />
            <span>
              <span style={{ fontWeight: 800 }}>VASA</span>
              <span style={{ fontWeight: 400, opacity: 0.8 }}> Mission Control</span>
            </span>
          </NavLink>
          
          <div className="flex items-center space-x-6">
            <ul className="nav-links">
              <li>
                <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                  <Home size={16} />
                  Command Center
                </NavLink>
              </li>
              <li>
                <NavLink to="/events" className={({ isActive }) => isActive ? 'active' : ''}>
                  <Calendar size={16} />
                  Mission Events
                </NavLink>
              </li>
              <li>
                <NavLink to="/analytics" className={({ isActive }) => isActive ? 'active' : ''}>
                  <BarChart3 size={16} />
                  Telemetry
                </NavLink>
              </li>
              <li>
                <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                  <Settings size={16} />
                  Controls
                </NavLink>
              </li>
            </ul>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                {user?.avatar ? (
                  <img 
                    src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`}
                    alt={user.username}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User size={16} className="text-blue-600" />
                )}
                <span className="text-sm font-medium" style={{ color: 'var(--primary-700)' }}>
                  {user?.username || 'Astronaut'}
                </span>
              </div>
              
              <button
                onClick={logout}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Logout"
              >
                <LogOut size={16} />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation