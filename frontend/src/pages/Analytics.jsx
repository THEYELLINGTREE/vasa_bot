import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Calendar, Clock, Activity } from 'lucide-react'

function Analytics() {
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    totalRSVPs: 0,
    averageAttendance: 0,
    popularEventTypes: [],
    eventsByMonth: [],
    rsvpTrends: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d') // 7d, 30d, 90d, 1y

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setAnalytics({
        totalEvents: 47,
        totalRSVPs: 234,
        averageAttendance: 4.98,
        popularEventTypes: [
          { name: 'Gaming Sessions', count: 15, percentage: 32 },
          { name: 'Community Meetings', count: 12, percentage: 26 },
          { name: 'Movie Nights', count: 10, percentage: 21 },
          { name: 'Study Groups', count: 7, percentage: 15 },
          { name: 'Other', count: 3, percentage: 6 }
        ],
        eventsByMonth: [
          { month: 'Jan', events: 3, rsvps: 18 },
          { month: 'Feb', events: 5, rsvps: 29 },
          { month: 'Mar', events: 8, rsvps: 42 },
          { month: 'Apr', events: 6, rsvps: 35 },
          { month: 'May', events: 9, rsvps: 51 },
          { month: 'Jun', events: 7, rsvps: 38 },
          { month: 'Jul', events: 9, rsvps: 21 }
        ],
        rsvpTrends: {
          attending: 68,
          maybe: 22,
          notAttending: 10
        }
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading analytics...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Analytics
          </h1>
          <p className="text-muted">
            Insights and statistics about your Discord events
          </p>
        </div>
        
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map(range => (
            <button
              key={range}
              className={`btn btn-sm ${timeRange === range ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7 days' : 
               range === '30d' ? '30 days' :
               range === '90d' ? '90 days' : '1 year'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div style={{ padding: '0.75rem', backgroundColor: '#e0e7ff', borderRadius: '0.5rem' }}>
              <Calendar size={24} style={{ color: '#4f46e5' }} />
            </div>
            <div>
              <p className="text-muted text-sm">Total Events</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{analytics.totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '0.5rem' }}>
              <Users size={24} style={{ color: '#059669' }} />
            </div>
            <div>
              <p className="text-muted text-sm">Total RSVPs</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{analytics.totalRSVPs}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem' }}>
              <TrendingUp size={24} style={{ color: '#d97706' }} />
            </div>
            <div>
              <p className="text-muted text-sm">Avg. Attendance</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{analytics.averageAttendance}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem' }}>
              <Activity size={24} style={{ color: '#dc2626' }} />
            </div>
            <div>
              <p className="text-muted text-sm">Response Rate</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {Math.round((analytics.rsvpTrends.attending + analytics.rsvpTrends.maybe) / 
                (analytics.rsvpTrends.attending + analytics.rsvpTrends.maybe + analytics.rsvpTrends.notAttending) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Events Over Time */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Events Over Time</h2>
            <p className="card-description">Monthly event creation and RSVP trends</p>
          </div>
          
          <div style={{ height: '300px', display: 'flex', alignItems: 'end', gap: '1rem', padding: '1rem 0' }}>
            {analytics.eventsByMonth.map((month, index) => (
              <div key={month.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'end', gap: '4px', marginBottom: '0.5rem' }}>
                  <div 
                    style={{ 
                      width: '20px', 
                      height: `${month.events * 10}px`, 
                      backgroundColor: '#5865f2',
                      borderRadius: '2px'
                    }}
                  ></div>
                  <div 
                    style={{ 
                      width: '20px', 
                      height: `${month.rsvps * 2}px`, 
                      backgroundColor: '#10b981',
                      borderRadius: '2px'
                    }}
                  ></div>
                </div>
                <span className="text-xs text-muted">{month.month}</span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div style={{ width: '12px', height: '12px', backgroundColor: '#5865f2', borderRadius: '2px' }}></div>
              <span className="text-sm text-muted">Events</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
              <span className="text-sm text-muted">RSVPs</span>
            </div>
          </div>
        </div>

        {/* RSVP Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">RSVP Distribution</h2>
            <p className="card-description">How users typically respond to events</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                <span>Attending</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ 
                  width: '100px', 
                  height: '8px', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${analytics.rsvpTrends.attending}%`, 
                    height: '100%', 
                    backgroundColor: '#10b981' 
                  }}></div>
                </div>
                <span className="text-sm font-medium">{analytics.rsvpTrends.attending}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '50%' }}></div>
                <span>Maybe</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ 
                  width: '100px', 
                  height: '8px', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${analytics.rsvpTrends.maybe}%`, 
                    height: '100%', 
                    backgroundColor: '#f59e0b' 
                  }}></div>
                </div>
                <span className="text-sm font-medium">{analytics.rsvpTrends.maybe}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%' }}></div>
                <span>Not Attending</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ 
                  width: '100px', 
                  height: '8px', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${analytics.rsvpTrends.notAttending}%`, 
                    height: '100%', 
                    backgroundColor: '#ef4444' 
                  }}></div>
                </div>
                <span className="text-sm font-medium">{analytics.rsvpTrends.notAttending}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Event Types */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Popular Event Types</h2>
            <p className="card-description">Most common event categories</p>
          </div>
          
          <div className="space-y-3">
            {analytics.popularEventTypes.map((type, index) => (
              <div key={type.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted">#{index + 1}</span>
                  <span>{type.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted">{type.count} events</span>
                  <span className="badge badge-info">{type.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Insights */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Insights</h2>
            <p className="card-description">Key takeaways from your data</p>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                <strong>Great engagement!</strong> Your events have a {Math.round((analytics.rsvpTrends.attending + analytics.rsvpTrends.maybe) / 
                (analytics.rsvpTrends.attending + analytics.rsvpTrends.maybe + analytics.rsvpTrends.notAttending) * 100)}% response rate.
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Most popular:</strong> {analytics.popularEventTypes[0]?.name} events get the most attendance.
              </p>
            </div>
            
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Tip:</strong> Events with 15-minute reminders typically see higher attendance rates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics