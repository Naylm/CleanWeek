import { useState, useCallback } from 'react'
import { useTaskCategories } from '../hooks/useTaskCategories'
import { getCategoryIconDynamic, getIntervalLabel, getDaysSinceLastDone, getTaskIntervalDays } from '../lib/taskUtils'
import { useSwipe } from '../hooks/useSwipe'
import SweepyBar from './SweepyBar'
import './TaskCardSwipe.css'

export default function TaskCardSwipe({ task, onComplete, onSnooze, onEdit, onDelete, onCompleteWithDate }) {
  const [showMenu, setShowMenu] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showSwipeDatePicker, setShowSwipeDatePicker] = useState(false)
  const [swipeDate, setSwipeDate] = useState(new Date().toISOString().split('T')[0])
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0])
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

  const confirmSwipeWithDate = () => {
    setShowSwipeDatePicker(false)
    triggerComplete(swipeDate)
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

  const action = revealedAction === 'right' ? 'done' : revealedAction === 'left' ? 'snooze' : null

  const cardStyle = {
    transform: `translateX(${offset}px)`,
    transition: isDragging ? 'none' : 'transform var(--t-spring)',
  }

  return (
    <>
      <div className={`task-card-swipe-container ${celebrate ? 'celebrate' : ''}`}>
        <div className={`swipe-indicator left ${action === 'snooze' ? 'active' : ''}`}>
          {action === 'snooze' ? (
            <>
              <button className="swipe-action-btn cancel-btn" onClick={(e) => { e.stopPropagation(); cancelAction(); }}>
                <span className="indicator-icon">↩</span>
                <span className="indicator-text">Annuler</span>
              </button>
              <button className="swipe-action-btn" onClick={(e) => { e.stopPropagation(); confirmAction(); }}>
                <span className="indicator-icon">⏰</span>
                <span className="indicator-text">Reporter</span>
              </button>
            </>
          ) : (
            <>
              <span className="indicator-icon">⏰</span>
              <span className="indicator-text">Reporter</span>
            </>
          )}
        </div>
        <div className={`swipe-indicator right ${action === 'done' ? 'active' : ''}`}>
          {action === 'done' ? (
            showSwipeDatePicker ? (
              <div className="swipe-date-picker">
                <span>Date de réalisation</span>
                <input
                  type="date"
                  value={swipeDate}
                  onChange={(e) => setSwipeDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                <div className="swipe-date-actions">
                  <button className="swipe-action-btn cancel-btn" onClick={(e) => { e.stopPropagation(); setShowSwipeDatePicker(false); cancelAction(); }}>
                    <span className="indicator-icon">↩</span>
                    <span className="indicator-text">Annuler</span>
                  </button>
                  <button className="swipe-action-btn" onClick={(e) => { e.stopPropagation(); confirmSwipeWithDate(); }}>
                    <span className="indicator-icon">✓</span>
                    <span className="indicator-text">Valider</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button className="swipe-action-btn" onClick={(e) => { e.stopPropagation(); setShowSwipeDatePicker(true); }}>
                  <span className="indicator-icon">✓</span>
                  <span className="indicator-text">Valider</span>
                </button>
                <button className="swipe-action-btn cancel-btn" onClick={(e) => { e.stopPropagation(); cancelAction(); }}>
                  <span className="indicator-icon">↩</span>
                  <span className="indicator-text">Annuler</span>
                </button>
              </>
            )
          ) : (
            <>
              <span className="indicator-icon">✓</span>
              <span className="indicator-text">Fait !</span>
            </>
          )}
        </div>

        <div
          className={`task-card-swipe ${isDragging ? 'dragging' : ''} ${revealedAction ? 'action-revealed' : ''}`}
          style={cardStyle}
          {...handlers}
          onClick={() => revealedAction && cancelAction()}
        >
          <div className="task-card-content">
            <span className="task-category-icon">{getCategoryIconDynamic(task.category, taskCategories)}</span>
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
                  max={new Date().toISOString().split('T')[0]}
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
