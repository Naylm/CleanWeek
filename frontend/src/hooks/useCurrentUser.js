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
  try {
    localStorage.setItem(STORAGE_KEY, slug)
  } catch (error) {
    console.error('Error saving user:', error)
  }
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY)
}

export function useCurrentUser() {
  const [user, setUser] = useState(() => getStoredUser())

  function selectUser(slug) {
    if (USERS[slug]) {
      setStoredUser(slug)
      setUser(USERS[slug])
    } else {
      console.error('User not found for slug:', slug)
    }
  }

  function logout() {
    clearStoredUser()
    setUser(null)
  }

  return { user, selectUser, logout, allUsers: Object.values(USERS) }
}
