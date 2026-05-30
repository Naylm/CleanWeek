import { useState, useCallback, useRef } from 'react'

const SWIPE_THRESHOLD = 80 // Distance minimum pour valider un swipe
const LONG_PRESS_DURATION = 500 // ms pour appui long

export function useSwipe({ onSwipeRight, onSwipeLeft, onLongPress, onTap }) {
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStart = useRef({ x: 0, y: 0, time: 0 })
  const longPressTimer = useRef(null)
  const isLongPress = useRef(false)

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
    isLongPress.current = false
    setIsDragging(true)

    // Démarrer le timer pour l'appui long
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      if (onLongPress) {
        onLongPress()
        // Vibration tactile si dispo
        if (navigator.vibrate) navigator.vibrate(50)
      }
    }, LONG_PRESS_DURATION)
  }, [onLongPress])

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = touch.clientY - touchStart.current.y

    // Annuler l'appui long si on bouge trop
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }

    // Verrouiller le défilement horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault()
    }

    // Limiter le déplacement visuel
    const maxOffset = 150
    const limitedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX))
    setOffset(limitedOffset)
  }, [isDragging])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)

    // Nettoyer le timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    // Ignorer si c'était un appui long
    if (isLongPress.current) {
      setOffset(0)
      return
    }

    const deltaTime = Date.now() - touchStart.current.time

    // Tap rapide (moins de 200ms et peu de déplacement)
    if (deltaTime < 200 && Math.abs(offset) < 10) {
      if (onTap) onTap()
      setOffset(0)
      return
    }

    // Swipe droit (fait)
    if (offset > SWIPE_THRESHOLD) {
      if (onSwipeRight) {
        onSwipeRight()
        if (navigator.vibrate) navigator.vibrate(20)
      }
    }
    // Swipe gauche (reporter)
    else if (offset < -SWIPE_THRESHOLD) {
      if (onSwipeLeft) {
        onSwipeLeft()
        if (navigator.vibrate) navigator.vibrate(20)
      }
    }

    // Revenir à la position initiale avec animation
    setOffset(0)
  }, [offset, onSwipeRight, onSwipeLeft, onTap])

  const handleMouseDown = useCallback((e) => {
    touchStart.current = { x: e.clientX, y: e.clientY, time: Date.now() }
    isLongPress.current = false
    setIsDragging(true)

    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      if (onLongPress) onLongPress()
    }, LONG_PRESS_DURATION)
  }, [onLongPress])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return

    const deltaX = e.clientX - touchStart.current.x
    const deltaY = e.clientY - touchStart.current.y

    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }

    const maxOffset = 150
    const limitedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX))
    setOffset(limitedOffset)
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    handleTouchEnd()
  }, [handleTouchEnd])

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      setOffset(0)
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [isDragging])

  return {
    offset,
    isDragging,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
    style: {
      transform: `translateX(${offset}px)`,
      transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    }
  }
}
