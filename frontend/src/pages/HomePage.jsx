import { useMemo, useCallback } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useMeals } from '../hooks/useMeals'
import { useWeekSettings } from '../hooks/useWeekSettings'
import TaskCardSwipe, { sortTasksByUrgency } from '../components/TaskCardSwipe'
import { isTaskDueToday, getDaysSinceLastDone, getTaskIntervalDays } from '../lib/taskUtils'
import './HomePage.css'

export default function HomePage() {
  const { tasks, loading: tasksLoading, completeTask, uncompleteTask } = useTasks()
  const { plans, loading: mealsLoading } = useMeals()
  const { settings, loading: settingsLoading, getPeriodLabel } = useWeekSettings()

  // Calculer la date de référence basée sur le décalage de semaine
  const referenceDate = useMemo(() => {
    if (!settings) return new Date()
    const today = new Date()
    const offset = settings.current_week_offset || 0
    const refDate = new Date(today)
    refDate.setDate(today.getDate() + (offset * 7))
    return refDate
  }, [settings])

  const dateStr = referenceDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  // Tâches du jour triées par urgence
  const todayTasks = useMemo(() => {
    const dueTasks = tasks.filter(t => isTaskDueToday(t, referenceDate))
    return sortTasksByUrgency(dueTasks)
  }, [tasks, referenceDate])

  // Tâches à venir triées par urgence
  const upcomingTasks = useMemo(() => {
    const futureTasks = tasks.filter(t => {
      const daysSince = getDaysSinceLastDone(t, referenceDate)
      const intervalDays = getTaskIntervalDays(t)
      return daysSince < intervalDays // Pas encore en retard
    })
    return sortTasksByUrgency(futureTasks).slice(0, 5)
  }, [tasks, referenceDate])

  const todayStr = referenceDate.toISOString().split('T')[0]
  const todayDone = todayTasks.filter(t => {
    return t.completions?.some(c => c.completed_at === todayStr)
  })

  const progress = todayTasks.length > 0 ? Math.round((todayDone.length / todayTasks.length) * 100) : 0

  const tonightMeal = plans.find(p => p.date === todayStr && p.meal === 'dinner')
  const remainingTasks = todayTasks.length - todayDone.length

  const isCurrentWeek = !settings || settings.current_week_offset === 0

  // Handler pour reporter une tâche
  const handleSnooze = useCallback((taskId, days) => {
    // Créer une fausse completion avec une date future pour "reporter"
    // Ou utiliser une logique personnalisée
    console.log(`Task ${taskId} snoozed for ${days} days`)
  }, [])

  if (tasksLoading || mealsLoading || settingsLoading) {
    return <div className="page-loading"><div className="spinner" /></div>
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-top">
          <div>
            <p className="home-date">{dateStr}</p>
            <h1 className="home-greeting">{isCurrentWeek ? "Bonjour 🏠" : `Semaine ${getPeriodLabel()} 🏠`}</h1>
          </div>
          <div className="home-mascot">🐱</div>
        </div>

        <div className="progress-card">
          <div className="progress-header">
            <span>On avance bien ?</span>
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

      <section className="home-section">
        <h2 className="section-title">{isCurrentWeek ? "Aujourd'hui" : "Cette période"}</h2>
        {todayTasks.length === 0 ? (
          <div className="empty-state">
            <span>✨</span>
            <p>Rien à faire, profite !</p>
          </div>
        ) : (
          <div className="task-list-swipe">
            {todayTasks.map(task => (
              <TaskCardSwipe
                key={task.id}
                task={task}
                onComplete={completeTask}
                onSnooze={handleSnooze}
              />
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <h2 className="section-title">À venir</h2>
        <div className="task-list-swipe">
          {upcomingTasks.map(task => (
            <TaskCardSwipe
              key={task.id}
              task={task}
              onComplete={completeTask}
              onSnooze={handleSnooze}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
