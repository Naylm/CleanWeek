import { Outlet, NavLink } from 'react-router-dom'
import './Layout.css'

const navItems = [
  { to: '/', label: 'Accueil', icon: '🏠' },
  { to: '/tasks', label: 'Tâches', icon: '🧹' },
  { to: '/planning', label: 'Planning', icon: '📅' },
  { to: '/settings', label: 'Réglages', icon: '⚙️' },
]

export default function Layout() {
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
