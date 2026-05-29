import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import TaskCard from '../components/TaskCard'
import AddTaskModal from '../components/AddTaskModal'
import { CATEGORIES } from '../lib/taskUtils'
import './TasksPage.css'

export default function TasksPage() {
  const { tasks, loading, completeTask, uncompleteTask, addTask, deleteTask } = useTasks()
  const [showAdd, setShowAdd] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')

  const filtered = tasks.filter(t => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false
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
          onAdd={addTask}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}

function SwipeableTask({ task, onComplete, onUncomplete, onDelete }) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div className="swipeable-task">
      <TaskCard
        task={task}
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
