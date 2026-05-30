import { useCurrentUser } from '../hooks/useCurrentUser'
import { useWeekSettings } from '../hooks/useWeekSettings'
import { DAYS_OF_WEEK } from '../lib/taskUtils'
import './SettingsPage.css'

const THEMES = [
  { key: 'rose', label: 'Rose', color: '#FFB7B2', preview: '🌸' },
  { key: 'bleu', label: 'Bleu', color: '#A0C4FF', preview: '🦋' },
  { key: 'vert', label: 'Vert', color: '#98D8C8', preview: '🌿' },
  { key: 'jaune', label: 'Jaune', color: '#FFD97D', preview: '🌻' },
  { key: 'lavande', label: 'Lavande', color: '#C9B1FF', preview: '💜' },
]

export default function SettingsPage() {
  const { logout, theme, setTheme } = useCurrentUser()
  const { settings, loading, setStartDayOfWeek, goToCurrentWeek } = useWeekSettings()

  const startDay = settings?.start_day_of_week ?? 5

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Réglages</h1>
        <div className="settings-mascot">🐱</div>
      </header>

      <div className="settings-card">
        <h2 className="settings-section-title">Semaine</h2>
        <p className="settings-hint">Choisis le jour de début de ta semaine</p>
        <div className="settings-days">
          {loading ? (
            <span>Chargement...</span>
          ) : (
            DAYS_OF_WEEK.map(day => (
              <button
                key={day.value}
                className={`settings-day-btn${startDay === day.value ? ' active' : ''}`}
                onClick={() => setStartDayOfWeek(day.value)}
              >
                {day.label}
              </button>
            ))
          )}
        </div>
        <button className="settings-current-week" onClick={goToCurrentWeek}>
          Retour à la semaine en cours
        </button>
      </div>

      <div className="settings-card">
        <h2 className="settings-section-title">Thème</h2>
        <div className="settings-themes">
          {THEMES.map(t => (
            <button
              key={t.key}
              className={`settings-theme-btn${theme === t.key ? ' active' : ''}`}
              onClick={() => setTheme(t.key)}
              style={{ '--theme-color': t.color }}
            >
              <span className="theme-preview" style={{ background: t.color }}>{t.preview}</span>
              <span className="theme-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

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
