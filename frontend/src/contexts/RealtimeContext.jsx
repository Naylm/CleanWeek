import { createContext, useContext, useEffect, useCallback, useState } from 'react'
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

  const handleUpdate = useCallback((update) => {
    const { type } = update
    
    // Rafraîchir les données selon le type d'update
    if (type?.startsWith('task_') || type?.startsWith('completion_')) {
      refreshTasks()
    }
    if (type?.startsWith('meal_')) {
      refreshMeals()
    }
    if (type?.startsWith('shopping_')) {
      refreshShopping()
    }
    if (type === 'week_settings_updated') {
      refreshSettings()
    }
  }, [refreshTasks, refreshMeals, refreshShopping, refreshSettings])

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    })

    socket.on('connect', () => {
      console.log('✅ Temps réel connecté:', socket.id)
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('❌ Temps réel déconnecté')
      setIsConnected(false)
    })

    socket.on('reconnect', () => {
      console.log('🔄 Temps réel reconnecté')
      // Rafraîchir toutes les données après reconnexion
      refreshTasks()
      refreshMeals()
      refreshShopping()
      refreshSettings()
    })

    socket.on('update', handleUpdate)

    return () => {
      socket.off('update', handleUpdate)
      socket.disconnect()
    }
  }, [handleUpdate, refreshTasks, refreshMeals, refreshShopping, refreshSettings])

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export const useRealtimeStatus = () => useContext(RealtimeContext)
