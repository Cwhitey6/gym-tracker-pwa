/**
 * HistoryPage.jsx
 * 
 * Shows all past workouts grouped by date with the most recent first.
 * Each day is a collapsible card that shows every exercise for a day.
 * Expanding a day shows the individual sets with weight reps and volume.
 * Search can be used to filter by exercise name or muscle group and sessions 
 * that need to be removed can be deleted with the trash icon on each session card.
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/useAuth'
import Layout from '@/components/Layout'
import { Search, Calendar, Dumbbell, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { getSessions, getSets, deleteSession } from '@/db'

const TODAY_STR     = new Date().toDateString()
const YESTERDAY_STR = new Date(new Date().setDate(new Date().getDate() - 1)).toDateString()

export default function HistoryPage() {
  const { user } = useAuth()

  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState(null)  // which date card is open

  // load all sessions on mount
  // defined inside the effect so it doesnt need to be a dependency
  useEffect(() => {
    async function load() {
      try {
        const res = await getSessions(user.id)
        if (res?.success) {
          // load the sets for each session
          const withSets = await Promise.all(
            res.data.map(async s => {
              const setsRes = await getSets(s.id)
              return { ...s, sets: setsRes?.success ? setsRes.data : [] }
            })
          )
          setSessions(withSets)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.id])

  // reload after deleting a session
  async function handleDelete(sessionId) {
    await deleteSession(sessionId)
    try {
      const res = await getSessions(user.id)
      if (res?.success) {
        const withSets = await Promise.all(
          res.data.map(async s => {
            const setsRes = await getSets(s.id)
            return { ...s, sets: setsRes?.success ? setsRes.data : [] }
          })
        )
        setSessions(withSets)
      }
    } catch {
      // silent fail - worst case the list just doesnt refresh
    }
  }

  // filtering is just a calculation so no useEffect needed
  const filtered = sessions.filter(s => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      s.exerciseName.toLowerCase().includes(q) ||
      s.groupName.toLowerCase().includes(q)
    )
  })

  // group filtered sessions by date so each day is one card
  const grouped = filtered.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = []
    acc[s.date].push(s)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b) - new Date(a)
  )

  // total unique workout days and total volume across all sessions
  const totalWorkouts = sortedDates.length
  const totalVolume   = sessions.reduce(
    (sum, s) => sum + s.sets.reduce(
      (sv, set) => sv + set.weight * set.reps, 0
    ), 0
  )

  return (
    <Layout>
      <div className="p-4 sm:p-8 page-enter">

        {/* page header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            History
          </h1>
          <p className="text-gym-muted text-sm">
            {totalWorkouts} workouts ·{' '}
            {Math.round(totalVolume).toLocaleString()} lbs total
          </p>
        </div>

        {/* search bar */}
        <div className="relative mb-6">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2
                       text-gym-muted pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="input-dark pl-10"
          />
        </div>

        {/* skeleton loaders while fetching */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gym-surface rounded-2xl animate-pulse"/>
            ))}
          </div>
        ) : sortedDates.length === 0 ? (
          // empty state
          <div className="card text-center py-16">
            <Dumbbell size={36} className="text-gym-muted mx-auto mb-3"/>
            <p className="text-white font-medium mb-1">No workouts logged yet</p>
            <p className="text-gym-muted text-sm">
              Start a workout to see your history here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map(date => {
              const dateObj = new Date(date + 'T00:00:00')

              // use the pre-calculated strings to avoid calling new Date() during render
              const isToday = dateObj.toDateString() === TODAY_STR
              const isYest  = dateObj.toDateString() === YESTERDAY_STR

              const dateLabel = isToday ? 'Today'
                : isYest ? 'Yesterday'
                : dateObj.toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric'
                  })

              const daySessions = grouped[date]
              const dayVolume   = daySessions.reduce(
                (sum, s) => sum + s.sets.reduce(
                  (sv, set) => sv + set.weight * set.reps, 0
                ), 0
              )
              const daySetCount = daySessions.reduce(
                (sum, s) => sum + s.sets.length, 0
              )
              const isOpen = expanded === date

              return (
                <div
                  key={date}
                  className="border border-gym-border rounded-2xl overflow-hidden"
                >
                  {/* workout day header - clicking toggles the expanded state */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : date)}
                    className="w-full flex items-center gap-4 px-5 py-4
                               hover:bg-white/5 transition-colors duration-150"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gym-bg border
                                    border-gym-border flex items-center
                                    justify-center flex-shrink-0">
                      <Calendar size={16} className="text-gym-accent"/>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-white">{dateLabel}</p>
                      <p className="text-xs text-gym-muted mt-0.5">
                        {daySessions.length} exercise
                        {daySessions.length !== 1 ? 's' : ''} ·{' '}
                        {daySetCount} sets
                        {dayVolume > 0 &&
                          ` · ${Math.round(dayVolume).toLocaleString()} lbs`}
                      </p>
                    </div>
                    {/* chevron flips when expanded */}
                    {isOpen
                      ? <ChevronUp size={14} className="text-gym-muted flex-shrink-0"/>
                      : <ChevronDown size={14} className="text-gym-muted flex-shrink-0"/>
                    }
                  </button>

                  {/* expanded content shows each exercise logged that day */}
                  {isOpen && (
                    <div className="border-t border-gym-border animate-fade-in">
                      {daySessions.map((session, idx) => (
                        <div
                          key={session.id}
                          className={`px-5 py-4 ${
                            idx < daySessions.length - 1
                              ? 'border-b border-gym-border/50'
                              : ''
                          }`}
                        >
                          {/* exercise name and delete button */}
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-sm font-medium text-white">
                                {session.exerciseName}
                              </p>
                              <p className="text-xs text-gym-muted">
                                {session.groupName}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDelete(session.id)}
                              className="flex items-center gap-1.5 text-xs
                                         text-red-500 hover:text-red-400
                                         transition-colors duration-150 p-1"
                            >
                              <Trash2 size={12}/>
                            </button>
                          </div>

                          {/* set table column headers */}
                          <div className="grid grid-cols-4 gap-2 mb-1">
                            {['Set', 'Weight', 'Reps', 'Vol'].map(h => (
                              <span key={h} className="text-xs text-gym-muted">
                                {h}
                              </span>
                            ))}
                          </div>

                          {/* one row per set
                              time-based exercises show duration instead of weight/reps */}
                          {session.sets.map((s, si) => (
                            <div
                              key={s.id}
                              className="grid grid-cols-4 gap-2 py-1.5
                                         border-t border-gym-border/40"
                            >
                              <span className="text-xs text-gym-muted">{si + 1}</span>
                              <span className="text-xs text-white">
                                {s.duration > 0 ? `${s.duration}s` : `${s.weight}lbs`}
                              </span>
                              <span className="text-xs text-white">
                                {s.duration > 0 ? '-' : s.reps}
                              </span>
                              <span className="text-xs text-gym-accent">
                                {s.duration > 0
                                  ? `${s.duration}s`
                                  : Math.round(s.weight * s.reps).toLocaleString()}
                              </span>
                            </div>
                          ))}

                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}

      </div>
    </Layout>
  )
}