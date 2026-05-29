import { useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useMeals } from '../hooks/useMeals'
import TaskCard from '../components/TaskCard'
import { isTaskDueToday, getNextDueDate } from '../lib/taskUtils'
import './HomePage.css'

export default function HomePage() {
  const { tasks, loading, completeTask, uncompleteTask } = useTasks()
  const { plans } = useMeals()

  const today = new Date()
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const todayTasks = useMemo(() => {
    return tasks.filter(t => isTaskDueToday(t))
  }, [tasks])

  const todayDone = todayTasks.filter(t => {
    const todayStr = new Date().toISOString().split('T')[0]
    return t.completions?.some(c => c.completed_at === todayStr)
  })

  const progress = todayTasks.length > 0 ? Math.round((todayDone.length / todayTasks.length) * 100) : 0

  const todayStr = new Date().toISOString().split('T')[0]
  const tonightMeal = plans.find(p => p.date === todayStr && p.meal === 'dinner')
  const remainingTasks = todayTasks.length - todayDone.length

  if (loading) {
    return <div className="page-loading"><div className="spinner" /></div>
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-top">
          <div>
            <p className="home-date">{dateStr}</p>
            <h1 className="home-greeting">Bonjour 🏠</h1>
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
        <h2 className="section-title">Aujourd'hui</h2>
        {todayTasks.length === 0 ? (
          <div className="empty-state">
            <span>✨</span>
            <p>Rien à faire aujourd'hui, profite !</p>
          </div>
        ) : (
          <div className="task-list">
            {todayTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
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
