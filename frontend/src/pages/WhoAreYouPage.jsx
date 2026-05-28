import { useState, useEffect } from 'react'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { api } from '../lib/api'
import './WhoAreYouPage.css'

export default function WhoAreYouPage() {
  const { selectUser } = useCurrentUser()
  const [profiles, setProfiles] = useState([])

  useEffect(() => {
    api.get('/profiles').then(setProfiles).catch(() => {})
  }, [])

  return (
    <div className="who-page">
      <div className="who-bg" />
      <div className="who-card">
        <div className="who-logo">
          <span className="who-logo-icon">🧹</span>
          <h1>CleanWeek</h1>
          <p>Qui es-tu aujourd'hui ?</p>
        </div>

        <div className="who-buttons">
          {profiles.map(profile => (
            <button
              key={profile.id}
              className="who-btn"
              style={{ '--profile-color': profile.avatar_color }}
              onClick={() => selectUser(profile.id)}
            >
              <span className="who-avatar" style={{ background: profile.avatar_color }}>
                {profile.display_name?.slice(0, 1)?.toUpperCase()}
              </span>
              <span className="who-name">{profile.display_name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
