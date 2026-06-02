import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import TaskCardSwipe, { sortTasksByUrgency } from '../components/TaskCardSwipe'
import AddTaskModal from '../components/AddTaskModal'
import { CATEGORIES } from '../lib/taskUtils'
import './TasksPage.css'

const SORT_OPTIONS = [
  { value: 'urgency', label: '⚡ Urgence', icon: '⚡' },
  { value: 'name', label: '🔤 Nom', icon: '🔤' },
  { value: 'frequency', label: '🔄 Fréquence', icon: '🔄' },
  { value: 'created', label: '📅 Date création', icon: '📅' },
]

function sortTasks(tasks, sortBy) {
  const list = [...tasks]
  switch (sortBy) {
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name))
    case 'frequency': {
      const freqOrder = { daily: 1, weekly: 2, biweekly: 3, monthly: 4 }
      return list.sort((a, b) => (freqOrder[a.frequency] || 5) - (freqOrder[b.frequency] || 5))
    }
    case 'created':
      return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    case 'urgency':
    default:
      return sortTasksByUrgency(list)
  }
}

export default function TasksPage() {
  const { tasks, loading, completeTask, snoozeTask, addTask, updateTask, deleteTask } = useTasks()
  const [showAdd, setShowAdd] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('urgency')
  const [showSortMenu, setShowSortMenu] = useState(false)

  const filtered = useMemo(() => {
    const list = tasks.filter(t => filterCategory === 'all' || t.category === filterCategory)
    return sortTasks(list, sortBy)
  }, [tasks, filterCategory, sortBy])

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
        <div>
          <p className="tasks-subtitle">{tasks.length} tâche{tasks.length > 1 ? 's' : ''} au total</p>
          <h1>Toutes les tâches</h1>
        </div>
        <div className="sort-dropdown">
          <button 
            className="sort-btn"
            onClick={() => setShowSortMenu(!showSortMenu)}
            title="Trier par"
          >
            {SORT_OPTIONS.find(o => o.value === sortBy)?.icon || '⚡'} ↓
          </button>
          {showSortMenu && (
            <div className="sort-menu">
              {SORT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  className={`sort-option ${sortBy === option.value ? 'active' : ''}`}
                  onClick={() => {
                    setSortBy(option.value)
                    setShowSortMenu(false)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
          <div className="task-list">
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

      <button className="fab" onClick={() => setShowAdd(true)} aria-label="Ajouter une tâche">
        <span>+</span>
      </button>

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
