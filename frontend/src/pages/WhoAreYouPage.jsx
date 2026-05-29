import { useCurrentUser } from '../hooks/useCurrentUser'
import './WhoAreYouPage.css'

const PROFILES = [
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', display_name: 'Laura', avatar_color: '#FF6584' },
  { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', display_name: 'Melvin', avatar_color: '#6C63FF' },
]

export default function WhoAreYouPage() {
  const { selectUser } = useCurrentUser()

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
          {PROFILES.map(profile => (
            <button
              key={profile.id}
              className="who-btn"
              style={{ '--profile-color': profile.avatar_color }}
              onClick={() => selectUser(profile.id)}
            >
              <span className="who-avatar" style={{ background: profile.avatar_color }}>
                {profile.display_name.slice(0, 1)}
              </span>
              <span className="who-name">{profile.display_name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
