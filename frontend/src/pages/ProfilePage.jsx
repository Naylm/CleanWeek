import { useState, useEffect } from 'react'
import { useProfile } from '../hooks/useProfile'
import { useTasks } from '../hooks/useTasks'
import { useCurrentUser } from '../hooks/useCurrentUser'
import './ProfilePage.css'

const COLORS = ['#6C63FF', '#FF6584', '#43D9B8', '#FFB347', '#74B9FF', '#A29BFE', '#FD79A8', '#55EFC4']

export default function ProfilePage() {
  const { user, logout } = useCurrentUser()
  
  // Guard : si pas d'utilisateur (après logout), ne rien rendre
  if (!user) return null

  const { profile, allProfiles } = useProfile(user.id)
  const { tasks } = useTasks(user.id)

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
          {partnerProfile && <StatCard label={partnerProfile.display_name} value={partnerCompletions} color={partnerProfile.avatar_color} />}
          <StatCard label="Total équipe" value={totalCompleted} color="#888" wide />
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
