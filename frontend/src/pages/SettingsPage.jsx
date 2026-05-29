import { useCurrentUser } from '../hooks/useCurrentUser'
import './SettingsPage.css'

export default function SettingsPage() {
  const { logout } = useCurrentUser()

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Réglages</h1>
        <div className="settings-mascot">🐱</div>
      </header>

      <div className="settings-card">
        <h2 className="settings-section-title">À propos</h2>
        <p className="settings-text">
          CleanWeek — l'application pour gérer la maison ensemble, tout en douceur.
        </p>
      </div>

      <div className="settings-card">
        <button className="settings-logout" onClick={logout}>
          <span>🚪</span>
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  )
}
