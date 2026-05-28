import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
  const [profile, setProfile] = useState(null)
  const [allProfiles, setAllProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function fetchProfiles() {
      try {
        console.log('🔍 DEBUG: Tentative de connexion à Supabase pour les profils...')
        const { data, error } = await supabase.from('profiles').select('*')
        
        if (!error && data) {
          console.log('🔍 DEBUG: Profils chargés depuis Supabase:', data.length)
          setAllProfiles(data)
          setProfile(data.find(p => p.id === userId) || null)
          setIsOffline(false)
        } else {
          throw new Error(error?.message || 'Erreur Supabase')
        }
      } catch (error) {
        console.log('🔍 DEBUG: Erreur Supabase pour les profils, utilisation du mode dégradé:', error.message)
        const demoData = getDemoProfiles(userId)
        setAllProfiles(demoData.allProfiles)
        setProfile(demoData.profile)
        setIsOffline(true)
      }
      setLoading(false)
    }

    fetchProfiles()

    // Ne pas créer de canal si nous sommes en mode dégradé
    if (!isOffline) {
      try {
        const channel = supabase
          .channel('profiles-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchProfiles)
          .subscribe()

        return () => {
          try {
            supabase.removeChannel(channel)
          } catch (error) {
            console.log('🔍 DEBUG: Erreur lors de la suppression du canal de profils:', error)
          }
        }
      } catch (error) {
        console.log('🔍 DEBUG: Impossible de créer le canal WebSocket pour les profils:', error)
      }
    }
  }, [userId, isOffline])

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
