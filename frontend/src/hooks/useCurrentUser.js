import { useState } from 'react'

const STORAGE_KEY = 'cleanweek_user_id'

export function getStoredUserId() {
  return localStorage.getItem(STORAGE_KEY) || null
}

export function useCurrentUser() {
  const [userId, setUserId] = useState(() => getStoredUserId())

  // user est juste { id } — le profil complet est chargé par useProfile
  const user = userId ? { id: userId } : null

  function selectUser(id) {
    localStorage.setItem(STORAGE_KEY, id)
    setUserId(id)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUserId(null)
  }

  return { user, selectUser, logout }
}
