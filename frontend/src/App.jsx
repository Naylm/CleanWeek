import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useCurrentUser } from './hooks/useCurrentUser'
import Layout from './components/Layout'

// Code splitting : chargement paresseux des pages pour réduire le bundle initial
const WhoAreYouPage = lazy(() => import('./pages/WhoAreYouPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const TasksPage = lazy(() => import('./pages/TasksPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

// Fallback minimal pour Suspense
const PageLoader = () => null

export default function App() {
  const { user } = useCurrentUser()

  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<WhoAreYouPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
