import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useProfile } from '../hooks/useProfile'
import { useCurrentUser } from '../hooks/useCurrentUser'
import TaskCard from '../components/TaskCard'
import AddTaskModal from '../components/AddTaskModal'
import { CATEGORIES } from '../lib/taskUtils'
import './TasksPage.css'

export default function TasksPage() {
  const { user } = useCurrentUser()
  const { tasks, loading, completeTask, uncompleteTask, addTask, deleteTask } = useTasks(user.id)
  const { allProfiles } = useProfile(user.id)
  const [showAdd, setShowAdd] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('all')

  const filtered = tasks.filter(t => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false
    if (filterAssignee !== 'all' && t.assigned_to !== filterAssignee && t.assigned_to !== 'both') return false
    return true
  })

  if (loading) {
    return <div className="page-loading"><div className="spinner" /></div>
  }

  return (
    <div className="tasks-page">
      <header className="tasks-header">
        <h1>Toutes les tâches</h1>
        <button className="btn-add" onClick={() => setShowAdd(true)} aria-label="Ajouter une tâche">
          <span>+</span>
        </button>
      </header>

      <div className="filters">
        <div className="filter-row">
          <button
            className={`filter-chip${filterCategory === 'all' ? ' active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            Tout
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              className={`filter-chip${filterCategory === cat.value ? ' active' : ''}`}
              onClick={() => setFilterCategory(cat.value)}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div className="filter-row filter-assignee-row">
          <button
            className={`filter-chip${filterAssignee === 'all' ? ' active' : ''}`}
            onClick={() => setFilterAssignee('all')}
          >
            Tous
          </button>
          {allProfiles.map(p => (
            <button
              key={p.id}
              className={`filter-chip${filterAssignee === p.id ? ' active' : ''}`}
              style={filterAssignee === p.id ? { borderColor: p.avatar_color, color: p.avatar_color } : {}}
              onClick={() => setFilterAssignee(p.id)}
            >
              {p.display_name}
            </button>
          ))}
        </div>
      </div>

      <div className="tasks-list-section">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span>📋</span>
            <p>Aucune tâche ici</p>
            <button className="btn-primary-sm" onClick={() => setShowAdd(true)}>+ Ajouter</button>
          </div>
        ) : (
          <div className="task-list-full">
            {filtered.map(task => (
              <SwipeableTask
                key={task.id}
                task={task}
                userId={user.id}
                allProfiles={allProfiles}
                onComplete={completeTask}
                onUncomplete={uncompleteTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddTaskModal
          userId={user.id}
          allProfiles={allProfiles}
          onAdd={addTask}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}

function SwipeableTask({ task, userId, allProfiles, onComplete, onUncomplete, onDelete }) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div className="swipeable-task">
      <TaskCard
        task={task}
        userId={userId}
        allProfiles={allProfiles}
        onComplete={onComplete}
        onUncomplete={onUncomplete}
      />
      <button
        className="task-delete-btn"
        onClick={() => {
          if (showDelete) onDelete(task.id)
          else setShowDelete(true)
        }}
        onBlur={() => setShowDelete(false)}
        title={showDelete ? 'Confirmer suppression' : 'Supprimer'}
      >
        {showDelete ? '✓' : '🗑'}
      </button>
    </div>
  )
}
