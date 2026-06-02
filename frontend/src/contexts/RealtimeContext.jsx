import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { emitRefresh } from '../lib/events'

const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin

const RealtimeContext = createContext(null)

export function RealtimeProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
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

    socket.on('reconnect', () => {
      emitRefresh('tasks')
      emitRefresh('meals')
      emitRefresh('shopping')
      emitRefresh('settings')
    })

    socket.on('update', (update) => {
      const { type } = update
      if (type?.startsWith('task_') || type?.startsWith('completion_')) emitRefresh('tasks')
      if (type?.startsWith('meal_')) emitRefresh('meals')
      if (type?.startsWith('shopping_')) emitRefresh('shopping')
      if (type === 'week_settings_updated') emitRefresh('settings')
    })

    return () => {
      socket.disconnect()
    }
  }, []) // socket créé une seule fois

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export const useRealtimeStatus = () => useContext(RealtimeContext)
