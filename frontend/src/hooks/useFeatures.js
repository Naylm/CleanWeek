import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export function useFeatures() {
  const [features, setFeatures] = useState({
    shopping_page_enabled: false,
    offline_mode_enabled: false,
    reminders_enabled: false,
  })
  const [loading, setLoading] = useState(true)

  const fetchFeatures = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/features`)
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
    fetchFeatures()
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
        // Register service worker if not already done
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.error('SW registration failed', err))
        }
      }
    } catch (err) {
      console.error('Error updating feature:', err)
      // Rollback on error
      setFeatures(prev => ({ ...prev, [featureKey]: !newValue }))
    }
  }, [features])

  return {
    features,
    loading,
    toggleFeature,
    refresh: fetchFeatures,
  }
}
