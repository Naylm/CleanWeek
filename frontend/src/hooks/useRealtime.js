import { useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin

export function useRealtime(onUpdate) {
  const handleUpdate = useCallback((update) => {
    console.log('Realtime update:', update)
    onUpdate?.(update)
  }, [onUpdate])

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    socket.on('update', handleUpdate)

    return () => {
      socket.off('update', handleUpdate)
      socket.disconnect()
    }
  }, [handleUpdate])
}
