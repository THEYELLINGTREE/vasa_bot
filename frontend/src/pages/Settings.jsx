import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Users, Shield, Clock, Save } from 'lucide-react'

function Settings() {
  const [settings, setSettings] = useState({
    allowEventCreation: true,
    requireManageServer: false,
    defaultReminderMinutes: 15,
    timezone: 'UTC'
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Settings
        </h1>
        <p className="text-muted">
          Configure bot permissions, reminders, and server preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* General Settings */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <SettingsIcon size={20} />
              General Settings
            </h2>
            <p className="card-description">Basic bot configuration options</p>
          </div>

          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">
                <input 
                  type="checkbox" 
                  checked={settings.allowEventCreation}
                  onChange={(e) => setSettings({...settings, allowEventCreation: e.target.checked})}
                  style={{ marginRight: '0.5rem' }}
                />
                Allow Event Creation
              </label>
              <p className="text-muted text-sm">When enabled, users can create events by default</p>
            </div>

            <div className="form-group">
              <label className="form-label">
                <input 
                  type="checkbox" 
                  checked={settings.requireManageServer}
                  onChange={(e) => setSettings({...settings, requireManageServer: e.target.checked})}
                  style={{ marginRight: '0.5rem' }}
                />
                Require "Manage Server" Permission
              </label>
              <p className="text-muted text-sm">Only users with Manage Server permission can use bot features</p>
            </div>

            <div className="form-group">
              <label className="form-label">Default Reminder Time (minutes)</label>
              <select 
                className="form-select"
                value={settings.defaultReminderMinutes}
                onChange={(e) => setSettings({...settings, defaultReminderMinutes: parseInt(e.target.value)})}
              >
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={1440}>24 hours</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Default Timezone</label>
              <input 
                type="text"
                className="form-input"
                value={settings.timezone}
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                placeholder="UTC, America/New_York, etc."
              />
            </div>
          </div>
        </div>

        {/* Permission Management */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <Shield size={20} />
              Permission Management
            </h2>
            <p className="card-description">Configure role and user-specific permissions</p>
          </div>

          <div className="space-y-4">
            <div className="alert alert-info" style={{ 
              padding: '1rem', 
              backgroundColor: '#dbeafe', 
              border: '1px solid #93c5fd', 
              borderRadius: '0.5rem' 
            }}>
              <p className="text-sm" style={{ color: '#1e40af', margin: 0 }}>
                <strong>Note:</strong> Use Discord slash commands to configure specific role and user permissions:
                <br />• <code>/settings role @role create_event true/false</code>
                <br />• <code>/settings user @user create_event true/false</code>
              </p>
            </div>

            <div className="text-muted text-sm">
              <h4 style={{ marginBottom: '0.5rem' }}>Permission Hierarchy:</h4>
              <ol style={{ paddingLeft: '1.5rem' }}>
                <li>Users with "Manage Server" permission (always allowed)</li>
                <li>User-specific permissions (highest priority)</li>
                <li>Role-specific permissions</li>
                <li>General server settings (lowest priority)</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Analytics & Monitoring */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <Clock size={20} />
              Reminders & Notifications
            </h2>
            <p className="card-description">Configure when and how reminders are sent</p>
          </div>

          <div className="space-y-4">
            <div className="text-muted text-sm">
              <h4 style={{ marginBottom: '0.5rem' }}>How Reminders Work:</h4>
              <ul style={{ paddingLeft: '1.5rem' }}>
                <li>Users who RSVP as "Attending" or "Maybe" receive DM reminders</li>
                <li>Channel reminders are posted publicly for all server members</li>
                <li>Reminders are sent once per event, at the configured time before the event starts</li>
                <li>Users can opt out of DM reminders in their Discord privacy settings</li>
              </ul>
            </div>

            <div className="form-group">
              <label className="form-label">Reminder Preview</label>
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <strong>🔔 Event Reminder</strong>
                <p style={{ margin: '0.5rem 0' }}>✅ You have an upcoming event in {settings.defaultReminderMinutes} minutes!</p>
                <p style={{ margin: 0, color: '#64748b' }}>📅 Sample Event Name</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6">
        <button 
          className="btn btn-primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              {saved ? 'Settings Saved!' : 'Save Settings'}
            </>
          )}
        </button>
        
        {saved && (
          <span className="text-green-600 text-sm ml-3">
            ✅ Settings saved successfully!
          </span>
        )}
      </div>
    </div>
  )
}

export default Settings