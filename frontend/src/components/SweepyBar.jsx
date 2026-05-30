import { useState, useEffect, useMemo } from 'react'
import { getDaysSinceLastDone, getTaskIntervalDays } from '../lib/taskUtils'
import './SweepyBar.css'

export default function SweepyBar({ task, onNotify, compact = false }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000) // Update every minute
    return () => clearInterval(timer)
  }, [])

  const progressInfo = useMemo(() => {
    const daysSince = getDaysSinceLastDone(task, now)
    const intervalDays = getTaskIntervalDays(task)

    // Calculate percentage (0 = just done, 100 = due now)
    let percentage = Math.min(100, (daysSince / intervalDays) * 100)
    const isOverdue = daysSince > intervalDays

    // Determine urgency level and color
    let level, colorClass, text

    if (isOverdue) {
      const overdueDays = Math.floor(daysSince - intervalDays)
      level = 'overdue'
      colorClass = 'overdue'
      text = overdueDays === 0 ? 'Aujourd\'hui !' : `+${overdueDays}j de retard`
      percentage = 100 // Keep bar full but change style
    } else if (percentage >= 90) {
      level = 'urgent'
      colorClass = 'urgent'
      const remaining = Math.ceil(intervalDays - daysSince)
      text = remaining <= 1 ? 'Demain' : `${remaining}j restants`
    } else if (percentage >= 60) {
      level = 'warning'
      colorClass = 'warning'
      text = `${Math.floor(daysSince)}j / ${intervalDays}j`
    } else if (percentage >= 30) {
      level = 'caution'
      colorClass = 'caution'
      text = `${Math.floor(daysSince)}j / ${intervalDays}j`
    } else {
      level = 'normal'
      colorClass = 'normal'
      text = `${Math.floor(daysSince)}j / ${intervalDays}j`
    }

    return { daysSince, intervalDays, percentage, level, colorClass, text, isOverdue }
  }, [task, now])

  // Notification trigger - only when becoming urgent
  useEffect(() => {
    if (progressInfo.level === 'urgent' && progressInfo.daysSince > 0 && onNotify) {
      onNotify({
        taskName: task.name,
        message: `⚠️ "${task.name}" est presque à échéance !`,
        level: progressInfo.level
      })
    }
  }, [progressInfo.level, progressInfo.daysSince, task.name, onNotify])

  return (
    <div className={`sweepy-bar ${progressInfo.colorClass} ${compact ? 'compact' : ''}`}>
      {!compact && (
        <div className="sweepy-header">
          <span className="sweepy-label">
            {progressInfo.isOverdue ? '⏰ EN RETARD' : 'PROGRESSION'}
          </span>
          <span className="sweepy-text">{progressInfo.text}</span>
        </div>
      )}
      <div className="sweepy-track">
        <div
          className="sweepy-fill"
          style={{ width: `${progressInfo.percentage}%` }}
        />
      </div>
      {compact && <span className="sweepy-text-compact">{progressInfo.text}</span>}
    </div>
  )
}
