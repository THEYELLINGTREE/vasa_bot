import React, { useState, useEffect } from 'react'
import { Calendar, Users, MapPin, Clock, Edit, Trash2, Plus, Eye } from 'lucide-react'
import axios from 'axios'

function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, upcoming, past

  useEffect(() => {
    fetchEvents()
  }, [filter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const upcomingParam = filter === 'upcoming' ? 'true' : 'false'
      const response = await axios.get(`/api/events?upcoming=${upcomingParam}&limit=50`)
      
      let filteredEvents = response.data
      if (filter === 'past') {
        filteredEvents = response.data.filter(event => new Date(event.date_time) <= new Date())
      }
      
      setEvents(filteredEvents)
      setError(null)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`/api/events/${eventId}`)
      await fetchEvents() // Refresh the list
    } catch (err) {
      console.error('Error deleting event:', err)
      alert('Failed to delete event')
    }
  }

  const getStatusBadge = (event) => {
    const eventDate = new Date(event.date_time)
    const now = new Date()
    
    if (eventDate < now) {
      return <span className="badge badge-secondary">Past</span>
    } else if (eventDate - now < 24 * 60 * 60 * 1000) {
      return <span className="badge badge-warning">Soon</span>
    } else {
      return <span className="badge badge-success">Upcoming</span>
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading events...
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
        <button className="btn btn-primary" onClick={fetchEvents}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Events
          </h1>
          <p className="text-muted">
            Manage Discord events and view RSVP data
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} />
          Create Event
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button 
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
        >
          All Events
        </button>
        <button 
          className={`btn ${filter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button 
          className={`btn ${filter === 'past' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('past')}
        >
          Past
        </button>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="card text-center">
          <Calendar size={48} style={{ margin: '0 auto 1rem', color: '#64748b' }} />
          <h3 className="card-title">No Events Found</h3>
          <p className="card-description mb-4">
            {filter === 'upcoming' ? 'No upcoming events scheduled.' : 
             filter === 'past' ? 'No past events found.' : 
             'No events have been created yet.'}
          </p>
          <button className="btn btn-primary">
            <Plus size={16} />
            Create Your First Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {events.map((event) => (
            <div key={event.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="card-title" style={{ margin: 0 }}>{event.title}</h3>
                    {getStatusBadge(event)}
                  </div>
                  
                  {event.description && (
                    <p className="text-muted mb-3">{event.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted">
                      <Clock size={16} />
                      <span>
                        {new Date(event.date_time).toLocaleDateString()} at{' '}
                        {new Date(event.date_time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2 text-muted">
                        <MapPin size={16} />
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-muted">
                      <Users size={16} />
                      <span>
                        {event.attending_count || 0} attending, {event.maybe_count || 0} maybe
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted">
                      <Calendar size={16} />
                      <span>ID: {event.id}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button 
                    className="btn btn-secondary btn-sm"
                    title="View Details"
                  >
                    <Eye size={14} />
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    title="Edit Event"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteEvent(event.id)}
                    title="Delete Event"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              {/* RSVP Summary */}
              {event.rsvp_count > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Total RSVPs: {event.rsvp_count}</span>
                    <div className="flex gap-4">
                      <span className="text-green-600">✅ {event.attending_count || 0}</span>
                      <span className="text-yellow-600">❓ {event.maybe_count || 0}</span>
                      <span className="text-red-600">❌ {event.not_attending_count || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Events