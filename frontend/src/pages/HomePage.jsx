import { useState, useMemo, useCallback } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useMeals } from '../hooks/useMeals'
import { useWeekSettings } from '../hooks/useWeekSettings'
import TaskCardSwipe, { sortTasksByUrgency } from '../components/TaskCardSwipe'
import { isTaskDueToday, getDaysSinceLastDone, getTaskIntervalDays, CATEGORIES } from '../lib/taskUtils'
import './HomePage.css'

const CATEGORY_FILTERS = [
  { value: 'all', label: 'Tout', icon: '🏠' },
  { value: 'cuisine', label: 'Cuisine', icon: '🍳' },
  { value: 'menage', label: 'Ménage', icon: '🧹' },
  { value: 'linge', label: 'Linge', icon: '👕' },
  { value: 'courses', label: 'Courses', icon: '🛒' },
  { value: 'animaux', label: 'Animaux', icon: '🐾' },
  { value: 'enfants', label: 'Enfants', icon: '👶' },
  { value: 'jardin', label: 'Jardin', icon: '🌱' },
  { value: 'autre', label: 'Autre', icon: '📦' },
]

export default function HomePage() {
  const { tasks, loading: tasksLoading, completeTask, snoozeTask } = useTasks()
  const [filterCategory, setFilterCategory] = useState('all')
  const { plans, loading: mealsLoading } = useMeals()
  const { settings, loading: settingsLoading, getPeriodLabel } = useWeekSettings()

  const referenceDate = useMemo(() => {
    if (!settings) return new Date()
    const today = new Date()
    const offset = settings.current_week_offset || 0
    const refDate = new Date(today)
    refDate.setDate(today.getDate() + (offset * 7))
    return refDate
  }, [settings])

  const dateStr = referenceDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayStr = referenceDate.toISOString().split('T')[0]

  const todayTasks = useMemo(() => {
    let dueTasks = tasks.filter(t => isTaskDueToday(t, referenceDate))
    if (filterCategory !== 'all') {
      dueTasks = dueTasks.filter(t => t.category === filterCategory)
    }
    return sortTasksByUrgency(dueTasks)
  }, [tasks, referenceDate, filterCategory])

  const upcomingTasks = useMemo(() => {
    const futureTasks = tasks.filter(t => {
      const doneToday = t.completions?.some(c => c.completed_at === todayStr)
      if (doneToday) return true
      const daysSince = getDaysSinceLastDone(t, referenceDate)
      const intervalDays = getTaskIntervalDays(t)
      return daysSince < intervalDays && !isTaskDueToday(t, referenceDate)
    })
    return sortTasksByUrgency(futureTasks).slice(0, 5)
  }, [tasks, referenceDate, todayStr])

  const todayDone = todayTasks.filter(t => t.completions?.some(c => c.completed_at === todayStr))
  const progress = todayTasks.length > 0 ? Math.round((todayDone.length / todayTasks.length) * 100) : 0

  const tonightMeal = plans.find(p => p.date === todayStr && p.meal === 'dinner')
  const remainingTasks = todayTasks.length - todayDone.length
  const isCurrentWeek = !settings || settings.current_week_offset === 0

  const handleSnooze = useCallback((taskId, days) => {
    snoozeTask(taskId, days)
  }, [snoozeTask])

  if (tasksLoading || mealsLoading || settingsLoading) {
    return <div className="page-loading"><div className="spinner" /></div>
  }

  // Jauge circulaire
  const R = 26
  const C = 2 * Math.PI * R
  const dash = C * (progress / 100)

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-top">
          <div>
            <p className="home-date">{dateStr}</p>
            <h1 className="home-greeting">{isCurrentWeek ? 'Bonjour' : `Semaine ${getPeriodLabel()}`}</h1>
          </div>
          <div className="home-mascot">🧺</div>
        </div>

        <div className="progress-card">
          <div className="progress-ring-wrap">
            <svg className="progress-ring" width="68" height="68" viewBox="0 0 68 68">
              <circle className="ring-bg" cx="34" cy="34" r={R} />
              <circle
                className="ring-fill"
                cx="34" cy="34" r={R}
                strokeDasharray={`${dash} ${C}`}
                transform="rotate(-90 34 34)"
              />
            </svg>
            <span className="progress-ring-pct">{progress}%</span>
          </div>
          <div className="progress-info">
            <span className="progress-title">
              {progress === 100 && todayTasks.length > 0 ? 'Tout est fait !' : 'On avance bien ?'}
            </span>
            <span className="progress-sub">
              {todayTasks.length === 0
                ? 'Rien de prévu aujourd\'hui'
                : `${todayDone.length} sur ${todayTasks.length} ${todayTasks.length > 1 ? 'tâches' : 'tâche'}`}
            </span>
          </div>
          {progress === 100 && todayTasks.length > 0 && <span className="progress-party">🎉</span>}
        </div>
      </header>

      {(tonightMeal || remainingTasks > 0) && (
        <div className="tonight-card">
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
      )}

      {/* Filtres par catégorie style Sweepy */}
      <div className="category-filters">
        <div className="filter-chips">
          {CATEGORY_FILTERS.map(cat => {
            const count = cat.value === 'all' 
              ? tasks.filter(t => isTaskDueToday(t, referenceDate)).length
              : tasks.filter(t => isTaskDueToday(t, referenceDate) && t.category === cat.value).length
            return (
              <button
                key={cat.value}
                className={`filter-chip ${filterCategory === cat.value ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat.value)}
              >
                <span className="chip-icon">{cat.icon}</span>
                <span className="chip-label">{cat.label}</span>
                {count > 0 && <span className="chip-count">{count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <section className="home-section">
        <h2 className="section-title">{isCurrentWeek ? "Aujourd'hui" : 'Cette période'}</h2>
        {todayTasks.length === 0 ? (
          <div className="empty-state">
            <span>✨</span>
            <p>Rien à faire, profite !</p>
          </div>
        ) : (
          <div className="task-list">
            {todayTasks.map(task => (
              <TaskCardSwipe key={task.id} task={task} onComplete={completeTask} onSnooze={handleSnooze} />
            ))}
          </div>
        )}
      </section>

      {upcomingTasks.length > 0 && (
        <section className="home-section">
          <h2 className="section-title">À venir</h2>
          <div className="task-list">
            {upcomingTasks.map(task => (
              <TaskCardSwipe key={task.id} task={task} onComplete={completeTask} onSnooze={handleSnooze} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
