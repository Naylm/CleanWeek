import { useMemo, useState } from 'react'
import { getCategoryIcon, getIntervalLabel, getDaysSinceLastDone, getTaskIntervalDays } from '../lib/taskUtils'
import { useSwipe } from '../hooks/useSwipe'
import SweepyBar from './SweepyBar'
import { useNotifications } from '../hooks/useNotifications'
import './TaskCardSwipe.css'

export default function TaskCardSwipe({ task, onComplete, onSnooze, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const { notifyTask } = useNotifications()

  // Calculer le niveau d'urgence pour le tri
  const urgencyScore = useMemo(() => {
    const daysSince = getDaysSinceLastDone(task)
    const intervalDays = getTaskIntervalDays(task)
    const percentage = (daysSince / intervalDays) * 100
    return percentage
  }, [task])

  const handleSwipeRight = () => {
    onComplete(task.id)
  }

  const handleSwipeLeft = () => {
    // Reporter de 1 jour par défaut
    onSnooze?.(task.id, 1)
  }

  const handleLongPress = () => {
    setShowMenu(true)
  }

  const handleTap = () => {
    // Rien sur tap simple, juste pour éviter les conflits
  }

  const { offset, isDragging, handlers, style } = useSwipe({
    onSwipeRight: handleSwipeRight,
    onSwipeLeft: handleSwipeLeft,
    onLongPress: handleLongPress,
    onTap: handleTap,
  })

  // Déterminer l'action en cours pour l'indicateur visuel
  const action = offset > 50 ? 'done' : offset < -50 ? 'snooze' : null

  return (
    <>
      <div className="task-card-swipe-container">
        {/* Indicateurs d'action (visibles pendant le swipe) */}
        <div className={`swipe-indicator left ${action === 'snooze' ? 'active' : ''}`}>
          <span className="indicator-icon">⏰</span>
          <span className="indicator-text">Reporter</span>
        </div>
        <div className={`swipe-indicator right ${action === 'done' ? 'active' : ''}`}>
          <span className="indicator-icon">✓</span>
          <span className="indicator-text">Fait !</span>
        </div>

        {/* Carte principale */}
        <div
          className={`task-card-swipe ${isDragging ? 'dragging' : ''}`}
          style={style}
          {...handlers}
        >
          <div className="task-card-content">
            <span className="task-category-icon">{getCategoryIcon(task.category)}</span>
            <div className="task-info-swipe">
              <span className="task-name">{task.name}</span>
              <SweepyBar task={task} compact />
            </div>
            <span className="task-freq-badge">
              {getIntervalLabel(task)}
            </span>
          </div>
        </div>
      </div>

      {/* Menu contextuel (appui long) */}
      {showMenu && (
        <div className="task-menu-overlay" onClick={() => setShowMenu(false)}>
          <div className="task-menu" onClick={(e) => e.stopPropagation()}>
            <h4>{task.name}</h4>
            <button className="menu-btn primary" onClick={() => { onComplete(task.id); setShowMenu(false); }}>
              <span>✓</span> Marquer comme fait
            </button>
            <div className="menu-snooze">
              <span>Reporter :</span>
              <div className="snooze-buttons">
                <button onClick={() => { onSnooze?.(task.id, 1); setShowMenu(false); }}>1j</button>
                <button onClick={() => { onSnooze?.(task.id, 2); setShowMenu(false); }}>2j</button>
                <button onClick={() => { onSnooze?.(task.id, 7); setShowMenu(false); }}>1sem</button>
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
export function sortTasksByUrgency(tasks) {
  return [...tasks].sort((a, b) => {
    const scoreA = getUrgencyScore(a)
    const scoreB = getUrgencyScore(b)
    return scoreB - scoreA // Plus urgent en premier
  })
}

function getUrgencyScore(task) {
  const daysSince = getDaysSinceLastDone(task)
  const intervalDays = getTaskIntervalDays(task)
  return (daysSince / intervalDays) * 100
}
