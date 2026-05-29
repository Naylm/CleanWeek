import { useMemo } from 'react'
import { getCategoryIcon, formatNextDue, isTaskDueToday } from '../lib/taskUtils'
import './TaskCard.css'

export default function TaskCard({ task, onComplete, onUncomplete, upcoming = false }) {
  const todayStr = new Date().toISOString().split('T')[0]

  const todayCompletion = useMemo(() => {
    return task.completions?.find(c => c.completed_at === todayStr) || null
  }, [task.completions, todayStr])

  const isDone = !!todayCompletion

  async function handleToggle() {
    if (isDone) {
      await onUncomplete(todayCompletion.id)
    } else {
      await onComplete(task.id)
    }
  }

  return (
    <div className={`task-card${isDone ? ' done' : ''}${upcoming ? ' upcoming' : ''}`}>
      <button
        className={`task-check${isDone ? ' checked' : ''}`}
        onClick={handleToggle}
        aria-label={isDone ? 'Marquer non fait' : 'Marquer fait'}
        disabled={upcoming}
      >
        {isDone && <CheckIcon />}
      </button>

      <div className="task-info">
        <div className="task-name-row">
          <span className="task-category-icon">{getCategoryIcon(task.category)}</span>
          <span className={`task-name${isDone ? ' task-name-done' : ''}`}>{task.name}</span>
        </div>
        <div className="task-meta">
          {upcoming ? (
            <span className="task-due">{formatNextDue(task)}</span>
          ) : (
            <span className={`task-freq ${task.frequency}`}>{getFreqLabel(task.frequency)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function getFreqLabel(f) {
  const map = { daily: 'Quotidien', weekly: 'Hebdo', biweekly: '2 semaines', monthly: 'Mensuel' }
  return map[f] || f
}
