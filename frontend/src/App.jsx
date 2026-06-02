import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import TasksPage from './pages/TasksPage'
import PlanningPage from './pages/PlanningPage'
import SettingsPage from './pages/SettingsPage'
import ShoppingPage from './pages/ShoppingPage'
import Layout from './components/Layout'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/shopping" element={<ShoppingPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
