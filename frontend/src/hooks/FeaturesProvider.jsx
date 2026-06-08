import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { onRefresh } from '../lib/events'

const API_URL = import.meta.env.VITE_API_URL || ''

const FeaturesContext = createContext(null)

export function FeaturesProvider({ children }) {
  const [features, setFeatures] = useState({
    shopping_page_enabled: false,
    offline_mode_enabled: false,
    reminders_enabled: false,
  })
  const [loading, setLoading] = useState(true)

  const fetchFeatures = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/features`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch features')
      const data = await res.json()
      setFeatures({
        shopping_page_enabled: data.shopping_page_enabled === 1,
        offline_mode_enabled: data.offline_mode_enabled === 1,
        reminders_enabled: data.reminders_enabled === 1,
      })
    } catch (err) {
      console.error('Error fetching features:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchFeatures, 0)
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchFeatures()
    }
    window.addEventListener('focus', fetchFeatures)
    document.addEventListener('visibilitychange', onVisible)
    const unsub = onRefresh((type) => {
      if (type === 'features') fetchFeatures()
    })
    return () => {
      clearTimeout(t)
      window.removeEventListener('focus', fetchFeatures)
      document.removeEventListener('visibilitychange', onVisible)
      unsub()
    }
  }, [fetchFeatures])

  const toggleFeature = useCallback(async (featureKey) => {
    const newValue = !features[featureKey]
    
    // Optimistic update
    setFeatures(prev => ({ ...prev, [featureKey]: newValue }))
    
    try {
      const res = await fetch(`${API_URL}/api/user/features`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [featureKey]: newValue }),
      })
      if (!res.ok) throw new Error('Failed to update feature')
      
      // Special actions for specific features
      if (featureKey === 'offline_mode_enabled' && newValue) {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('SW registered'))
            .catch(err => console.error('SW registration failed', err))
        }
      }
    } catch (err) {
      console.error('Error updating feature:', err)
      setFeatures(prev => ({ ...prev, [featureKey]: !newValue }))
    }
  }, [features])

  const value = {
    features,
    loading,
    toggleFeature,
    refresh: fetchFeatures,
  }

  return (
    <FeaturesContext.Provider value={value}>
      {children}
    </FeaturesContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFeatures() {
  const context = useContext(FeaturesContext)
  if (!context) {
    throw new Error('useFeatures must be used within FeaturesProvider')
  }
  return context
}
