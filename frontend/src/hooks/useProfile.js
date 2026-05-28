import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Helper pour timeout rapide sur les requêtes
function withTimeout(promise, ms = 800) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ])
}

// Données de démonstration pour le mode hors ligne
const getDemoProfiles = (userId) => {
  const baseProfiles = [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      display_name: 'Laura',
      avatar_color: '#FF6584',
    },
    {
      id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      display_name: 'Melvin',
      avatar_color: '#6C63FF',
    }
  ]
  
  return {
    allProfiles: baseProfiles,
    profile: baseProfiles.find(p => p.id === userId) || baseProfiles[0]
  }
}

export function useProfile(userId) {
  // Chargement immédiat des données démo
  const demoData = userId ? getDemoProfiles(userId) : { allProfiles: [], profile: null }
  const [profile, setProfile] = useState(demoData.profile)
  const [allProfiles, setAllProfiles] = useState(demoData.allProfiles)
  const [loading, setLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(true)
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function fetchProfiles() {
      if (hasCheckedRef.current) return
      hasCheckedRef.current = true

      try {
        const { data, error } = await withTimeout(
          supabase.from('profiles').select('*'),
          800
        )
        
        if (!error && data) {
          setAllProfiles(data)
          setProfile(data.find(p => p.id === userId) || null)
          setIsOffline(false)
        } else {
          throw new Error(error?.message || 'Erreur')
        }
      } catch (error) {
        // Données démo déjà chargées
        setIsOffline(true)
      }
      setLoading(false)
    }

    // Différer après le premier rendu
    const timer = setTimeout(() => {
      fetchProfiles()
    }, 0)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function updateProfile(updates) {
    if (isOffline) {
      // Mode dégradé : simulation locale
      setProfile(p => ({ ...p, ...updates }))
      return true
    }

    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
      if (!error) {
        setProfile(p => ({ ...p, ...updates }))
      }
      return !error
    } catch (error) {
      console.log('🔍 DEBUG: Erreur lors de la mise à jour du profil:', error)
      return false
    }
  }

  return { profile, allProfiles, loading, isOffline, updateProfile }
}
