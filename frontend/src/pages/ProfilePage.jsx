import { useState, useEffect } from 'react'
import { useProfile } from '../hooks/useProfile'
import { useTasks } from '../hooks/useTasks'
import { useCurrentUser } from '../hooks/useCurrentUser'
import './ProfilePage.css'

const COLORS = ['#6C63FF', '#FF6584', '#43D9B8', '#FFB347', '#74B9FF', '#A29BFE', '#FD79A8', '#55EFC4']

export default function ProfilePage() {
  const { user, logout } = useCurrentUser()
  const { profile, allProfiles, updateProfile } = useProfile(user.id)
  const { tasks } = useTasks(user.id)
  const [displayName, setDisplayName] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setSelectedColor(profile.avatar_color || COLORS[0])
    }
  }, [profile])

  useEffect(() => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted')
    }
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await updateProfile({ display_name: displayName, avatar_color: selectedColor })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handlePushToggle() {
    if (pushEnabled) return
    setPushLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready
          const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
          })
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: sub, userId: user.id }),
          })
          setPushEnabled(true)
        }
      }
    } catch (err) {
      console.error('Push error:', err)
    }
    setPushLoading(false)
  }

  const totalCompleted = tasks.reduce((acc, t) => acc + (t.completions?.length || 0), 0)
  const myCompletions = tasks.reduce((acc, t) => {
    return acc + (t.completions?.filter(c => c.completed_by === user.id).length || 0)
  }, 0)
  const partnerProfile = allProfiles.find(p => p.id !== user.id)
  const partnerCompletions = tasks.reduce((acc, t) => {
    return acc + (t.completions?.filter(c => c.completed_by !== user.id).length || 0)
  }, 0)

  if (!profile) return <div className="page-loading"><div className="spinner" /></div>

  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1>Profil</h1>
      </header>

      <div className="duo-section">
        <ProfileBubble profile={profile} isMe />
        {partnerProfile && <ProfileBubble profile={partnerProfile} />}
      </div>

      <section className="stats-section">
        <h2 className="section-title">Statistiques</h2>
        <div className="stats-grid">
          <StatCard label="Mes complétions" value={myCompletions} color={profile.avatar_color} />
          {partnerProfile && <StatCard label={`${partnerProfile.display_name}`} value={partnerCompletions} color={partnerProfile.avatar_color} />}
          <StatCard label="Total équipe" value={totalCompleted} color="#888" wide />
        </div>
      </section>

      <section className="profile-form-section">
        <h2 className="section-title">Mon profil</h2>
        <form className="profile-form" onSubmit={handleSave}>
          <div className="field">
            <label>Prénom</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Ton prénom"
              required
            />
          </div>

          <div className="field">
            <label>Couleur</label>
            <div className="color-grid">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-dot${selectedColor === color ? ' active' : ''}`}
                  style={{ background: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <span className="btn-spinner" /> : saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
          </button>
        </form>
      </section>

      <section className="notif-section">
        <h2 className="section-title">Notifications</h2>
        <div className="notif-card">
          <div className="notif-info">
            <p className="notif-label">Rappels de tâches</p>
            <p className="notif-desc">Reçois une notification chaque matin pour les tâches du jour</p>
          </div>
          <button
            className={`toggle-btn${pushEnabled ? ' enabled' : ''}`}
            onClick={handlePushToggle}
            disabled={pushEnabled || pushLoading}
          >
            {pushLoading ? <span className="btn-spinner small" /> : pushEnabled ? 'Activé' : 'Activer'}
          </button>
        </div>
      </section>

      <section className="logout-section">
        <button className="btn-logout" onClick={logout}>
          Changer de profil
        </button>
      </section>
    </div>
  )
}

function ProfileBubble({ profile, isMe = false }) {
  return (
    <div className="profile-bubble">
      <div className="profile-avatar-lg" style={{ background: profile.avatar_color }}>
        {profile.display_name?.slice(0, 1)?.toUpperCase() || '?'}
      </div>
      <p className="profile-bubble-name">{profile.display_name || 'Inconnu'}</p>
      {isMe && <span className="profile-me-badge">Moi</span>}
    </div>
  )
}

function StatCard({ label, value, color, wide = false }) {
  return (
    <div className={`stat-card${wide ? ' wide' : ''}`} style={{ borderColor: `${color}33` }}>
      <p className="stat-value" style={{ color }}>{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  )
}
