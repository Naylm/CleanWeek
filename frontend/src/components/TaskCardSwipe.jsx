import { useState, useCallback } from 'react'
import { getCategoryIcon, getIntervalLabel, getDaysSinceLastDone, getTaskIntervalDays } from '../lib/taskUtils'
import { useSwipe } from '../hooks/useSwipe'
import SweepyBar from './SweepyBar'
import './TaskCardSwipe.css'

export default function TaskCardSwipe({ task, onComplete, onSnooze, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const triggerComplete = useCallback(() => {
    setCelebrate(true)
    if (navigator.vibrate) navigator.vibrate(30)
    // Laisse l'animation jouer avant de remonter l'action
    setTimeout(() => {
      onComplete(task.id)
      setCelebrate(false)
    }, 420)
  }, [onComplete, task.id])

  const handleSwipeRight = () => triggerComplete()

  const handleSwipeLeft = () => {
    if (onSnooze) onSnooze(task.id, 1)
  }

  const handleLongPress = () => setShowMenu(true)
  const handleTap = () => {}

  const { offset, isDragging, handlers } = useSwipe({
    onSwipeRight: handleSwipeRight,
    onSwipeLeft: handleSwipeLeft,
    onLongPress: handleLongPress,
    onTap: handleTap,
  })

  const action = offset > 50 ? 'done' : offset < -50 ? 'snooze' : null

  const cardStyle = {
    transform: `translateX(${offset}px)`,
    transition: isDragging ? 'none' : 'transform var(--t-spring)',
  }

  return (
    <>
      <div className={`task-card-swipe-container ${celebrate ? 'celebrate' : ''}`}>
        <div className={`swipe-indicator left ${action === 'snooze' ? 'active' : ''}`}>
          <span className="indicator-icon">⏰</span>
          <span className="indicator-text">Reporter</span>
        </div>
        <div className={`swipe-indicator right ${action === 'done' ? 'active' : ''}`}>
          <span className="indicator-icon">✓</span>
          <span className="indicator-text">Fait !</span>
        </div>

        <div
          className={`task-card-swipe ${isDragging ? 'dragging' : ''}`}
          style={cardStyle}
          {...handlers}
        >
          <div className="task-card-content">
            <span className="task-category-icon">{getCategoryIcon(task.category)}</span>
            <div className="task-info-swipe">
              <span className="task-name">{task.name}</span>
              <SweepyBar task={task} compact />
            </div>
            <span className="task-freq-badge">{getIntervalLabel(task)}</span>
          </div>

          {celebrate && (
            <div className="task-celebrate-overlay">
              <span className="task-celebrate-check">✓</span>
            </div>
          )}
        </div>
      </div>

      {showMenu && (
        <div className="task-menu-overlay" onClick={() => setShowMenu(false)}>
          <div className="task-menu" onClick={(e) => e.stopPropagation()}>
            <div className="task-menu-handle" />
            <div className="task-menu-head">
              <span className="task-menu-emoji">{getCategoryIcon(task.category)}</span>
              <h4>{task.name}</h4>
            </div>
            <button className="menu-btn primary" onClick={() => { triggerComplete(); setShowMenu(false); }}>
              <span>✓</span> Marquer comme fait
            </button>
            <div className="menu-snooze">
              <span>Reporter</span>
              <div className="snooze-buttons">
                <button onClick={() => { onSnooze?.(task.id, 1); setShowMenu(false); }}>1 jour</button>
                <button onClick={() => { onSnooze?.(task.id, 2); setShowMenu(false); }}>2 jours</button>
                <button onClick={() => { onSnooze?.(task.id, 7); setShowMenu(false); }}>1 sem.</button>
              </div>
            </div>
            {onEdit && (
              <button className="menu-btn" onClick={() => { onEdit(task); setShowMenu(false); }}>
                <span>✎</span> Modifier
              </button>
            )}
            {onDelete && (
              <button className="menu-btn danger" onClick={() => { onDelete(task.id); setShowMenu(false); }}>
                <span>🗑</span> Supprimer
              </button>
            )}
            <button className="menu-btn cancel" onClick={() => setShowMenu(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// Fonction utilitaire pour trier les tâches par urgence
// eslint-disable-next-line react-refresh/only-export-components
export function sortTasksByUrgency(tasks) {
  return [...tasks].sort((a, b) => getUrgencyScore(b) - getUrgencyScore(a))
}

function getUrgencyScore(task) {
  const daysSince = getDaysSinceLastDone(task)
  const intervalDays = getTaskIntervalDays(task)
  return (daysSince / intervalDays) * 100
}
