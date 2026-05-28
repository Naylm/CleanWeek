import { useState, useEffect } from 'react'

const USERS = {
  laura: {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Laura',
    slug: 'laura',
    color: '#FF6584',
  },
  melvin: {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Melvin',
    slug: 'melvin',
    color: '#6C63FF',
  },
}

const STORAGE_KEY = 'cleanweek_user'

export function getStoredUser() {
  const slug = localStorage.getItem(STORAGE_KEY)
  return slug ? USERS[slug] || null : null
}

export function setStoredUser(slug) {
  console.log('🔍 DEBUG: setStoredUser called with slug:', slug)
  try {
    localStorage.setItem(STORAGE_KEY, slug)
    console.log('🔍 DEBUG: localStorage.setItem completed')
    // Vérification que la valeur a bien été stockée
    const stored = localStorage.getItem(STORAGE_KEY)
    console.log('🔍 DEBUG: Verification - stored value:', stored)
  } catch (error) {
    console.error('🔍 DEBUG: Error in localStorage.setItem:', error)
  }
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY)
}

export function useCurrentUser() {
  const [user, setUser] = useState(() => getStoredUser())

  function selectUser(slug) {
    console.log('🔍 DEBUG: selectUser called with slug:', slug)
    console.log('🔍 DEBUG: USERS object:', USERS)
    console.log('🔍 DEBUG: USERS[slug] exists?', !!USERS[slug])
    
    if (USERS[slug]) {
      console.log('🔍 DEBUG: User found, calling setStoredUser with:', slug)
      setStoredUser(slug)
      console.log('🔍 DEBUG: setStoredUser completed, calling setUser with:', USERS[slug])
      setUser(USERS[slug])
      console.log('🔍 DEBUG: setUser completed')
    } else {
      console.error('🔍 DEBUG: User not found for slug:', slug)
    }
  }

  function logout() {
    clearStoredUser()
    setUser(null)
  }

  return { user, selectUser, logout, allUsers: Object.values(USERS) }
}
