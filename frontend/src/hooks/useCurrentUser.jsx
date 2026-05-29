import { useState, useContext, createContext } from 'react'

const STORAGE_KEY = 'cleanweek_user_id'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [userId, setUserId] = useState(() => localStorage.getItem(STORAGE_KEY) || null)

  function selectUser(id) {
    localStorage.setItem(STORAGE_KEY, id)
    setUserId(id)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUserId(null)
  }

  const user = userId ? { id: userId } : null

  return (
    <UserContext.Provider value={{ user, selectUser, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useCurrentUser() {
  return useContext(UserContext)
}
