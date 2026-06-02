import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useTasks } from '../hooks/useTasks'
import { useMeals } from '../hooks/useMeals'
import { useShopping } from '../hooks/useShopping'
import { useWeekSettings } from '../hooks/useWeekSettings'

const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin

const RealtimeContext = createContext(null)

export function RealtimeProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false)
  const { refresh: refreshTasks } = useTasks()
  const { refresh: refreshMeals } = useMeals()
  const { refresh: refreshShopping } = useShopping()
  const { refresh: refreshSettings } = useWeekSettings()

  // Ref pour garder les callbacks à jour sans reconnecter le socket
  const refreshersRef = useRef({})
  refreshersRef.current = { refreshTasks, refreshMeals, refreshShopping, refreshSettings }

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      timeout: 10000,
    })

    socket.on('connect', () => {
      console.log('Temps réel connecté')
      setIsConnected(true)
    })

    socket.on('disconnect', (reason) => {
      console.log('Temps réel déconnecté:', reason)
      setIsConnected(false)
    })

    socket.on('reconnect', () => {
      console.log('Temps réel reconnecté')
      const r = refreshersRef.current
      r.refreshTasks?.()
      r.refreshMeals?.()
      r.refreshShopping?.()
      r.refreshSettings?.()
    })

    socket.on('update', (update) => {
      const { type } = update
      const r = refreshersRef.current
      if (type?.startsWith('task_') || type?.startsWith('completion_')) r.refreshTasks?.()
      if (type?.startsWith('meal_')) r.refreshMeals?.()
      if (type?.startsWith('shopping_')) r.refreshShopping?.()
      if (type === 'week_settings_updated') r.refreshSettings?.()
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
