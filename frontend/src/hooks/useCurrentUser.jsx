import { useState, useContext, createContext, useEffect } from 'react'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('cw_theme') || 'rose')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('cw_theme', theme)
  }, [theme])

  function setTheme(newTheme) {
    setThemeState(newTheme)
  }

  return (
    <UserContext.Provider value={{ theme, setTheme }}>
      {children}
    </UserContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentUser() {
  return useContext(UserContext)
}
