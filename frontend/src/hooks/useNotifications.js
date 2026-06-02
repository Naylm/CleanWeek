import { useState, useCallback, useEffect, useRef } from 'react'

export function useNotifications() {
  const [permission, setPermission] = useState(() => {
    if ('Notification' in window) return Notification.permission
    return 'default'
  })
  const notifiedTasks = useRef(new Set())

  // Request permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(setPermission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false
    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }, [])

  const sendNotification = useCallback(({ title, body }) => {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    try {
      new Notification(title, {
        body,
        icon: '/apple-touch-icon.png',
        badge: '/apple-touch-icon.png',
        tag: 'cleanweek-task',
        requireInteraction: true,
        silent: false,
      })
    } catch (e) {
      console.error('Notification failed:', e)
    }
  }, [])

  const notifyTask = useCallback(({ taskName, message, level }) => {
    const key = `${taskName}-${level}`

    // Don't notify the same task/level combo twice per session
    if (notifiedTasks.current.has(key)) return
    notifiedTasks.current.add(key)

    // Clear after 1 hour so we can notify again
    setTimeout(() => notifiedTasks.current.delete(key), 3600000)

    sendNotification({
      title: level === 'overdue' ? '⏰ Tâche en retard !' : '⏰ Échéance proche !',
      body: message || `La tâche "${taskName}" approche de son échéance !`,
    })
  }, [sendNotification])

  return {
    permission,
    requestPermission,
    sendNotification,
    notifyTask
  }
}
