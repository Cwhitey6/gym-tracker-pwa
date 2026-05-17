// src/components/BottomNav.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, History,
  TrendingUp, Dumbbell, Settings
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home'      },
  { to: '/history',   icon: History,         label: 'History'   },
  { to: '/progress',  icon: TrendingUp,      label: 'Progress'  },
  { to: '/exercises', icon: Dumbbell,        label: 'Exercises' },
  { to: '/settings',  icon: Settings,        label: 'Settings'  },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50
                    bg-gym-surface border-t border-gym-border
                    flex items-center justify-around
                    px-2 pb-safe"
         style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-3 py-2
             rounded-xl transition-all duration-150 min-w-0
             ${isActive
               ? 'text-gym-accent'
               : 'text-gym-muted'
             }`
          }
        >
          <Icon size={22}/>
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}