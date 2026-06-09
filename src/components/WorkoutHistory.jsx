/**
 * WorkoutHistory.jsx
 * 
 * Shows a list of previous sessions for a specific exercise on ExercisePage.
 * Each session is a collapsible card if tapped it expands and the
 * individual sets, volume, and any notes wrote in are displayed. There's also a
 * delete button inside each expanded session to remove it.
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

// props coming in from ExercisePage:
// - sessions: array of past sessions for this exercise, each with their sets
// - onDelete: function to call when the delete button is clicked
export default function WorkoutHistory({ sessions, onDelete }) {
  // tracks which session is currently expanded - stores the session id
  // null means nothing is expanded
  const [expanded, setExpanded] = useState(null)

  // no sessions logged yet - show an empty state message
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
      {sessions.map((session) => {
        const isOpen = expanded === session.id
        const date   = new Date(session.date)

        // show "Today" if it was logged today, otherwise show the date
        const isToday   = date.toDateString() === new Date().toDateString()
        const dateLabel = isToday
          ? 'Today'
          : date.toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            })

        // calculate total volume for this session (weight × reps across all sets)
        const totalVolume = session.sets?.reduce(
          (sum, s) => sum + s.weight * s.reps, 0
        ) ?? 0

        return (
          <div
            key={session.id}
            className="border border-gym-border rounded-xl overflow-hidden
                       transition-all duration-150"
          >
            {/* session header - clicking this toggles the expanded state */}
            <button
              onClick={() => setExpanded(isOpen ? null : session.id)}
              className="w-full flex items-center justify-between px-4 py-3
                         hover:bg-white/5 transition-colors duration-150"
            >
              <div className="flex items-center gap-3">
                {/* small orange dot on the left */}
                <div className="w-2 h-2 rounded-full bg-gym-accent flex-shrink-0"/>
                <div className="text-left">
                  {/* date label */}
                  <p className="text-sm font-medium text-white">{dateLabel}</p>
                  {/* set count and total volume as a subtitle */}
                  <p className="text-xs text-gym-muted">
                    {session.sets?.length ?? 0} sets
                    {totalVolume > 0 && ` · ${Math.round(totalVolume).toLocaleString()} lbs total`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* show a preview of the notes if there are any - desktop only */}
                {session.notes && (
                  <span className="text-xs text-gym-muted hidden sm:block truncate max-w-24">
                    {session.notes}
                  </span>
                )}
                {/* chevron arrow that flips when expanded */}
                {isOpen
                  ? <ChevronUp size={14} className="text-gym-muted"/>
                  : <ChevronDown size={14} className="text-gym-muted"/>
                }
              </div>
            </button>

            {/* expanded content - only renders when this session is open */}
            {isOpen && (
              <div className="border-t border-gym-border bg-gym-bg px-4 py-3 animate-fade-in">

                {/* sets table with column headers */}
                <div className="mb-3">
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {['Set', 'Weight', 'Reps', 'Volume'].map(h => (
                      <span key={h} className="text-xs font-medium text-gym-muted">
                        {h}
                      </span>
                    ))}
                  </div>

                  {/* one row per set */}
                  {session.sets?.map((s, si) => (
                    <div
                      key={s.id}
                      className="grid grid-cols-4 gap-2 py-1.5 border-t border-gym-border/50"
                    >
                      {/* set number - add 1 so it shows 1, 2, 3 not 0, 1, 2 */}
                      <span className="text-xs text-gym-muted">{si + 1}</span>
                      <span className="text-xs text-white">{s.weight} lbs</span>
                      <span className="text-xs text-white">{s.reps}</span>
                      {/* volume for this individual set */}
                      <span className="text-xs text-gym-accent">
                        {Math.round(s.weight * s.reps).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* session notes - only shows if you left a note */}
                {session.notes && (
                  <p className="text-xs text-gym-muted italic mb-3">
                    "{session.notes}"
                  </p>
                )}

                {/* delete button - turns red on hover to signal it's destructive */}
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