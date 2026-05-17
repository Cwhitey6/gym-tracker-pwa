// src/components/BodyDiagram.jsx
import { useNavigate } from 'react-router-dom'

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
      <p className="text-xs font-medium text-gym-muted mb-2
                    tracking-widest uppercase text-center">
        Select Muscle Group
      </p>
      {REGIONS.map(r => (
        <button
          key={r.id}
          onClick={() => navigate(r.route)}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl
                     border transition-all duration-150 hover:scale-[1.02]
                     active:scale-95 text-left group"
          style={{
            background:   r.color + '11',
            borderColor:  r.color + '33',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background   = r.color + '22'
            e.currentTarget.style.borderColor  = r.color + '66'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background   = r.color + '11'
            e.currentTarget.style.borderColor  = r.color + '33'
          }}
        >
          <span className="text-lg">{r.icon}</span>
          <span className="text-sm font-medium text-white">{r.label}</span>
          <span className="ml-auto text-xs"
                style={{ color: r.color }}>→</span>
        </button>
      ))}
    </div>
  )
}