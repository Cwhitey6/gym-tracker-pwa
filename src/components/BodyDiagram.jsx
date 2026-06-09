/**
 * BodyDiagram.jsx
 * 
 * This is the muscle group selector that lives on the dashboard.
 * It shows 5 clickable buttons, one for each muscle group and
 * navigates you to that group's exercise page when you tap one.
 * Each button has a subtle color glow that brightens on hover.
 */

import { useNavigate } from 'react-router-dom'

// each region maps to a muscle group page via its route
// the colors match the muscle group colors used throughout the rest of the app
// the route numbers (1-5) match the muscle_group IDs in the database
const REGIONS = [
  { id: 'shoulders', label: 'Shoulders & Neck',        color: '#6366f1', route: '/group/1', icon: '💪' },
  { id: 'back',      label: 'Back, Biceps & Forearms', color: '#06b6d4', route: '/group/2', icon: '🏋️' },
  { id: 'chest',     label: 'Chest & Triceps',         color: '#e85d04', route: '/group/3', icon: '💥' },
  { id: 'legs',      label: 'Legs',                    color: '#22c55e', route: '/group/4', icon: '🦵' },
  { id: 'cardio',    label: 'Cardio & Abs',            color: '#f59e0b', route: '/group/5', icon: '❤️' },
]

export default function BodyDiagram() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-2 w-full">

      {/* label above the buttons */}
      <p className="text-xs font-medium text-gym-muted mb-2 tracking-widest uppercase text-center">
        Select Muscle Group
      </p>

      {/* loop through each region and render a button for it */}
      {REGIONS.map(r => (
        <button
          key={r.id}
          onClick={() => navigate(r.route)}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl
                     border transition-all duration-150 hover:scale-[1.02]
                     active:scale-95 text-left group"
          style={{
            // default state, very faint background and border using the region color
            // "11" and "33" at the end are hex opacity values (low opacity)
            background:  r.color + '11',
            borderColor: r.color + '33',
          }}
          onMouseEnter={e => {
            // on hover brighten the background and border
            // "22" and "66" are higher opacity values so it glows more
            e.currentTarget.style.background  = r.color + '22'
            e.currentTarget.style.borderColor = r.color + '66'
          }}
          onMouseLeave={e => {
            // on mouse leave - go back to the faint default state
            e.currentTarget.style.background  = r.color + '11'
            e.currentTarget.style.borderColor = r.color + '33'
          }}
        >
          {/* emoji icon on the left */}
          <span className="text-lg">{r.icon}</span>

          {/* muscle group name */}
          <span className="text-sm font-medium text-white">{r.label}</span>

          {/* arrow on the right, colored to match the region */}
          <span className="ml-auto text-xs" style={{ color: r.color }}>→</span>
        </button>
      ))}

    </div>
  )
}