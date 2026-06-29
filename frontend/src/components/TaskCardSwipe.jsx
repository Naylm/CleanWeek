import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTaskCategories } from '../hooks/useTaskCategories'
import {
  getCategoryIconDynamic,
  getDaysSinceLastDone,
  getIntervalLabel,
  getIntervalShortLabel,
  getTaskIntervalDays,
} from '../lib/taskUtils'
import { useSwipe } from '../hooks/useSwipe'
import SweepyBar from './SweepyBar'
import './TaskCardSwipe.css'

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function TaskCardSwipe({ task, onComplete, onSnooze, onEdit, onDelete, onCompleteWithDate }) {
  const [today] = useState(() => formatLocalDate(new Date()))
  const [yesterday] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    return formatLocalDate(date)
  })
  const [showMenu, setShowMenu] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showSwipeDatePicker, setShowSwipeDatePicker] = useState(false)
  const [swipeDate, setSwipeDate] = useState(today)
  const [customDate, setCustomDate] = useState(today)
  const { categories: taskCategories } = useTaskCategories()

  const triggerComplete = useCallback((date = null) => {
    setCelebrate(true)
    if (navigator.vibrate) navigator.vibrate(30)
    // Laisse l'animation jouer avant de remonter l'action
    setTimeout(() => {
      onComplete(task.id, date)
      setCelebrate(false)
    }, 420)
  }, [onComplete, task.id])

  const handleSwipeRight = () => {
    // Ne rien faire ici - la validation est gérée manuellement
    // pour permettre la sélection de date
  }

  const handleSwipeLeft = () => {
    if (onSnooze) onSnooze(task.id, 1)
  }

  const handleLongPress = () => setShowMenu(true)
  const handleTap = () => {}

  const { offset, isDragging, revealedAction, confirmAction, cancelAction, handlers } = useSwipe({
    onSwipeRight: handleSwipeRight,
    onSwipeLeft: handleSwipeLeft,
    onLongPress: handleLongPress,
    onTap: handleTap,
    requireConfirmation: true,
  })

  const confirmSwipeWithDate = () => {
    setShowSwipeDatePicker(false)
    cancelAction()
    triggerComplete(swipeDate)
  }

  const revealedActionName = revealedAction === 'right' ? 'done' : revealedAction === 'left' ? 'snooze' : null
  const draggedActionName = offset > 10 ? 'done' : offset < -10 ? 'snooze' : null
  const action = isDragging ? draggedActionName : revealedActionName
  const actionClass = (name) => action === name ? (isDragging ? 'preview' : 'active') : ''

  const cardStyle = {
    transform: `translateX(${offset}px)`,
    transition: isDragging ? 'none' : 'transform var(--t-spring)',
  }

  return (
    <>
      <div className={`task-card-swipe-container ${celebrate ? 'celebrate' : ''}`}>
        <button
          type="button"
          className={`swipe-indicator left ${actionClass('done')}`}
          onClick={(e) => { e.stopPropagation(); if (revealedActionName === 'done') { setShowSwipeDatePicker(true); if (navigator.vibrate) navigator.vibrate([15, 25]); } }}
        >
          <span className="indicator-icon">✓</span>
          <span className="indicator-text">Valider</span>
        </button>
        <button
          type="button"
          className={`swipe-indicator right ${actionClass('snooze')}`}
          onClick={(e) => { e.stopPropagation(); if (revealedActionName === 'snooze') { confirmAction(); if (navigator.vibrate) navigator.vibrate([15, 25]); } }}
        >
          <span className="indicator-icon">⏰</span>
          <span className="indicator-text">Reporter</span>
        </button>

        <div
          className={`task-card-swipe ${isDragging ? 'dragging' : ''} ${revealedAction ? 'action-revealed' : ''}`}
          style={cardStyle}
          {...handlers}
        >
          <div className="task-card-content">
            <span className="task-category-icon">{getCategoryIconDynamic(task.category, taskCategories)}</span>
            <div className="task-info-swipe">
              <span className="task-name">{task.name}</span>
              <SweepyBar task={task} compact />
            </div>
            {revealedAction ? (
              <span className="task-cancel-hint">↩ Annuler</span>
            ) : (
              <span className="task-freq-badge" title={getIntervalLabel(task)}>
                {getIntervalShortLabel(task)}
              </span>
            )}
          </div>

          {celebrate && (
            <div className="task-celebrate-overlay">
              <span className="task-celebrate-check">✓</span>
            </div>
          )}
        </div>
      </div>

      {showSwipeDatePicker && createPortal(
        <div className="date-modal-overlay" onClick={() => { setShowSwipeDatePicker(false); cancelAction(); }}>
          <div className="date-modal" onClick={(e) => e.stopPropagation()}>
            <div className="date-modal-handle" />
            <div className="date-modal-head">
              <span className="date-modal-emoji">{getCategoryIconDynamic(task.category, taskCategories)}</span>
              <div>
                <h4>{task.name}</h4>
                <p>Quand l'as-tu fait ?</p>
              </div>
            </div>
            <div className="date-quick-options">
              <button
                className={`date-chip ${swipeDate === today ? 'active' : ''}`}
                onClick={() => setSwipeDate(today)}
              >
                Aujourd'hui
              </button>
              <button
                className={`date-chip ${swipeDate === yesterday ? 'active' : ''}`}
                onClick={() => setSwipeDate(yesterday)}
              >
                Hier
              </button>
            </div>
            <input
              type="date"
              className="date-modal-input"
              value={swipeDate}
              onChange={(e) => setSwipeDate(e.target.value)}
              max={today}
            />
            <div className="date-modal-actions">
              <button className="date-btn-cancel" onClick={() => { setShowSwipeDatePicker(false); cancelAction(); }}>
                Annuler
              </button>
              <button className="date-btn-confirm" onClick={confirmSwipeWithDate}>
                <span>✓</span> Valider
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showMenu && (
        <div className="task-menu-overlay" onClick={() => setShowMenu(false)}>
          <div className="task-menu" onClick={(e) => e.stopPropagation()}>
            <div className="task-menu-handle" />
            <div className="task-menu-head">
              <span className="task-menu-emoji">{getCategoryIconDynamic(task.category, taskCategories)}</span>
              <h4>{task.name}</h4>
            </div>
            <button className="menu-btn primary" onClick={() => { triggerComplete(); setShowMenu(false); }}>
              <span>✓</span> Marquer comme fait aujourd'hui
            </button>
            
            {!showDatePicker ? (
              <button className="menu-btn" onClick={() => setShowDatePicker(true)}>
                <span>📅</span> Marquer comme fait le...
              </button>
            ) : (
              <div className="menu-date-picker">
                <span>Date de réalisation</span>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  max={today}
                />
                <div className="date-picker-actions">
                  <button onClick={() => setShowDatePicker(false)}>Annuler</button>
                  <button 
                    className="btn-confirm"
                    onClick={() => {
                      if (onCompleteWithDate) {
                        onCompleteWithDate(task.id, customDate)
                      } else if (onComplete) {
                        // Fallback si onCompleteWithDate n'est pas fourni
                        onComplete(task.id, customDate)
                      }
                      setShowDatePicker(false)
                      setShowMenu(false)
                    }}
                  >
                    Valider
                  </button>
                </div>
              </div>
            )}
            
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
