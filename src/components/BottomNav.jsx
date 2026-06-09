/**
 * BottomNav.jsx
 * 
 * The navigation bar that sits at the bottom of the screen on mobile devices.
 * 
 * On desktop (md screens and above) this is hidden and the sidebar
 * takes over instead. The safe area padding at the bottom makes sure
 * the nav bar doesn't get covered by the home indicator on mobile devices.
 */

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, History,
  TrendingUp, Dumbbell, Settings
} from 'lucide-react'

// the 5 tabs that appear in the bottom nav
// each one has a route, an icon from lucide-react, and a label
const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home'      },
  { to: '/history',   icon: History,         label: 'History'   },
  { to: '/progress',  icon: TrendingUp,      label: 'Progress'  },
  { to: '/exercises', icon: Dumbbell,        label: 'Exercises' },
  { to: '/settings',  icon: Settings,        label: 'Settings'  },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50
                 bg-gym-surface border-t border-gym-border
                 flex items-center justify-around px-2"
      style={{
        
        // env(safe-area-inset-bottom) is an iPhone specific CSS value that
        // adds padding so the nav bar clears the home indicator at the bottom
        // of the screen. max() makes sure it's at least 12px even on older
        // iphones that don't have a home indicator
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))'
      }}
    >
      
      {/* loop through each nav item and render a link for it */}
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            // isActive is true when you're currently on that page
            // active tabs get the orange accent color, inactive ones are muted gray
            `flex flex-col items-center gap-1 px-3 py-2
             rounded-xl transition-all duration-150 min-w-0
             ${isActive ? 'text-gym-accent' : 'text-gym-muted'}`
          }
        >
          {/* the icon */}
          <Icon size={22}/>

          {/* the label underneath the icon */}
          <span className="text-[10px] font-medium">{label}</span>

        </NavLink>
      ))}
    </nav>
  )
}