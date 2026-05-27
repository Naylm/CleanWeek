import { useCurrentUser } from '../hooks/useCurrentUser'
import './WhoAreYouPage.css'

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
          <button className="who-btn laura" onClick={() => selectUser('laura')}>
            <span className="who-avatar" style={{ background: '#FF6584' }}>L</span>
            <span className="who-name">Laura</span>
          </button>

          <button className="who-btn melvin" onClick={() => selectUser('melvin')}>
            <span className="who-avatar" style={{ background: '#6C63FF' }}>M</span>
            <span className="who-name">Melvin</span>
          </button>
        </div>
      </div>
    </div>
  )
}
