import { useState, useEffect, useMemo } from 'react'
import './CountdownTimer.css'

export default function CountdownTimer({ dueDate, taskName, onNotify }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000) // Update every minute
    return () => clearInterval(timer)
  }, [])

  const timeInfo = useMemo(() => {
    const due = new Date(dueDate)
    const diff = due - now
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    const hours = Math.ceil(diff / (1000 * 60 * 60))
    const minutes = Math.ceil(diff / (1000 * 60))
    const totalDays = 7 // Assume 7 days as "full" time for weekly tasks

    // Calculate percentage (0 = urgent, 100 = plenty of time)
    let percentage = Math.max(0, Math.min(100, (days / totalDays) * 100))

    // Determine urgency level and color
    let level, colorClass, text
    if (days <= 0) {
      level = 'overdue'
      colorClass = 'overdue'
      text = hours > 0 ? `Dans ${hours}h` : minutes > 0 ? `Dans ${minutes}min` : 'Maintenant !'
      percentage = 5
    } else if (days === 1) {
      level = 'urgent'
      colorClass = 'urgent'
      text = 'Demain'
    } else if (days <= 2) {
      level = 'warning'
      colorClass = 'warning'
      text = `${days} jours`
    } else if (days <= 3) {
      level = 'caution'
      colorClass = 'caution'
      text = `${days} jours`
    } else {
      level = 'normal'
      colorClass = 'normal'
      text = `${days} jours`
    }

    return { days, hours, minutes, percentage, level, colorClass, text }
  }, [dueDate, now])

  // Notification trigger
  useEffect(() => {
    if (timeInfo.level === 'urgent' && onNotify) {
      onNotify({
        taskName,
        message: `⏰ "${taskName}" est pour demain !`,
        level: timeInfo.level
      })
    }
  }, [timeInfo.level, taskName, onNotify])

  return (
    <div className={`countdown-timer ${timeInfo.colorClass}`}>
      <div className="countdown-bar-bg">
        <div
          className="countdown-bar-fill"
          style={{ width: `${timeInfo.percentage}%` }}
        />
      </div>
      <span className="countdown-text">{timeInfo.text}</span>
    </div>
  )
}
