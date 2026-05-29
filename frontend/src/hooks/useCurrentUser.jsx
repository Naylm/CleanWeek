import { useState, useContext, createContext } from 'react'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [connected, setConnected] = useState(() => !!localStorage.getItem('cw_connected'))

  function login() {
    localStorage.setItem('cw_connected', '1')
    setConnected(true)
  }

  function logout() {
    localStorage.removeItem('cw_connected')
    setConnected(false)
  }

  return (
    <UserContext.Provider value={{ connected, login, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useCurrentUser() {
  return useContext(UserContext)
}
