import { useMemo } from 'react'
import { getCategoryIcon, isTaskDueToday, getIntervalLabel } from '../lib/taskUtils'
import SweepyBar from './SweepyBar'
import { useNotifications } from '../hooks/useNotifications'
import './TaskCard.css'

export default function TaskCard({ task, onComplete, onUncomplete, showProgress = true, referenceDate = new Date() }) {
  const todayStr = referenceDate.toISOString().split('T')[0]
  const { notifyTask } = useNotifications()

  const todayCompletion = useMemo(() => {
    return task.completions?.find(c => c.completed_at === todayStr) || null
  }, [task.completions, todayStr])

  const isDone = !!todayCompletion
  const isDue = isTaskDueToday(task, referenceDate)

  async function handleToggle() {
    if (isDone) {
      await onUncomplete(todayCompletion.id)
    } else {
      await onComplete(task.id)
    }
  }

  function handleNotify(notification) {
    notifyTask({
      taskName: task.name,
      message: notification.message,
      level: notification.level
    })
  }

  return (
    <div className={`task-card${isDone ? ' done' : ''}${isDue ? ' due' : ''}`}>
      <button
        className={`task-check${isDone ? ' checked' : ''}`}
        onClick={handleToggle}
        aria-label={isDone ? 'Marquer non fait' : 'Marquer fait'}
      >
        {isDone && <CheckIcon />}
      </button>

      <div className="task-info">
        <div className="task-name-row">
          <span className="task-category-icon">{getCategoryIcon(task.category)}</span>
          <span className={`task-name${isDone ? ' task-name-done' : ''}`}>{task.name}</span>
        </div>
        <div className="task-meta">
          {showProgress ? (
            <SweepyBar
              task={task}
              onNotify={handleNotify}
            />
          ) : (
            <span className={`task-freq ${task.frequency}${task.custom_interval_enabled ? ' custom' : ''}`}>
              {getIntervalLabel(task)}
            </span>
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
