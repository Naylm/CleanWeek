import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function checkConnection() {
      try {
        // Ping rapide vers Supabase avec timeout de 500ms
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 500)
        
        const response = await fetch(
          `${supabase.supabaseUrl}/rest/v1/`,
          { 
            method: 'HEAD',
            headers: {
              'apikey': supabase.supabaseKey || '',
            },
            signal: controller.signal,
          }
        )
        
        clearTimeout(timeoutId)
        
        if (!cancelled) {
          setIsOnline(response.ok)
          setChecked(true)
        }
      } catch (error) {
        if (!cancelled) {
          console.log('🔍 DEBUG: Supabase inaccessible, mode dégradé')
          setIsOnline(false)
          setChecked(true)
        }
      }
    }

    checkConnection()

    return () => {
      cancelled = true
    }
  }, [])

  return { isOnline, checked }
}
