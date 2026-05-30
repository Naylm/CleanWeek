import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import TaskCardSwipe, { sortTasksByUrgency } from '../components/TaskCardSwipe'
import AddTaskModal from '../components/AddTaskModal'
import { CATEGORIES } from '../lib/taskUtils'
import './TasksPage.css'

export default function TasksPage() {
  const { tasks, loading, completeTask, snoozeTask, addTask, updateTask, deleteTask } = useTasks()
  const [showAdd, setShowAdd] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')

  // Tâches filtrées ET triées par urgence
  const filtered = useMemo(() => {
    const filtered = tasks.filter(t => {
      if (filterCategory !== 'all' && t.category !== filterCategory) return false
      return true
    })
    return sortTasksByUrgency(filtered)
  }, [tasks, filterCategory])

  async function handleAddOrUpdate(taskData, taskId) {
    if (taskId) {
      await updateTask(taskId, taskData)
      setEditingTask(null)
    } else {
      await addTask(taskData)
      setShowAdd(false)
    }
  }

  function handleEditTask(task) {
    setEditingTask(task)
  }

  function handleSnooze(taskId, days) {
    snoozeTask(taskId, days)
  }

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
          <div className="task-list-swipe-full">
            {filtered.map(task => (
              <TaskCardSwipe
                key={task.id}
                task={task}
                onComplete={completeTask}
                onSnooze={handleSnooze}
                onEdit={handleEditTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        )}
      </div>

      {(showAdd || editingTask) && (
        <AddTaskModal
          onAdd={handleAddOrUpdate}
          onClose={() => { setShowAdd(false); setEditingTask(null) }}
          initialTask={editingTask}
        />
      )}
    </div>
  )
}
