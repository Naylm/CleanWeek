import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { emitRefresh } from '../lib/events'

const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin

const RealtimeContext = createContext(null)

export function RealtimeProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const refreshSharedData = () => {
      emitRefresh('tasks')
      emitRefresh('meals')
      emitRefresh('shopping')
      emitRefresh('settings')
      emitRefresh('features')
      emitRefresh('reminders')
      emitRefresh('task-categories')
      emitRefresh('shop-categories')
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      timeout: 10000,
    })

    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.io.on('reconnect', refreshSharedData)

    socket.on('update', (update) => {
      const { type } = update
      emitRefresh(type)

      if ((type?.startsWith('task_') && !type.startsWith('task_category_')) || type?.startsWith('completion_')) {
        emitRefresh('tasks')
      }
      if (type?.startsWith('meal_')) emitRefresh('meals')
      if (type?.startsWith('shopping_')) emitRefresh('shopping')
      if (type === 'week_settings_updated') emitRefresh('settings')
      if (type === 'features_updated') emitRefresh('features')
      if (type?.startsWith('reminder_')) emitRefresh('reminders')
      if (type?.startsWith('task_category_')) emitRefresh('task-categories')
      if (type?.startsWith('shop_category_')) emitRefresh('shop-categories')
    })

    return () => {
      socket.io.off('reconnect', refreshSharedData)
      socket.disconnect()
    }
  }, []) // socket créé une seule fois

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useRealtimeStatus = () => useContext(RealtimeContext)
