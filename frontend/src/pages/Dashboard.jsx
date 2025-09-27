import React, { useState, useEffect, memo } from 'react'
import { Calendar, Users, Settings, Activity, Clock, CheckCircle } from 'lucide-react'
import axios from 'axios'

const Dashboard = memo(function Dashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalRSVPs: 0,
    botStatus: 'offline'
  })
  const [recentEvents, setRecentEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [healthResponse, eventsResponse] = await Promise.all([
        axios.get('/api/health'),
        axios.get('/api/events')
      ])

      setStats({
        totalEvents: eventsResponse.data.length,
        upcomingEvents: eventsResponse.data.filter(e => new Date(e.date_time) > new Date()).length,
        totalRSVPs: eventsResponse.data.reduce((sum, event) => sum + (event.rsvp_count || 0), 0),
        botStatus: healthResponse.data.bot_status
      })

      // Get recent events (last 5)
      setRecentEvents(
        eventsResponse.data
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
      )

      setError(null)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Error</h2>
          <p className="card-description">{error}</p>
        </div>
        <button className="btn btn-primary" onClick={fetchDashboardData}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Mission Command Center
        </h1>
        <p className="text-muted">
          Real-time mission status and operational telemetry for VASA Bot
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div style={{ padding: '0.75rem', backgroundColor: '#e0e7ff', borderRadius: '0.5rem' }}>
              <Calendar className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-muted text-sm">Mission Events</p>
              <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{stats.totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '0.5rem' }}>
              <Clock className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-muted text-sm">Scheduled Missions</p>
              <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{stats.upcomingEvents}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem' }}>
              <Users className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-muted text-sm">Crew Confirmations</p>
              <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{stats.totalRSVPs}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: stats.botStatus === 'online' ? '#dcfce7' : '#fee2e2', 
              borderRadius: '0.5rem' 
            }}>
              <Activity 
                className={stats.botStatus === 'online' ? 'text-green-600' : 'text-red-600'} 
                size={24} 
              />
            </div>
            <div>
              <p className="text-muted text-sm">System Status</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                {stats.botStatus === 'online' ? 'Operational' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Mission Logs</h2>
            <p className="card-description">Latest mission events from your space stations</p>
          </div>
          
          {recentEvents.length === 0 ? (
            <p className="text-muted">No events found</p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted">
                      {new Date(event.date_time).toLocaleDateString()} at{' '}
                      {new Date(event.date_time).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-info">
                      {event.rsvp_count || 0} RSVPs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Mission Controls</h2>
            <p className="card-description">Essential command operations</p>
          </div>
          
          <div className="space-y-3">
            <button 
              className="btn btn-primary w-full justify-start"
              onClick={() => window.open('/events', '_self')}
            >
              <Calendar size={16} />
              Mission Catalog
            </button>
            
            <button 
              className="btn btn-secondary w-full justify-start"
              onClick={() => window.open('/settings', '_self')}
            >
              <Settings size={16} />
              System Configuration
            </button>
            
            <button 
              className="btn btn-secondary w-full justify-start"
              onClick={() => window.open('/analytics', '_self')}
            >
              <Activity size={16} />
              View Analytics
            </button>
            
            <button 
              className="btn btn-success w-full justify-start"
              onClick={fetchDashboardData}
            >
              <CheckCircle size={16} />
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
});

export default Dashboard
