import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useCurrentUser } from './hooks/useCurrentUser'
import WhoAreYouPage from './pages/WhoAreYouPage'
import HomePage from './pages/HomePage'
import TasksPage from './pages/TasksPage'
import ProfilePage from './pages/ProfilePage'
import Layout from './components/Layout'

export default function App() {
  const { user } = useCurrentUser()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirige vers la bonne page quand l'utilisateur change
  useEffect(() => {
    if (!user && location.pathname !== '/') {
      navigate('/', { replace: true })
    }
  }, [user, location.pathname, navigate])

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<WhoAreYouPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
