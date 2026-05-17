// src/components/WorkoutHistory.jsx
import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

export default function WorkoutHistory({ sessions, onDelete }) {
  const [expanded, setExpanded] = useState(null)

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gym-muted text-sm">No sessions logged yet</p>
        <p className="text-gym-muted text-xs mt-1">
          Log your first workout above
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map((session, i) => {
        const isOpen   = expanded === session.id
        const date     = new Date(session.date)
        const isToday  = date.toDateString() === new Date().toDateString()
        const dateLabel = isToday
          ? 'Today'
          : date.toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            })

        const totalVolume = session.sets?.reduce(
          (sum, s) => sum + s.weight * s.reps, 0
        ) ?? 0

        return (
          <div key={session.id}
               className="border border-gym-border rounded-xl overflow-hidden
                          transition-all duration-150">

            {/* Session header */}
            <button
              onClick={() => setExpanded(isOpen ? null : session.id)}
              className="w-full flex items-center justify-between px-4 py-3
                         hover:bg-white/5 transition-colors duration-150"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gym-accent flex-shrink-0"/>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">{dateLabel}</p>
                  <p className="text-xs text-gym-muted">
                    {session.sets?.length ?? 0} sets
                    {totalVolume > 0 && ` · ${Math.round(totalVolume).toLocaleString()} lbs total`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {session.notes && (
                  <span className="text-xs text-gym-muted hidden sm:block truncate max-w-24">
                    {session.notes}
                  </span>
                )}
                {isOpen
                  ? <ChevronUp size={14} className="text-gym-muted"/>
                  : <ChevronDown size={14} className="text-gym-muted"/>
                }
              </div>
            </button>

            {/* Expanded sets */}
            {isOpen && (
              <div className="border-t border-gym-border bg-gym-bg
                              px-4 py-3 animate-fade-in">

                {/* Sets table */}
                <div className="mb-3">
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {['Set', 'Weight', 'Reps', 'Volume'].map(h => (
                      <span key={h}
                            className="text-xs font-medium text-gym-muted">
                        {h}
                      </span>
                    ))}
                  </div>
                  {session.sets?.map((s, si) => (
                    <div key={s.id}
                         className="grid grid-cols-4 gap-2 py-1.5
                                    border-t border-gym-border/50">
                      <span className="text-xs text-gym-muted">
                        {si + 1}
                      </span>
                      <span className="text-xs text-white">
                        {s.weight} lbs
                      </span>
                      <span className="text-xs text-white">{s.reps}</span>
                      <span className="text-xs text-gym-accent">
                        {Math.round(s.weight * s.reps).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {session.notes && (
                  <p className="text-xs text-gym-muted italic mb-3">
                    "{session.notes}"
                  </p>
                )}

                {/* Delete session */}
                <button
                  onClick={() => onDelete(session.id)}
                  className="flex items-center gap-1.5 text-xs text-red-500
                             hover:text-red-400 transition-colors duration-150"
                >
                  <Trash2 size={12}/>
                  Delete session
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}