import { Outlet, NavLink } from 'react-router-dom'
import { useRealtimeStatus } from '../contexts/RealtimeContext.jsx'
import './Layout.css'

const navItems = [
  { to: '/', label: 'Accueil', icon: '🏠' },
  { to: '/tasks', label: 'Tâches', icon: '🧹' },
  { to: '/planning', label: 'Menu', icon: '📅' },
  { to: '/shopping', label: 'Courses', icon: '🛒' },
  { to: '/settings', label: 'Réglages', icon: '⚙️' },
]

export default function Layout() {
  const { isConnected } = useRealtimeStatus() || {}

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
        {/* Indicateur temps réel */}
        <div className={`realtime-indicator${isConnected ? ' connected' : ''}`} title={isConnected ? 'Temps réel connecté' : 'Temps réel déconnecté'}>
          <span className="realtime-dot" />
        </div>
      </nav>
    </div>
  )
}
