import { useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useProfile } from '../hooks/useProfile'
import { useMeals } from '../hooks/useMeals'
import { useCurrentUser } from '../hooks/useCurrentUser'
import TaskCard from '../components/TaskCard'
import { isTaskDueToday, getNextDueDate } from '../lib/taskUtils'
import './HomePage.css'

export default function HomePage() {
  const { user } = useCurrentUser()
  const { tasks, loading, completeTask, uncompleteTask, react, unreact } = useTasks(user.id)
  const { profile, allProfiles } = useProfile(user.id)
  const { plans, loading: loadingMeals } = useMeals()

  const today = new Date()
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const partnerProfile = allProfiles.find(p => p.id !== user.id)

  const myTasks = useMemo(() => {
    return tasks.filter(t => {
      const mine = t.assigned_to === user.id || t.assigned_to === 'both' || !t.assigned_to
      return mine && isTaskDueToday(t)
    })
  }, [tasks, user.id])

  const partnerTasks = useMemo(() => {
    return tasks.filter(t => {
      const theirs = t.assigned_to === partnerProfile?.id || t.assigned_to === 'both' || !t.assigned_to
      return theirs && isTaskDueToday(t)
    })
  }, [tasks, partnerProfile])

  const allToday = [...new Set([...myTasks, ...partnerTasks].map(t => t.id))]
    .map(id => tasks.find(t => t.id === id))

  const todayDone = allToday.filter(t => {
    const todayStr = new Date().toISOString().split('T')[0]
    return t.completions?.some(c => c.completed_at === todayStr)
  })

  const progress = allToday.length > 0 ? Math.round((todayDone.length / allToday.length) * 100) : 0

  const todayStr = new Date().toISOString().split('T')[0]
  const tonightMeal = plans.find(p => p.date === todayStr && p.meal === 'dinner')
  const remainingTasks = allToday.length - todayDone.length

  if (loading || loadingMeals) {
    return <div className="page-loading"><div className="spinner" /></div>
  }

  return (
    <div className="home-page">
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
            <span>On avance bien ?</span>
            <span className="progress-count">{todayDone.length}/{allToday.length}</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          {progress === 100 && allToday.length > 0 && (
            <p className="progress-done">Belle équipe aujourd'hui 🔥</p>
          )}
        </div>
      </header>

      {(tonightMeal || remainingTasks > 0) && (
        <div className="tonight-card">
          <div className="tonight-row">
            {tonightMeal && (
              <div className="tonight-meal">
                <span className="tonight-label">Ce soir 🍽️</span>
                <span className="tonight-content">{tonightMeal.content}</span>
                {tonightMeal.notes && <span className="tonight-notes">{tonightMeal.notes}</span>}
              </div>
            )}
            {remainingTasks > 0 && (
              <div className="tonight-tasks">
                <span className="tonight-label">Reste à faire</span>
                <span className="tonight-count">{remainingTasks} tâche{remainingTasks > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="home-columns">
        <section className="home-column">
          <h2 className="section-title" style={{ color: profile?.avatar_color || '#6C63FF' }}>
            Mes tâches
          </h2>
          {myTasks.length === 0 ? (
            <div className="empty-state">
              <span>✨</span>
              <p>Rien pour toi aujourd'hui, profite !</p>
            </div>
          ) : (
            <div className="task-list">
              {myTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  userId={user.id}
                  allProfiles={allProfiles}
                  onComplete={completeTask}
                  onUncomplete={uncompleteTask}
                  onReact={react}
                  onUnreact={unreact}
                />
              ))}
            </div>
          )}
        </section>

        <section className="home-column">
          <h2 className="section-title" style={{ color: partnerProfile?.avatar_color || '#FF6584' }}>
            Tâches de {partnerProfile?.display_name || 'mon/ma partenaire'}
          </h2>
          {partnerTasks.length === 0 ? (
            <div className="empty-state">
              <span>☕</span>
              <p>Rien de son côté aujourd'hui</p>
            </div>
          ) : (
            <div className="task-list">
              {partnerTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  userId={user.id}
                  allProfiles={allProfiles}
                  onComplete={completeTask}
                  onUncomplete={uncompleteTask}
                  onReact={react}
                  onUnreact={unreact}
                />
              ))}
            </div>
          )}
        </section>
      </div>

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
