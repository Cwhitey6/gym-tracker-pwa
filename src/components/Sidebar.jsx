/**
 * Sidebar.jsx
 * 
 * The navigation panel that sits on the left side of the screen on desktop.
 * It has the app logo at the top, the main nav links in the middle, and
 * username + settings + sign out at the bottom.
 * 
 * On mobile this is hidden and BottomNav takes over instead.
 * The active page link gets highlighted in orange so you always know
 * where you are in the app.
 */

import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'
import {
  LayoutDashboard, History, TrendingUp,
  Dumbbell, Settings, LogOut
} from 'lucide-react'

// the main nav links that appear in the middle of the sidebar
const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/history',   icon: History,         label: 'History'   },
  { to: '/progress',  icon: TrendingUp,      label: 'Progress'  },
  { to: '/exercises', icon: Dumbbell,        label: 'Exercises' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // signs the user out and sends them back to the login page
  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    // fixed to the left side of the screen, full height, 224px wide
    <aside className="w-56 bg-gym-surface border-r border-gym-border
                      flex flex-col h-screen fixed left-0 top-0 z-20">

      {/* app logo and name at the very top */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gym-border">
        <div className="w-8 h-8 bg-gym-accent rounded-lg flex items-center
                        justify-center text-base flex-shrink-0">
          🏋️
        </div>
        <span className="font-semibold text-white text-sm tracking-tight">
          Gym Tracker
        </span>
      </div>

      {/* main nav links - flex-1 makes this section grow to fill available space */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              // isActive is true when you're currently on that page
              // active links get an orange tint, inactive ones are muted gray
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

      {/* bottom section - username, settings link, and sign out button */}
      <div className="px-3 py-4 border-t border-gym-border space-y-1">

        {/* username display with first letter as avatar */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-7 h-7 rounded-full bg-gym-accent flex items-center
                          justify-center text-xs font-bold text-white flex-shrink-0">
            {/* grab the first letter of the username and capitalize it */}
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-white font-medium truncate">
            {user?.username}
          </span>
        </div>

        {/* settings link - same active styling as the main nav links */}
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

        {/* sign out button - turns red on hover to signal it's destructive */}
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