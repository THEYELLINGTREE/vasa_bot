import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Calendar, Settings, BarChart3, Bot } from 'lucide-react'

function Navigation() {
  return (
    <nav className="nav">
      <div className="container">
        <div className="nav-content">
          <NavLink to="/" className="nav-brand">
            <Bot size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Vasa Bot Management
          </NavLink>
          
          <ul className="nav-links">
            <li>
              <NavLink to="/" end>
                <Home size={16} />
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/events">
                <Calendar size={16} />
                Events
              </NavLink>
            </li>
            <li>
              <NavLink to="/analytics">
                <BarChart3 size={16} />
                Analytics
              </NavLink>
            </li>
            <li>
              <NavLink to="/settings">
                <Settings size={16} />
                Settings
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navigation