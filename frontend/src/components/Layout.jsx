import { Outlet, NavLink } from 'react-router-dom'
import { useFeatures } from '../hooks/FeaturesProvider.jsx'
import './Layout.css'

const baseNavItems = [
  { to: '/', label: 'Accueil', icon: '🏠' },
  { to: '/tasks', label: 'Tâches', icon: '🧹' },
  { to: '/planning', label: 'Menu', icon: '📅' },
]

const settingsItem = { to: '/settings', label: 'Réglages', icon: '⚙️' }

export default function Layout() {
  const { features, loading } = useFeatures()

  const navItems = [...baseNavItems]
  
  if (!loading && features.shopping_page_enabled) {
    navItems.push({ to: '/shopping', label: 'Courses', icon: '🛒' })
  }
  
  navItems.push(settingsItem)

  return (
    <div className="layout">
      <main className="layout-main">
        <Outlet />
      </main>
      <nav className="layout-nav">
        {navItems.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
