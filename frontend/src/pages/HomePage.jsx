import { useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useProfile } from '../hooks/useProfile'
import { useCurrentUser } from '../hooks/useCurrentUser'
import TaskCard from '../components/TaskCard'
import { isTaskDueToday, getNextDueDate } from '../lib/taskUtils'
import './HomePage.css'

export default function HomePage() {
  const { user } = useCurrentUser()
  const { tasks, loading, isOffline: tasksOffline, completeTask, uncompleteTask } = useTasks(user?.id)
  const { profile, allProfiles, isOffline: profilesOffline } = useProfile(user?.id)
  
  const isOffline = tasksOffline || profilesOffline
  
  if (isOffline) {
    console.log('🔍 DEBUG: Application en mode dégradé (hors ligne)')
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const todayTasks = useMemo(() => {
    if (!user) return []
    return tasks.filter(t => {
      if (t.assigned_to && t.assigned_to !== user.id && t.assigned_to !== 'both') return false
      return isTaskDueToday(t)
    })
  }, [tasks, user?.id])

  const todayDone = todayTasks.filter(t => {
    const todayStr = new Date().toISOString().split('T')[0]
    return t.completions?.some(c => c.completed_at === todayStr)
  })

  const progress = todayTasks.length > 0 ? Math.round((todayDone.length / todayTasks.length) * 100) : 0

  const partnerProfile = user ? allProfiles.find(p => p.id !== user.id) : null

  if (!user) {
    console.log('🔍 DEBUG: HomePage rendering without user, showing loading')
    return <div className="page-loading"><div className="spinner" /></div>
  }

  if (loading) {
    return <div className="page-loading"><div className="spinner" /></div>
  }

  return (
    <div className="home-page">
      {isOffline && (
        <div style={{
          background: '#ff9800',
          color: 'white',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          📱 Mode dégradé : Application fonctionnant hors ligne
        </div>
      )}
      <header className="home-header">
        <div className="home-header-top">
          <div>
            <p className="home-date">{dateStr}</p>
            <h1 className="home-greeting">
              Bonjour, {profile?.display_name || 'toi'} 👋
            </h1>
          </div>
          <div className="home-duo">
            <Avatar profile={profile} size={38} />
            {partnerProfile && <Avatar profile={partnerProfile} size={38} offset />}
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-header">
            <span>Tâches du jour</span>
            <span className="progress-count">{todayDone.length}/{todayTasks.length}</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          {progress === 100 && todayTasks.length > 0 && (
            <p className="progress-done">Tout est fait ! Bravo 🎉</p>
          )}
        </div>
      </header>

      <section className="home-section">
        <h2 className="section-title">À faire aujourd'hui</h2>
        {todayTasks.length === 0 ? (
          <div className="empty-state">
            <span>✨</span>
            <p>Aucune tâche pour aujourd'hui !</p>
          </div>
        ) : (
          <div className="task-list">
            {todayTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                userId={user.id}
                allProfiles={allProfiles}
                onComplete={completeTask}
                onUncomplete={uncompleteTask}
              />
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <h2 className="section-title">À venir</h2>
        <div className="task-list">
          {tasks
            .filter(t => !isTaskDueToday(t) && getNextDueDate(t) > today)
            .sort((a, b) => getNextDueDate(a) - getNextDueDate(b))
            .slice(0, 5)
            .map(task => (
              <TaskCard
                key={task.id}
                task={task}
                userId={user.id}
                allProfiles={allProfiles}
                onComplete={completeTask}
                onUncomplete={uncompleteTask}
                upcoming
              />
            ))}
        </div>
      </section>
    </div>
  )
}

function Avatar({ profile, size = 36, offset = false }) {
  const initials = profile?.display_name?.slice(0, 1)?.toUpperCase() || '?'
  const color = profile?.avatar_color || '#6C63FF'
  return (
    <div
      className={`avatar${offset ? ' avatar-offset' : ''}`}
      style={{ width: size, height: size, background: color, marginLeft: offset ? -10 : 0 }}
    >
      {initials}
    </div>
  )
}
