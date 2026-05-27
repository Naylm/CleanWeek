import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [allProfiles, setAllProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    async function fetchProfiles() {
      const { data } = await supabase.from('profiles').select('*')
      if (data) {
        setAllProfiles(data)
        setProfile(data.find(p => p.id === userId) || null)
      }
      setLoading(false)
    }

    fetchProfiles()

    const channel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchProfiles)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  async function updateProfile(updates) {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
    if (!error) {
      setProfile(p => ({ ...p, ...updates }))
    }
    return !error
  }

  return { profile, allProfiles, loading, updateProfile }
}
