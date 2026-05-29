import { Routes, Route, Navigate } from 'react-router-dom'
import { useCurrentUser } from './hooks/useCurrentUser'
import HomePage from './pages/HomePage'
import TasksPage from './pages/TasksPage'
import PlanningPage from './pages/PlanningPage'
import SettingsPage from './pages/SettingsPage'
import Layout from './components/Layout'
import './App.css'

export default function App() {
  const { connected } = useCurrentUser()

  if (!connected) {
    return (
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function WelcomePage() {
  const { login } = useCurrentUser()
  return (
    <div className="welcome-page">
      <div className="welcome-bg">
        <div className="welcome-card">
          <div className="welcome-mascot">🐱</div>
          <h1>CleanWeek</h1>
          <p>La maison ensemble, tout en douceur</p>
          <button className="welcome-btn" onClick={login}>
            Entrer 🏠
          </button>
        </div>
      </div>
    </div>
  )
}
