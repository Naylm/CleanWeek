import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [allProfiles, setAllProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProfiles = useCallback(async () => {
    try {
      const data = await api.get('/profiles')
      setAllProfiles(data)
      setProfile(data.find(p => p.id === userId) || null)
    } catch (err) {
      console.error('Failed to fetch profiles:', err)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchProfiles()
    const interval = setInterval(fetchProfiles, 2000)
    return () => clearInterval(interval)
  }, [fetchProfiles])

  async function updateProfile(updates) {
    try {
      await api.patch(`/profiles/${userId}`, updates)
      setProfile(p => ({ ...p, ...updates }))
      fetchProfiles()
      return true
    } catch (err) {
      console.error('Failed to update profile:', err)
      return false
    }
  }

  return { profile, allProfiles, loading, updateProfile }
}
