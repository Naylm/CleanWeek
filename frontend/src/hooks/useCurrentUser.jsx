import { useState, useContext, createContext, useEffect } from 'react'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [connected, setConnected] = useState(() => !!localStorage.getItem('cw_connected'))
  const [theme, setThemeState] = useState(() => localStorage.getItem('cw_theme') || 'rose')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('cw_theme', theme)
  }, [theme])

  function login() {
    localStorage.setItem('cw_connected', '1')
    setConnected(true)
  }

  function logout() {
    localStorage.removeItem('cw_connected')
    setConnected(false)
  }

  function setTheme(newTheme) {
    setThemeState(newTheme)
  }

  return (
    <UserContext.Provider value={{ connected, login, logout, theme, setTheme }}>
      {children}
    </UserContext.Provider>
  )
}

export function useCurrentUser() {
  return useContext(UserContext)
}
