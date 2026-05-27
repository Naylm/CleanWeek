import { Routes, Route, Navigate } from 'react-router-dom'
import { useCurrentUser } from './hooks/useCurrentUser'
import WhoAreYouPage from './pages/WhoAreYouPage'
import HomePage from './pages/HomePage'
import TasksPage from './pages/TasksPage'
import ProfilePage from './pages/ProfilePage'
import Layout from './components/Layout'

export default function App() {
  const { user } = useCurrentUser()

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
