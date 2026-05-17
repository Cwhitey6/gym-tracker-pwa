// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, History, TrendingUp,
  Dumbbell, Settings, LogOut
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/history',   icon: History,         label: 'History'   },
  { to: '/progress',  icon: TrendingUp,      label: 'Progress'  },
  { to: '/exercises', icon: Dumbbell,        label: 'Exercises' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <aside className="w-56 bg-gym-surface border-r border-gym-border
                      flex flex-col h-screen fixed left-0 top-0 z-20">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gym-border">
        <div className="w-8 h-8 bg-gym-accent rounded-lg flex items-center
                        justify-center text-base flex-shrink-0">
          🏋️
        </div>
        <span className="font-semibold text-white text-sm tracking-tight">
          Gym Tracker
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
               font-medium transition-all duration-150
               ${isActive
                 ? 'bg-gym-accent/10 text-gym-accent'
                 : 'text-gym-muted hover:text-white hover:bg-white/5'
               }`
            }
          >
            <Icon size={17}/>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-gym-border space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-7 h-7 rounded-full bg-gym-accent flex items-center
                          justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-white font-medium truncate">
            {user?.username}
          </span>
        </div>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
             font-medium transition-all duration-150
             ${isActive
               ? 'bg-gym-accent/10 text-gym-accent'
               : 'text-gym-muted hover:text-white hover:bg-white/5'
             }`
          }
        >
          <Settings size={17}/>
          Settings
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                     font-medium text-gym-muted hover:text-red-400
                     hover:bg-red-400/5 transition-all duration-150 w-full"
        >
          <LogOut size={17}/>
          Sign out
        </button>
      </div>
    </aside>
  )
}