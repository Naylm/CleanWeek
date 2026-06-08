import { useState, useEffect, useMemo } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import { getDaysSinceLastDone, getNextDueDate, getTaskIntervalDays } from '../lib/taskUtils'
import './SweepyBar.css'

export default function SweepyBar({ task, onNotify, compact = false }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const progressInfo = useMemo(() => {
    const daysSince = getDaysSinceLastDone(task, now)
    const intervalDays = getTaskIntervalDays(task)
    const hasCompletion = Boolean(task.completions?.length)
    const usesWeekdays = task.custom_interval_enabled
      && task.customInterval?.interval_type === 'days_of_week'
    const nextDue = getNextDueDate(task, now)
    const daysUntilDue = differenceInCalendarDays(nextDue, now)

    let percentage = hasCompletion
      ? Math.min(100, (daysSince / intervalDays) * 100)
      : daysUntilDue <= 0 ? 100 : 0
    const isOverdue = daysUntilDue < 0 && hasCompletion

    let level
    let colorClass

    if (isOverdue) {
      level = 'overdue'
      colorClass = 'overdue'
      percentage = 100
    } else if (daysUntilDue <= 0) {
      level = 'urgent'
      colorClass = 'urgent'
      percentage = 100
    } else if (daysUntilDue === 1 || percentage >= 60) {
      level = 'warning'
      colorClass = 'warning'
    } else if (percentage >= 30) {
      level = 'caution'
      colorClass = 'caution'
    } else {
      level = 'normal'
      colorClass = 'normal'
    }

    let cycleText
    if (!hasCompletion) {
      cycleText = 'Jamais faite'
    } else if (usesWeekdays) {
      cycleText = daysSince === 0 ? "Faite aujourd'hui" : `Faite il y a ${daysSince} j`
    } else {
      cycleText = `${daysSince} / ${intervalDays} j`
    }

    let dueText
    if (!hasCompletion && daysUntilDue <= 0) {
      dueText = 'À faire'
    } else if (daysUntilDue < 0) {
      dueText = `Retard ${Math.abs(daysUntilDue)} j`
    } else if (daysUntilDue === 0) {
      dueText = "Aujourd'hui"
    } else if (daysUntilDue === 1) {
      dueText = 'Demain'
    } else {
      dueText = `Dans ${daysUntilDue} j`
    }

    return {
      daysSince,
      percentage,
      level,
      colorClass,
      cycleText,
      dueText,
      isOverdue,
    }
  }, [task, now])

  useEffect(() => {
    if (progressInfo.level === 'urgent' && progressInfo.daysSince > 0 && onNotify) {
      onNotify({
        taskName: task.name,
        message: `⚠️ "${task.name}" est presque à échéance !`,
        level: progressInfo.level,
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
          <span className="sweepy-text">{progressInfo.dueText}</span>
        </div>
      )}
      {compact && (
        <div className="sweepy-compact-meta">
          <span className="sweepy-cycle-text">{progressInfo.cycleText}</span>
          <span className="sweepy-due-text">{progressInfo.dueText}</span>
        </div>
      )}
      <div className="sweepy-track">
        <div
          className="sweepy-fill"
          style={{ width: `${progressInfo.percentage}%` }}
        />
      </div>
    </div>
  )
}
